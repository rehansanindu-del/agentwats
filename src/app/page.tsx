import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900 dark:from-slate-950 dark:to-slate-900 dark:text-slate-100">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-20 md:flex-row md:items-center md:justify-between">
        <div className="max-w-2xl">
          <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-900/20 dark:text-emerald-300">
            Trusted by growing teams
          </span>
          <h1 className="mt-5 text-4xl font-bold tracking-tight md:text-6xl">
            Automate Your WhatsApp Replies with AI
          </h1>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
            Turn conversations into customers automatically. AgentWats captures leads, keeps replies instant, and gives your team one premium inbox.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/signup" className="rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white transition hover:scale-[1.02] hover:bg-emerald-700">
              Start Free
            </Link>
            <Link href="/login" className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-800 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800">
              Book Demo
            </Link>
          </div>
        </div>
        <div className="card-premium w-full max-w-xl p-6">
          <div className="mb-4 text-sm font-medium text-slate-500 dark:text-slate-400">Live Preview</div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="text-sm font-semibold">Dashboard Analytics</div>
            <div className="mt-3 grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-white p-3 shadow-sm dark:bg-slate-800"><div className="text-xs">Contacts</div><div className="text-xl font-bold">1,284</div></div>
              <div className="rounded-lg bg-white p-3 shadow-sm dark:bg-slate-800"><div className="text-xs">Replies</div><div className="text-xl font-bold">8,912</div></div>
              <div className="rounded-lg bg-white p-3 shadow-sm dark:bg-slate-800"><div className="text-xs">Converted</div><div className="text-xl font-bold">214</div></div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
