import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/api-auth";
import { createClient } from "@/lib/supabase/server";
import { isTrialActive } from "@/lib/trial";
import { generateAssistantReply } from "@/lib/openai";
import { sendWhatsappTextMessage } from "@/lib/whatsapp";

const bodySchema = z.object({
  contactId: z.string().uuid(),
});

/**
 * Generates an AI reply from stored conversation history and sends it on WhatsApp.
 * Use when you want to re-trigger AI without a new inbound webhook event.
 */
export async function POST(request: Request) {
  const auth = await requireUser();
  if ("error" in auth) {
    return auth.error;
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const supabase = await createClient();
  const { contactId } = parsed.data;

  const { data: appUser, error: uErr } = await supabase
    .from("users")
    .select("id, is_pro, trial_end")
    .eq("id", auth.user.id)
    .maybeSingle();

  if (uErr || !appUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (!isTrialActive(appUser)) {
    console.log("Trial expired:", appUser.id);
    return NextResponse.json({ error: "Trial expired. Please upgrade." }, { status: 403 });
  }

  const { data: contact, error: cErr } = await supabase
    .from("contacts")
    .select("id, phone, user_id")
    .eq("id", contactId)
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (cErr || !contact) {
    return NextResponse.json({ error: "Contact not found" }, { status: 404 });
  }

  const { data: bot } = await supabase
    .from("bots")
    .select("prompt, is_active")
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (!bot?.is_active) {
    return NextResponse.json({ error: "AI is turned off" }, { status: 400 });
  }

  const { data: history } = await supabase
    .from("messages")
    .select("content, direction")
    .eq("contact_id", contactId)
    .order("created_at", { ascending: true })
    .limit(10);

  if (!history?.length) {
    return NextResponse.json({ error: "No messages for this contact" }, { status: 400 });
  }

  const conversation: { role: "user" | "assistant"; content: string }[] = [];
  for (const m of history) {
    conversation.push({
      role: m.direction === "incoming" ? "user" : "assistant",
      content: m.content,
    });
  }

  let replyText: string;
  try {
    const latestIncoming =
      [...history].reverse().find((m) => m.direction === "incoming")?.content ?? "";
    replyText = await generateAssistantReply({
      systemPrompt: `${bot.prompt}\nLatest customer message: ${latestIncoming}`,
      conversation,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "OpenAI error";
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  const { data: account } = await supabase
    .from("whatsapp_accounts")
    .select("access_token, phone_number_id")
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (!account) {
    return NextResponse.json({ error: "WhatsApp not connected" }, { status: 400 });
  }

  try {
    await sendWhatsappTextMessage({
      accessToken: account.access_token,
      phoneNumberId: account.phone_number_id,
      to: contact.phone,
      text: replyText,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "WhatsApp send failed";
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  await supabase.from("messages").insert({
    user_id: auth.user.id,
    contact_id: contactId,
    content: replyText,
    direction: "outgoing",
    wa_message_id: null,
  });

  await supabase.from("contacts").update({ last_message: replyText }).eq("id", contactId);

  return NextResponse.json({ reply: replyText }, { status: 200 });
}
