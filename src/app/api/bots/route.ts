import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/api-auth";
import { createClient } from "@/lib/supabase/server";

const DEFAULT_PROMPT = `You are a professional sales assistant.

* Answer clearly
* Capture leads (name, email)
* Be friendly
* Ask follow-up questions`;

export async function GET() {
  const auth = await requireUser();
  if ("error" in auth) {
    return auth.error;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bots")
    .select("*")
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    const { data: created, error: insErr } = await supabase
      .from("bots")
      .insert({
        user_id: auth.user.id,
        prompt: DEFAULT_PROMPT,
        is_active: true,
      })
      .select("*")
      .single();

    if (insErr || !created) {
      return NextResponse.json(
        { error: insErr?.message ?? "Could not create bot row" },
        { status: 500 }
      );
    }

    return NextResponse.json({ bot: created }, { status: 200 });
  }

  return NextResponse.json({ bot: data }, { status: 200 });
}

const patchSchema = z.object({
  prompt: z.string().min(1).max(12000).optional(),
  is_active: z.boolean().optional(),
});

export async function PATCH(request: Request) {
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

  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  if (Object.keys(parsed.data).length === 0) {
    return NextResponse.json({ error: "No updates" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bots")
    .update(parsed.data)
    .eq("user_id", auth.user.id)
    .select("*")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Bot not found" }, { status: 404 });
  }

  return NextResponse.json({ bot: data }, { status: 200 });
}
