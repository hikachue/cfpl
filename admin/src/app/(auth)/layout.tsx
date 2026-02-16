import Sidebar from "@/client/components/layout/Sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Authentication is disabled for this single-tenant Basement instance.

  return (
    <div className="grid grid-cols-[220px_1fr] h-screen bg-background">
      <Sidebar />
      <main className="p-5 overflow-auto text-foreground">{children}</main>
    </div>
  );
}
