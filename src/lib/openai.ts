import OpenAI from "openai";
import type { ContactTag } from "@/lib/types/database";

function getClient(): OpenAI {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    throw new Error("OPENAI_API_KEY is not configured");
  }
  return new OpenAI({ apiKey: key });
}

const CLASSIFIER_SYSTEM = `You classify sales leads based on the conversation.
Respond with ONLY valid JSON: {"tag":"hot"|"warm"|"cold"}
Definitions:
- hot: ready to buy, asking price, wants to proceed, strong intent
- warm: asking questions, comparing options, interested but not committed
- cold: general inquiry, vague, not engaged, or unclear intent`;

export async function classifyLeadTag(input: {
  contactName: string | null;
  lastMessages: string[];
}): Promise<ContactTag> {
  const client = getClient();
  const text = [
    input.contactName ? `Contact name hint: ${input.contactName}` : "",
    "Recent messages:",
    ...input.lastMessages.slice(-8),
  ]
    .filter(Boolean)
    .join("\n");

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    messages: [
      { role: "system", content: CLASSIFIER_SYSTEM },
      { role: "user", content: text },
    ],
  });

  const out = completion.choices[0]?.message?.content?.trim() ?? "";
  try {
    const parsed = JSON.parse(out) as { tag?: string };
    const t = parsed.tag;
    if (t === "hot" || t === "warm" || t === "cold") {
      return t;
    }
  } catch {
    // fall through
  }
  return "cold";
}

export async function generateAssistantReply(input: {
  systemPrompt: string;
  conversation: { role: "user" | "assistant"; content: string }[];
}): Promise<string> {
  const client = getClient();
  const SALES_SYSTEM_PROMPT = `You are a professional WhatsApp sales assistant.

Your goals:
- Respond like a real human (friendly, natural tone)
- Keep replies short (max 2-3 lines)
- Help user quickly
- Ask smart follow-up questions
- Capture lead details (name, requirement, budget)

Conversation style:
- No long paragraphs
- No robotic replies
- Use emojis lightly (😊👍)
- Be helpful and confident

Language:
- Detect user's language automatically
- Reply in same language (Sinhala / Tamil / English)

Business context:
- Use business name, services, and pricing if available

Sales behavior:
- Guide user toward decision
- Suggest next step (call, booking, etc.)`;

  const completion = await client.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.4,
    messages: [
      { role: "system", content: `${SALES_SYSTEM_PROMPT}\n\n${input.systemPrompt}`.trim() },
      ...input.conversation.slice(-10).map((m) => ({
        role: m.role,
        content: m.content,
      })),
    ],
  });
  const text = completion.choices[0]?.message?.content?.trim();
  if (!text) {
    throw new Error("OpenAI returned an empty reply");
  }
  return text;
}
