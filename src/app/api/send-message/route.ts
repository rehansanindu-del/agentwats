import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/api-auth";
import { createClient } from "@/lib/supabase/server";
import { isTrialActive } from "@/lib/trial";
import { sendWhatsappTextMessage } from "@/lib/whatsapp";

const bodySchema = z.object({
  contactId: z.string().uuid(),
  content: z.string().min(1).max(4096),
});

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
  const { contactId, content } = parsed.data;

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

  const { data: account, error: aErr } = await supabase
    .from("whatsapp_accounts")
    .select("access_token, phone_number_id")
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (aErr || !account) {
    return NextResponse.json(
      { error: "Connect WhatsApp in Settings before sending messages." },
      { status: 400 }
    );
  }

  try {
    await sendWhatsappTextMessage({
      accessToken: account.access_token,
      phoneNumberId: account.phone_number_id,
      to: contact.phone,
      text: content,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "WhatsApp send failed";
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  const { data: inserted, error: mErr } = await supabase
    .from("messages")
    .insert({
      user_id: auth.user.id,
      contact_id: contact.id,
      content,
      direction: "outgoing",
      wa_message_id: null,
    })
    .select("*")
    .single();

  if (mErr || !inserted) {
    return NextResponse.json({ error: mErr?.message ?? "Failed to persist message" }, { status: 500 });
  }

  await supabase.from("contacts").update({ last_message: content }).eq("id", contact.id);

  await supabase.from("bots").update({ is_active: false }).eq("user_id", auth.user.id);

  return NextResponse.json({ ok: true, message: inserted }, { status: 200 });
}
