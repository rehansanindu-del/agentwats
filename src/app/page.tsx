import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/** Never show a static "Redirecting…" shell — always issue a real HTTP redirect. */
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    redirect("/login");
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      redirect("/dashboard");
    }
  } catch {
    // Misconfiguration or cookie read failure — still send user to login
  }

  redirect("/login");
}
