const DEFAULT_API = "https://graph.facebook.com/v18.0";

export function getWhatsappApiBase(): string {
  return process.env.WHATSAPP_API_URL?.replace(/\/$/, "") ?? DEFAULT_API;
}

/** E.164 without + is what Graph API expects for `to` in many setups */
export function normalizeWhatsappPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  return digits;
}

export async function sendWhatsappTextMessage(input: {
  accessToken: string;
  phoneNumberId: string;
  to: string;
  text: string;
}): Promise<{ messageId?: string }> {
  const base = getWhatsappApiBase();
  const url = `${base}/${input.phoneNumberId}/messages`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: normalizeWhatsappPhone(input.to),
      type: "text",
      text: { preview_url: false, body: input.text },
    }),
  });

  const raw = await res.text();
  if (!res.ok) {
    throw new Error(`WhatsApp API ${res.status}: ${raw}`);
  }

  let parsed: { messages?: { id: string }[] } = {};
  try {
    parsed = JSON.parse(raw) as { messages?: { id: string }[] };
  } catch {
    // ignore
  }
  return { messageId: parsed.messages?.[0]?.id };
}
