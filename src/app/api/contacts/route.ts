import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/api-auth";
import { createClient } from "@/lib/supabase/server";
import type { ContactTag } from "@/lib/types/database";

const tagValues: ContactTag[] = ["hot", "warm", "cold"];

export async function GET(request: Request) {
  const auth = await requireUser();
  if ("error" in auth) {
    return auth.error;
  }

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();
  const tag = searchParams.get("tag") as ContactTag | null;

  const supabase = await createClient();
  let query = supabase
    .from("contacts")
    .select("*")
    .eq("user_id", auth.user.id)
    .order("created_at", { ascending: false });

  if (tag && tagValues.includes(tag)) {
    query = query.eq("tag", tag);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let rows = data ?? [];
  if (q) {
    const lower = q.toLowerCase();
    rows = rows.filter(
      (c) =>
        c.phone.toLowerCase().includes(lower) ||
        (c.name?.toLowerCase().includes(lower) ?? false) ||
        (c.last_message?.toLowerCase().includes(lower) ?? false)
    );
  }

  return NextResponse.json({ contacts: rows }, { status: 200 });
}

const patchSchema = z.object({
  id: z.string().uuid(),
  tag: z.enum(["hot", "warm", "cold"]).optional(),
  name: z.string().min(1).max(200).optional(),
  auto_reply_enabled: z.boolean().optional(),
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

  const supabase = await createClient();
  const { id, tag, name, auto_reply_enabled } = parsed.data;

  const updates: Record<string, unknown> = {};
  if (tag) {
    updates.tag = tag;
  }
  if (name) {
    updates.name = name;
  }
  if (typeof auto_reply_enabled === "boolean") {
    updates.auto_reply_enabled = auto_reply_enabled;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No updates" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("contacts")
    .update(updates)
    .eq("id", id)
    .eq("user_id", auth.user.id)
    .select("*")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Contact not found" }, { status: 404 });
  }

  return NextResponse.json({ contact: data }, { status: 200 });
}
