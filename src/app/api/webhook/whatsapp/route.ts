import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { processIncomingWhatsappMessage } from "@/lib/incoming-message";

export const dynamic = "force-dynamic";

/** ✅ Webhook verification (GET) */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const verify = process.env.WHATSAPP_VERIFY_TOKEN;

  if (!verify) {
    return NextResponse.json(
      { error: "WHATSAPP_VERIFY_TOKEN not set" },
      { status: 500 }
    );
  }

  if (mode === "subscribe" && token === verify && challenge) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Verification failed" }, { status: 403 });
}

/** ✅ Incoming WhatsApp messages (POST) */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const supabase = createServiceRoleClient();

    for (const entry of body.entry ?? []) {
      for (const change of entry.changes ?? []) {
        const value = change.value;
        const phoneNumberId = value?.metadata?.phone_number_id;

        if (!phoneNumberId) continue;

        for (const msg of value?.messages ?? []) {
          if (msg.type !== "text" || !msg.text?.body) continue;

          const from = msg.from;
          if (!from) continue;

          const result = await processIncomingWhatsappMessage(supabase, {
            phoneNumberId,
            from,
            body: msg.text.body,
          });

          if (!result.ok) {
            console.error("processIncomingWhatsappMessage", result.error);
          }
        }
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (e) {
    console.error("webhook POST error", e);
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
}