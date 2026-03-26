import { AppSidebar } from "@/components/app-sidebar";
import { StartupOnboarding } from "@/components/onboarding/startup-onboarding";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      <AppSidebar />
      <main className="ml-60 flex h-screen min-w-0 flex-col overflow-y-auto">
        <StartupOnboarding />
        {children}
      </main>
    </div>
  );
}
