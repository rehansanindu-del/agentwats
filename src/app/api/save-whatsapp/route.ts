import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceRoleClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  userId: z.string().uuid(),
  phoneNumberId: z.string().min(5),
  accessToken: z.string().min(10),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Temporary debug log for production verification
  console.log("Incoming:", body);

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const { userId, phoneNumberId, accessToken } = parsed.data;
  const supabase = createServiceRoleClient();

  try {
    const { data: existing, error: existingErr } = await supabase
      .from("whatsapp_accounts")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (existingErr) {
      return NextResponse.json({ error: existingErr.message }, { status: 500 });
    }

    if (existing) {
      const { error: updateErr } = await supabase
        .from("whatsapp_accounts")
        .update({
          user_id: userId,
          phone_number_id: phoneNumberId,
          access_token: accessToken,
        })
        .eq("id", existing.id);

      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 500 });
      }
    } else {
      const { error: insertErr } = await supabase.from("whatsapp_accounts").insert({
        user_id: userId,
        phone_number_id: phoneNumberId,
        access_token: accessToken,
      });

      if (insertErr) {
        return NextResponse.json({ error: insertErr.message }, { status: 500 });
      }
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Internal server error" },
      { status: 500 }
    );
  }
}
