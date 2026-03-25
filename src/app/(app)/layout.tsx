import { AppSidebar } from "@/components/app-sidebar";
import { StartupOnboarding } from "@/components/onboarding/startup-onboarding";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <AppSidebar />
      <main className="flex min-h-screen min-w-0 flex-1 flex-col overflow-y-auto">
        <StartupOnboarding />
        {children}
      </main>
    </div>
  );
}
