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

  return (
    <div className="p-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">Overview of your WhatsApp workspace.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Contacts</div>
            <div className="mt-2 text-3xl font-semibold text-slate-900">{contactCount ?? 0}</div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Messages</div>
            <div className="mt-2 text-3xl font-semibold text-slate-900">{msgCount ?? 0}</div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">WhatsApp</div>
            <div className="mt-2 text-lg font-semibold text-slate-900">
              {connected ? (
                <span className="text-emerald-700">Connected</span>
              ) : (
                <span className="text-amber-700">Not connected</span>
              )}
            </div>
            <p className="mt-2 text-xs text-slate-500">
              {connected ? "Webhook events will sync into AgentWats." : "Add credentials in Settings."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
