import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const [{ count: contactCount }, { count: msgCount }, { data: wa }, { data: recent }] = await Promise.all([
    supabase.from("contacts").select("*", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("messages").select("*", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("whatsapp_accounts").select("id").eq("user_id", user.id).maybeSingle(),
    supabase
      .from("messages")
      .select("id, content, direction, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const connected = Boolean(wa);
  const { data: allDates } = await supabase
    .from("messages")
    .select("created_at")
    .eq("user_id", user.id)
    .gte("created_at", new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString());

  const bins = Array.from({ length: 7 }, () => 0);
  for (const row of allDates ?? []) {
    const d = new Date(row.created_at).getTime();
    const daysAgo = Math.floor((Date.now() - d) / (24 * 60 * 60 * 1000));
    if (daysAgo >= 0 && daysAgo < 7) {
      bins[6 - daysAgo] += 1;
    }
  }

  return (
    <DashboardShell
      contactCount={contactCount ?? 0}
      messageCount={msgCount ?? 0}
      connected={connected}
      recentMessages={(recent ?? []) as Array<{ id: string; content: string; direction: "incoming" | "outgoing"; created_at: string }>}
      dailyCounts={bins}
    />
  );
}
