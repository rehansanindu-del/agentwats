"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { ButtonSpinner } from "@/components/auth/button-spinner";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) {
      return;
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      toast.error("Enter email and password.");
      return;
    }

    setLoading(true);
    try {
      let supabase;
      try {
        supabase = createClient();
      } catch (envErr) {
        toast.error(
          envErr instanceof Error ? envErr.message : "App configuration error (missing Supabase keys)."
        );
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          emailRedirectTo: `${typeof window !== "undefined" ? window.location.origin : ""}/auth/callback`,
        },
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      // Email confirmation off: Supabase returns a session immediately
      if (data.session) {
        toast.success("Welcome! Your account is ready.");
        router.replace("/dashboard");
        router.refresh();
        return;
      }

      // Email confirmation on: user must click link in email
      toast.success("Check your inbox to confirm your email, then sign in.");
      router.replace("/login?registered=1");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Create account</h1>
          <p className="mt-2 text-sm text-slate-500">One account = one business on AgentWats</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600" htmlFor="signup-email">
              Email
            </label>
            <input
              id="signup-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none ring-emerald-500/30 transition focus:ring-2 disabled:cursor-not-allowed disabled:bg-slate-50"
            />
          </div>
          <div>
            <label
              className="mb-1 block text-xs font-medium text-slate-600"
              htmlFor="signup-password"
            >
              Password
            </label>
            <input
              id="signup-password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none ring-emerald-500/30 transition focus:ring-2 disabled:cursor-not-allowed disabled:bg-slate-50"
            />
            <p className="mt-1 text-xs text-slate-400">At least 8 characters</p>
          </div>
          <button
            type="submit"
            className="flex w-full min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-lg bg-emerald-600 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? (
              <>
                <ButtonSpinner className="text-white" />
                Creating account…
              </>
            ) : (
              "Create account"
            )}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-emerald-700 underline-offset-2 hover:underline"
            tabIndex={loading ? -1 : 0}
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
