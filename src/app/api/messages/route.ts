import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/api-auth";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const auth = await requireUser();
  if ("error" in auth) {
    return auth.error;
  }

  const { searchParams } = new URL(request.url);
  const contactId = searchParams.get("contactId");

  const parsed = z.string().uuid().safeParse(contactId);
  if (!parsed.success) {
    return NextResponse.json({ error: "contactId (uuid) required" }, { status: 422 });
  }

  const supabase = await createClient();

  const { data: contact, error: cErr } = await supabase
    .from("contacts")
    .select("id")
    .eq("id", parsed.data)
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (cErr || !contact) {
    return NextResponse.json({ error: "Contact not found" }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("contact_id", parsed.data)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ messages: data ?? [] }, { status: 200 });
}
