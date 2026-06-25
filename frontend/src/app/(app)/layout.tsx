import AuthGuard from "@/components/AuthGuard";
import Sidebar from "@/components/Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <header className="border-b border-[#eaeded] bg-white px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-sm">
                <span className="rounded bg-[#232f3e] px-2 py-0.5 text-xs font-medium text-white">
                  AWS
                </span>
                <span className="text-[#545b64]">Global</span>
              </div>
              <div className="text-xs text-[#545b64]">
                Mock AWS Console · Route 53 Clone
              </div>
            </div>
          </header>
          <div className="p-6">{children}</div>
        </main>
      </div>
    </AuthGuard>
  );
}
