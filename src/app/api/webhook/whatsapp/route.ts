import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);

  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse("Verification failed", { status: 403 });
}
import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { processIncomingWhatsappMessage } from "@/lib/incoming-message";

export const dynamic = "force-dynamic";

/** Meta webhook verification (GET) */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");
  const verify = process.env.WHATSAPP_VERIFY_TOKEN;

  if (!verify) {
    return NextResponse.json({ error: "WHATSAPP_VERIFY_TOKEN not configured" }, { status: 500 });
  }

  if (mode === "subscribe" && token === verify && challenge) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Verification failed" }, { status: 403 });
}

/**
 * Incoming WhatsApp events (POST).
 * Production hardening: verify `X-Hub-Signature-256` with your Meta app secret
 * before trusting the payload (see Meta webhook security docs).
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as WhatsAppWebhookBody;
    const entries = body.entry ?? [];
    const supabase = createServiceRoleClient();

    for (const entry of entries) {
      for (const change of entry.changes ?? []) {
        const value = change.value;
        const phoneNumberId = value?.metadata?.phone_number_id;
        if (!phoneNumberId) {
          continue;
        }

        const messages = value?.messages ?? [];
        for (const msg of messages) {
          if (msg.type !== "text" || !msg.text?.body) {
            continue;
          }
          const from = msg.from;
          if (!from) {
            continue;
          }

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
    console.error("webhook POST", e);
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
}

interface WhatsAppWebhookBody {
  entry?: Array<{
    changes?: Array<{
      value?: {
        metadata?: { phone_number_id?: string };
        messages?: Array<{
          from?: string;
          type?: string;
          text?: { body?: string };
        }>;
      };
    }>;
  }>;
}
