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

  const { data: recent } = await supabase
    .from("messages")
    .select("content, direction")
    .eq("contact_id", contactId)
    .order("created_at", { ascending: true })
    .limit(40);

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
    try {
      const conversation: { role: "user" | "assistant"; content: string }[] = [];
      for (const m of recent ?? []) {
        conversation.push({
          role: m.direction === "incoming" ? "user" : "assistant",
          content: m.content,
        });
      }

      const replyText = await generateAssistantReply({
        systemPrompt: bot.prompt,
        conversation,
      });

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
    }
  }

  return { ok: true };
}
