import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/api-auth";
import { createClient } from "@/lib/supabase/server";
import { sendWhatsappTextMessage } from "@/lib/whatsapp";

const schema = z.object({
  to: z.string().min(8),
  text: z.string().min(1).max(500),
});

export async function POST(request: Request) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const json = await request.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const supabase = await createClient();
  const { data: account } = await supabase
    .from("whatsapp_accounts")
    .select("access_token, phone_number_id")
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (!account) {
    return NextResponse.json({ error: "Connect WhatsApp first." }, { status: 400 });
  }

  try {
    await sendWhatsappTextMessage({
      accessToken: account.access_token,
      phoneNumberId: account.phone_number_id,
      to: parsed.data.to,
      text: parsed.data.text,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 502 });
  }
}
