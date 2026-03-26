import Link from "next/link";
import { FeatureCard } from "@/components/ui/feature-card";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 text-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dark:text-slate-100">
      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/70">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            AgentWats
          </Link>
          {user ? (
            <Link
              href="/dashboard"
              className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.02] hover:bg-emerald-700"
            >
              Go to Dashboard
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition-all duration-200 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.02] hover:bg-emerald-700"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </header>
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.2),transparent_50%)]" />
        <div className="mx-auto grid max-w-7xl gap-10 px-6 pb-16 pt-20 md:grid-cols-2 md:items-center md:py-24">
          <div>
            <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
              Revenue automation for WhatsApp-first businesses
            </span>
            <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight md:text-6xl">
              Never Miss a Customer Message Again
            </h1>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
              AI replies instantly on WhatsApp, captures leads, and turns chats into sales — 24/7.
            </p>
            <ul className="mt-6 space-y-2 text-sm font-medium text-slate-700 dark:text-slate-200">
              <li>✔ Instant replies</li>
              <li>✔ Capture leads automatically</li>
              <li>✔ Works even while you sleep</li>
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/signup" className="rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white shadow-soft transition-all hover:-translate-y-0.5 hover:scale-[1.02] hover:bg-emerald-700">
                Start Free Trial
              </Link>
              <Link href="/login" className="rounded-xl border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-800 transition-all hover:-translate-y-0.5 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800">
                Watch Demo
              </Link>
            </div>
            <p className="mt-3 text-xs font-medium text-emerald-700 dark:text-emerald-300">Set up in under 5 minutes</p>
          </div>

          <div className="card-premium relative p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Live WhatsApp AI Preview</p>
              <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-bold uppercase text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                active
              </span>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-[#ece5dd] p-4 dark:border-slate-800 dark:bg-slate-900">
              <div className="space-y-3">
                <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-[#d9fdd3] px-3 py-2 text-sm text-slate-900 shadow-sm">
                  Hi, do you have rooms?
                  <div className="mt-1 text-[10px] text-slate-500">Customer • now</div>
                </div>
                <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-white px-3 py-2 text-sm text-slate-900 shadow-sm dark:bg-slate-800 dark:text-slate-100">
                  Yes! We have available rooms. Would you like pricing?
                  <div className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">AgentWats AI • now</div>
                </div>
                <div className="inline-flex rounded-full bg-white px-3 py-2 text-xs text-slate-500 shadow-sm dark:bg-slate-800 dark:text-slate-300">
                  <span className="animate-pulse">AI is typing...</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <p className="text-center text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Trusted by growing businesses
        </p>
        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-5">
          {["NovaStay", "UrbanCare", "QuickFix", "AlphaTours", "PeakDental"].map((logo) => (
            <div key={logo} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
              {logo}
            </div>
          ))}
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <blockquote className="card-premium p-4 text-sm text-slate-700 dark:text-slate-300">
            “Saved us hours daily. Replies instantly!”
            <footer className="mt-2 text-xs font-semibold text-slate-500">- Small business owner</footer>
          </blockquote>
          <blockquote className="card-premium p-4 text-sm text-slate-700 dark:text-slate-300">
            “Lead response time dropped from hours to seconds.”
            <footer className="mt-2 text-xs font-semibold text-slate-500">- Agency founder</footer>
          </blockquote>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-6 py-14 md:grid-cols-2">
        <div className="card-premium p-6">
          <h2 className="text-3xl font-bold tracking-tight">Losing customers because you reply late?</h2>
          <ul className="mt-5 space-y-3 text-sm text-slate-600 dark:text-slate-300">
            <li>• Customers leave if you do not reply fast</li>
            <li>• You cannot reply 24/7 manually</li>
            <li>• Important messages get buried and missed</li>
          </ul>
        </div>
        <div className="card-premium p-6">
          <h3 className="text-xl font-semibold">Before vs After</h3>
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-700 dark:border-rose-900 dark:bg-rose-900/20 dark:text-rose-300">
              <p>❌ Slow replies</p>
              <p>❌ Missed leads</p>
              <p>❌ Manual work</p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-900/20 dark:text-emerald-300">
              <p>✅ Instant AI replies</p>
              <p>✅ Every message captured</p>
              <p>✅ Automated sales</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-14">
        <h2 className="text-center text-3xl font-bold tracking-tight">Everything you need to convert chats into revenue</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {[
            { icon: "🤖", title: "AI Auto Reply", text: "Respond instantly with your brand voice." },
            { icon: "📱", title: "WhatsApp Integration", text: "Connect in minutes with Meta API." },
            { icon: "📊", title: "Dashboard Analytics", text: "Track conversations and growth." },
            { icon: "👥", title: "Lead Management", text: "Organize and export high-intent leads." },
          ].map((f) => (
            <FeatureCard key={f.title} icon={f.icon} title={f.title} description={f.text} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-14">
        <div className="card-premium p-6 md:p-8">
          <h2 className="text-2xl font-bold tracking-tight">See AgentWats in action</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            One place to monitor chats, trigger replies, and manage leads.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
              <div className="mb-3 text-xs font-semibold uppercase text-slate-500">Dashboard</div>
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-white p-3 shadow-sm dark:bg-slate-900"><div className="text-xs">Contacts</div><div className="text-xl font-bold">1,284</div></div>
                <div className="rounded-xl bg-white p-3 shadow-sm dark:bg-slate-900"><div className="text-xs">Messages</div><div className="text-xl font-bold">8,912</div></div>
                <div className="rounded-xl bg-white p-3 shadow-sm dark:bg-slate-900"><div className="text-xs">Hot leads</div><div className="text-xl font-bold">214</div></div>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
              <div className="mb-3 text-xs font-semibold uppercase text-slate-500">Chat preview</div>
              <div className="space-y-2">
                <div className="ml-auto max-w-[80%] rounded-xl rounded-br-sm bg-emerald-100 px-3 py-2 text-sm dark:bg-emerald-900/40">
                  Need a booking link.
                </div>
                <div className="max-w-[80%] rounded-xl rounded-bl-sm bg-white px-3 py-2 text-sm dark:bg-slate-900">
                  Sure — here is your instant booking link: ...
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-14">
        <h2 className="text-center text-3xl font-bold tracking-tight">Simple pricing for every growth stage</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <PricingCard title="Starter" price="$29" features={["Basic inbox", "Manual replies", "Up to 1,000 messages"]} />
          <PricingCard
            title="Pro"
            price="$79"
            highlight
            features={["AI auto replies", "Lead capture", "Priority support"]}
          />
          <PricingCard title="Business" price="$199" features={["Advanced automations", "Team seats", "Dedicated onboarding"]} />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20 pt-6">
        <div className="rounded-3xl bg-gradient-to-r from-emerald-600 to-teal-600 p-8 text-center text-white shadow-soft md:p-12">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Start automating your WhatsApp today</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-emerald-50">
            Turn delayed replies into revenue with AI that never sleeps.
          </p>
          <Link href="/signup" className="mt-6 inline-flex rounded-xl bg-white px-6 py-3 font-semibold text-emerald-700 transition hover:scale-[1.02] hover:bg-emerald-50">
            Start Free Now
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-20">
        <h2 className="text-center text-3xl font-bold tracking-tight">Frequently asked questions</h2>
        <div className="mt-8 space-y-3">
          {[
            ["How fast can I launch?", "Most businesses connect WhatsApp, run a test, and go live in under 5 minutes."],
            ["Can I still reply manually?", "Yes. Your team can jump into any conversation instantly and take over anytime."],
            ["Will this work for small teams?", "Absolutely. AgentWats is built for founders and lean teams that need speed."],
          ].map(([q, a]) => (
            <div key={q} className="card-premium p-4">
              <p className="font-semibold text-slate-900 dark:text-slate-100">{q}</p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function PricingCard({
  title,
  price,
  features,
  highlight = false,
}: {
  title: string;
  price: string;
  features: string[];
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-6 transition-all duration-200 hover:-translate-y-1 ${
        highlight
          ? "border-emerald-300 bg-emerald-50 shadow-soft dark:border-emerald-800 dark:bg-emerald-900/20"
          : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
      }`}
    >
      {highlight ? (
        <span className="rounded-full bg-emerald-600 px-2 py-1 text-[10px] font-bold uppercase text-white">
          Most Popular
        </span>
      ) : null}
      <h3 className="mt-3 text-lg font-semibold">{title}</h3>
      <p className="mt-1 text-3xl font-bold">{price}<span className="text-sm font-medium text-slate-500">/mo</span></p>
      <ul className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
        {features.map((f) => (
          <li key={f}>• {f}</li>
        ))}
      </ul>
      <Link href="/signup" className="mt-6 inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white">
        Choose {title}
      </Link>
    </div>
  );
}
