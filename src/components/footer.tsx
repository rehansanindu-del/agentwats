import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-slate-200/70 bg-white/80 py-8 dark:border-slate-800 dark:bg-slate-950/70">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 text-sm text-slate-600 md:flex-row dark:text-slate-300">
        <p>© {new Date().getFullYear()} AgentWats. All rights reserved.</p>
        <div className="flex items-center gap-4">
          <Link href="/contact" className="transition-colors hover:text-slate-900 dark:hover:text-slate-100">
            Contact Us
          </Link>
          <Link href="/terms" className="transition-colors hover:text-slate-900 dark:hover:text-slate-100">
            Terms & Conditions
          </Link>
        </div>
      </div>
    </footer>
  );
}
