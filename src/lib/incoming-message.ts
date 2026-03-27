import type { SupabaseClient } from "@supabase/supabase-js";
import { classifyLeadTag, generateAssistantReply } from "@/lib/openai";
import { normalizeWhatsappPhone, sendWhatsappTextMessage } from "@/lib/whatsapp";

type Sb = SupabaseClient;

interface IncomingTextPayload {
  phoneNumberId: string;
  from: string;
  body: string;
  /** WhatsApp Cloud API message id (msg.id) — prevents duplicate processing on retries */
  messageId?: string;
}

function detectLanguage(text: string): "si" | "ta" | "en" {
  if (/[\u0D80-\u0DFF]/.test(text)) return "si";
  if (/[\u0B80-\u0BFF]/.test(text)) return "ta";
  return "en";
}

function getFallbackReply(language: "si" | "ta" | "en"): string {
  if (language === "si") return "හෙලෝ 😊 ඔබට අද මම කොහොමද උදව් වෙන්නෙ?";
  if (language === "ta") return "வணக்கம் 😊 இன்று நான் எப்படி உதவலாம்?";
  const fallbacks = [
    "Hi 😊 How can I help you today?",
    "Can you tell me more about your requirement?",
    "Sure 👍 Let me help you with that",
  ];
  return fallbacks[Math.floor(Math.random() * fallbacks.length)] ?? fallbacks[0];
}

function extractLeadFields(message: string): { name?: string; service_interest?: string; budget?: string } {
  const out: { name?: string; service_interest?: string; budget?: string } = {};
  const lowered = message.toLowerCase();

  const nameMatch =
    message.match(/\bmy name is\s+([a-zA-Z][a-zA-Z\s'-]{1,40})/i) ??
    message.match(/\bi am\s+([a-zA-Z][a-zA-Z\s'-]{1,40})/i);
  if (nameMatch?.[1]) {
    out.name = nameMatch[1].trim();
  }

  const serviceKeywords = [
    "room",
    "booking",
    "tour",
    "service",
    "package",
    "appointment",
    "consultation",
    "delivery",
    "repair",
  ];
  const service = serviceKeywords.find((k) => lowered.includes(k));
  if (service) {
    out.service_interest = service;
  }

  const budgetMatch = message.match(/(?:rs\.?|lkr|\$)\s?\d[\d,]*/i) ?? message.match(/\b\d{3,}\b/);
  if (budgetMatch?.[0]) {
    out.budget = budgetMatch[0].trim();
  }

  return out;
}

export async function processIncomingWhatsappMessage(
  supabase: Sb,
  payload: IncomingTextPayload
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (payload.messageId) {
    const { data: dup } = await supabase
      .from("messages")
      .select("id")
      .eq("wa_message_id", payload.messageId)
      .maybeSingle();
    if (dup) {
      return { ok: true };
    }
  }

  const { data: account, error: accErr } = await supabase
    .from("whatsapp_accounts")
    .select("id, user_id, access_token, phone_number_id")
    .eq("phone_number_id", payload.phoneNumberId)
    .maybeSingle();

  if (accErr || !account) {
    return { ok: false, error: accErr?.message ?? "Unknown phone_number_id" };
  }

  const userId = account.user_id;

  const { data: user, error: userError } = await supabase
    .from("users")
    .select("lead_fields")
    .eq("id", userId)
    .single();

  if (userError) {
    console.error("Error fetching lead fields:", userError);
  }

  const leadFields = user?.lead_fields || ["name", "service", "budget"];
  console.log("Lead fields:", leadFields);

  const phone = normalizeWhatsappPhone(payload.from);

  const { data: existingContact } = await supabase
    .from("contacts")
    .select("id, name")
    .eq("user_id", account.user_id)
    .eq("phone", phone)
    .maybeSingle();

  let contactId: string;
  if (existingContact) {
    contactId = existingContact.id;
  } else {
    const { data: created, error: cErr } = await supabase
      .from("contacts")
      .insert({
        user_id: account.user_id,
        phone,
        name: null,
        tag: "cold",
        last_message: payload.body,
        custom_fields: {},
      })
      .select("id")
      .single();
    if (cErr || !created) {
      return { ok: false, error: cErr?.message ?? "Failed to create contact" };
    }
    contactId = created.id;
  }

  const { error: inErr } = await supabase.from("messages").insert({
    user_id: account.user_id,
    contact_id: contactId,
    content: payload.body,
    direction: "incoming",
    wa_message_id: payload.messageId ?? null,
  });
  if (inErr) {
    if (inErr.code === "23505" || inErr.message.includes("duplicate")) {
      return { ok: true };
    }
    return { ok: false, error: inErr.message };
  }

  await supabase
    .from("contacts")
    .update({ last_message: payload.body })
    .eq("id", contactId);

  const extracted = extractLeadFields(payload.body);
  if (Object.keys(extracted).length > 0) {
    console.log("lead_extraction", { contactId, extracted });
    await supabase.from("contacts").update(extracted).eq("id", contactId);
  }

  const { data: recent } = await supabase
    .from("messages")
    .select("content, direction")
    .eq("contact_id", contactId)
    .order("created_at", { ascending: true })
    .limit(10);

  const lines = (recent ?? []).map((m) =>
    m.direction === "incoming" ? `User: ${m.content}` : `Assistant: ${m.content}`
  );

  try {
    const tag = await classifyLeadTag({
      contactName: existingContact?.name ?? null,
      lastMessages: lines,
    });
    await supabase.from("contacts").update({ tag }).eq("id", contactId);
  } catch (e) {
    console.error("classifyLeadTag", e);
  }

  const { data: bot } = await supabase
    .from("bots")
    .select("prompt, is_active")
    .eq("user_id", account.user_id)
    .maybeSingle();

  if (bot?.is_active) {
    const language = detectLanguage(payload.body);
    try {
      const conversation: { role: "user" | "assistant"; content: string }[] = [];
      for (const m of recent ?? []) {
        conversation.push({
          role: m.direction === "incoming" ? "user" : "assistant",
          content: m.content,
        });
      }

      console.log("ai_reply_context", { contactId, language, historyCount: conversation.length });
      const replyText = await generateAssistantReply({
        systemPrompt: `${bot.prompt}\nDetected user language: ${language}. Reply in this same language.`,
        conversation,
      });

      await new Promise((resolve) => setTimeout(resolve, 1200));

      const { error: outErr } = await supabase.from("messages").insert({
        user_id: account.user_id,
        contact_id: contactId,
        content: replyText,
        direction: "outgoing",
        wa_message_id: null,
      });
      if (outErr) {
        console.error("save outgoing AI", outErr);
      } else {
        await supabase
          .from("contacts")
          .update({ last_message: replyText })
          .eq("id", contactId);
      }

      await sendWhatsappTextMessage({
        accessToken: account.access_token,
        phoneNumberId: account.phone_number_id,
        to: phone,
        text: replyText,
      });
    } catch (e) {
      console.error("AI reply pipeline", e);
      const fallback = getFallbackReply(detectLanguage(payload.body));
      try {
        await supabase.from("messages").insert({
          user_id: account.user_id,
          contact_id: contactId,
          content: fallback,
          direction: "outgoing",
          wa_message_id: null,
        });
        await supabase.from("contacts").update({ last_message: fallback }).eq("id", contactId);
        await sendWhatsappTextMessage({
          accessToken: account.access_token,
          phoneNumberId: account.phone_number_id,
          to: phone,
          text: fallback,
        });
      } catch (fallbackErr) {
        console.error("fallback reply pipeline", fallbackErr);
      }
    }
  }

  return { ok: true };
}
