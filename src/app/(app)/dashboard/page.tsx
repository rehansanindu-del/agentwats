import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const [{ count: contactCount }, { count: msgCount }, { data: wa }] = await Promise.all([
    supabase.from("contacts").select("*", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("messages").select("*", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("whatsapp_accounts").select("id").eq("user_id", user.id).maybeSingle(),
  ]);

  const connected = Boolean(wa);
  const now = new Date().toLocaleString();

  return (
    <div className="p-6 md:p-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Premium overview of your AI WhatsApp pipeline.</p>
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Last updated: {now}</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="card-premium group p-5 hover:-translate-y-1">
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">👥 Contacts</div>
            <div className="mt-2 text-3xl font-semibold text-slate-900 dark:text-slate-100">{contactCount ?? 0}</div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Total captured leads</p>
          </div>
          <div className="card-premium group p-5 hover:-translate-y-1">
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">💬 Messages</div>
            <div className="mt-2 text-3xl font-semibold text-slate-900 dark:text-slate-100">{msgCount ?? 0}</div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Inbound + outbound volume</p>
          </div>
          <div className="card-premium group p-5 hover:-translate-y-1">
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">🟢 WhatsApp</div>
            <div className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
              {connected ? (
                <span className="inline-flex rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">Connected</span>
              ) : (
                <span className="inline-flex rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">Not connected</span>
              )}
            </div>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              {connected ? "Webhook events will sync into AgentWats." : "Add credentials in Settings."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
