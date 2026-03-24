import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/api-auth";
import { createClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  access_token: z.string().min(10),
  phone_number_id: z.string().min(5),
  business_account_id: z.string().optional(),
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
  const { access_token, phone_number_id, business_account_id } = parsed.data;

  const { data: existing } = await supabase
    .from("whatsapp_accounts")
    .select("id")
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("whatsapp_accounts")
      .update({
        access_token,
        phone_number_id,
        business_account_id: business_account_id ?? null,
      })
      .eq("id", existing.id)
      .eq("user_id", auth.user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  } else {
    const { error } = await supabase.from("whatsapp_accounts").insert({
      user_id: auth.user.id,
      access_token,
      phone_number_id,
      business_account_id: business_account_id ?? null,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
