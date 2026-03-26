"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

const validPlans = new Set(["starter", "business"]);

function ContactPageContent() {
  const searchParams = useSearchParams();
  const initialPlan = useMemo(() => {
    const fromQuery = searchParams.get("plan")?.toLowerCase() ?? "";
    return validPlans.has(fromQuery) ? fromQuery : "starter";
  }, [searchParams]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [plan, setPlan] = useState(initialPlan);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);

    try {
      const res = await fetch("/api/contact-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || null,
          plan,
          message: message.trim() || null,
        }),
      });
      if (!res.ok) {
        throw new Error("Failed to submit request");
      }
      setDone(true);
      setName("");
      setEmail("");
      setPhone("");
      setMessage("");
    } catch {
      alert("Could not submit right now. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const planLabel = plan === "business" ? "Business" : "Starter";

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-12 dark:bg-slate-950">
      <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-6">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Contact Us</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            You selected: <span className="font-semibold text-slate-700 dark:text-slate-200">{planLabel}</span>
          </p>
        </div>

        {done ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300">
            We will contact you shortly.
          </div>
        ) : null}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-emerald-500/20 focus:ring-2 dark:border-slate-700 dark:bg-slate-950" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-emerald-500/20 focus:ring-2 dark:border-slate-700 dark:bg-slate-950" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Phone (optional)</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-emerald-500/20 focus:ring-2 dark:border-slate-700 dark:bg-slate-950" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Selected Plan</label>
            <select value={plan} onChange={(e) => setPlan(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-emerald-500/20 focus:ring-2 dark:border-slate-700 dark:bg-slate-950">
              <option value="starter">Starter</option>
              <option value="business">Business</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Message (optional)</label>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-emerald-500/20 focus:ring-2 dark:border-slate-700 dark:bg-slate-950" />
          </div>
          <button type="submit" disabled={submitting} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:scale-[1.02] hover:bg-emerald-700 disabled:opacity-60">
            {submitting ? "Submitting..." : "Submit Request"}
          </button>
          <div className="pt-1 text-xs text-slate-500 dark:text-slate-400">
            <Link href="/" className="underline underline-offset-2">
              Back to home
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ContactPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 dark:bg-slate-950" />}>
      <ContactPageContent />
    </Suspense>
  );
}
