export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 px-6 py-12 dark:bg-slate-950">
      <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 shadow-soft dark:border-slate-800 dark:bg-slate-900">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Terms & Conditions</h1>
        <div className="mt-6 space-y-6 text-sm text-slate-600 dark:text-slate-300">
          <section>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Introduction</h2>
            <p className="mt-2">By using AgentWats, you agree to these terms governing access to our platform and services.</p>
          </section>
          <section>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Usage Terms</h2>
            <p className="mt-2">You are responsible for lawful WhatsApp usage, account security, and all activity performed under your account.</p>
          </section>
          <section>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Payment Terms</h2>
            <p className="mt-2">Paid plans are billed monthly. Pricing and limits are shown at checkout and may be updated with notice.</p>
          </section>
          <section>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Refund Policy</h2>
            <p className="mt-2">Refund requests are reviewed case by case. Contact us within 7 days of billing for support.</p>
          </section>
          <section>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Contact Info</h2>
            <p className="mt-2">For legal or billing concerns, reach out via the Contact Us page.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
