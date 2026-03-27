import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { processIncomingWhatsappMessage } from "@/lib/incoming-message";
import { isTrialActive } from "@/lib/trial";

export const dynamic = "force-dynamic";

/** Vercel Pro / Fluid: extend if AI + WhatsApp are slow */
export const maxDuration = 60;

/** Webhook verification (GET) */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const verify = process.env.WHATSAPP_VERIFY_TOKEN;

  if (!verify) {
    return NextResponse.json({ error: "WHATSAPP_VERIFY_TOKEN not set" }, { status: 500 });
  }

  if (mode === "subscribe" && token === verify && challenge) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Verification failed" }, { status: 403 });
}

interface WaMessage {
  id?: string;
  from?: string;
  type?: string;
  text?: { body?: string };
}

interface WaChangeValue {
  metadata?: { phone_number_id?: string };
  messages?: WaMessage[];
}

/** Incoming WhatsApp events (POST) */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const b = body as {
    object?: string;
    entry?: Array<{
      changes?: Array<{ value?: WaChangeValue }>;
    }>;
  };

  if (b.object && b.object !== "whatsapp_business_account") {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  try {
    const supabase = createServiceRoleClient();
    const trialCache = new Map<string, boolean>();

    for (const entry of b.entry ?? []) {
      for (const change of entry.changes ?? []) {
        const value = change.value;
        const phoneNumberId = value?.metadata?.phone_number_id;

        if (!phoneNumberId) {
          continue;
        }

        let trialAllowed = trialCache.get(phoneNumberId);
        if (trialAllowed === undefined) {
          const { data: waAccount, error: waErr } = await supabase
            .from("whatsapp_accounts")
            .select("user_id")
            .eq("phone_number_id", phoneNumberId)
            .maybeSingle();

          if (waErr || !waAccount?.user_id) {
            console.error("webhook trial user lookup failed", waErr?.message ?? "missing account");
            continue;
          }

          const { data: appUser, error: uErr } = await supabase
            .from("users")
            .select("id, is_pro, trial_end")
            .eq("id", waAccount.user_id)
            .maybeSingle();

          if (uErr || !appUser) {
            console.error("webhook trial profile lookup failed", uErr?.message ?? "missing user");
            continue;
          }

          trialAllowed = isTrialActive(appUser);
          trialCache.set(phoneNumberId, trialAllowed);

          if (!trialAllowed) {
            console.log("Trial expired:", appUser.id);
          }
        }

        if (!trialAllowed) {
          continue;
        }

        for (const msg of value?.messages ?? []) {
          if (msg.type !== "text" || !msg.text?.body) {
            continue;
          }

          const from = msg.from;
          if (!from) {
            continue;
          }

          if (!msg.id) {
            console.error("Incoming WhatsApp message missing msg.id", { from, text: msg.text?.body });
            continue;
          }

          console.log("Incoming message:", {
            from,
            messageId: msg.id,
            text: msg.text?.body,
          });

          /** Persists inbound message + lead logic in {@link processIncomingWhatsappMessage}. AI WhatsApp reply is skipped when `contacts.auto_reply_enabled` is false (handled there, after `contactId` is known). */
          const result = await processIncomingWhatsappMessage(supabase, {
            phoneNumberId,
            from,
            body: msg.text.body,
            messageId: msg.id,
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
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
