import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/api-auth";
import { createClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  access_token: z.string().min(10).optional(),
  phone_number_id: z.string().min(5),
  business_account_id: z.string().optional(),
});

function maskToken(token: string | null): string | null {
  if (!token) return null;
  const end = token.slice(-4);
  return `************${end}`;
}

export async function GET() {
  const auth = await requireUser();
  if ("error" in auth) {
    return auth.error;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("whatsapp_accounts")
    .select("id, user_id, phone_number_id, business_account_id, access_token, created_at")
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ connected: false, account: null }, { status: 200 });
  }

  return NextResponse.json(
    {
      connected: true,
      account: {
        id: data.id,
        user_id: data.user_id,
        phone_number_id: data.phone_number_id,
        business_account_id: data.business_account_id,
        created_at: data.created_at,
        masked_access_token: maskToken(data.access_token),
      },
    },
    { status: 200 }
  );
}

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
    .select("id, access_token")
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("whatsapp_accounts")
      .update({
        access_token: access_token ?? existing.access_token,
        phone_number_id,
        business_account_id: business_account_id ?? null,
      })
      .eq("id", existing.id)
      .eq("user_id", auth.user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  } else {
    if (!access_token) {
      return NextResponse.json(
        { error: "access_token is required for first-time connection" },
        { status: 422 }
      );
    }

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
