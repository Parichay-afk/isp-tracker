import Image from "next/image";
import TabsContainer from "@/components/TabsContainer";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-praxis border-b border-praxis-dark">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <Image
              src="/praxis-logo-white.svg"
              alt="Praxis Advertising"
              width={120}
              height={50}
              className="h-9 w-auto"
              priority
            />
            <div className="w-px h-8 bg-white/20" />
            <div>
              <h1 className="text-white font-semibold text-base tracking-tight">
                ISP Project Tracker
              </h1>
              <p className="text-white/60 text-xs mt-0.5">
                Star International School
              </p>
            </div>
          </div>
          <span className="flex items-center gap-1.5 text-xs text-white/60">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            Live sync with Asana
          </span>
        </div>
      </header>

      {/* Legend bar */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-[1400px] mx-auto px-6 py-2.5 flex items-center gap-6 text-xs text-slate-500">
          <span className="font-medium text-slate-600">Responsible:</span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-praxis rounded" />
            Praxis: our team is working on this
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-amber-100 border border-amber-200 rounded" />
            ISP: awaiting client input
          </span>
          <span className="ml-auto text-slate-400">
            Click any field to edit · Changes sync to Asana instantly
          </span>
        </div>
      </div>

      {/* Tabs + content */}
      <main className="pb-12">
        <TabsContainer />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between">
          <Image
            src="/praxis-logo-white.svg"
            alt="Praxis Advertising"
            width={72}
            height={30}
            className="h-5 w-auto opacity-30"
          />
          <span className="text-xs text-slate-400">All changes logged and synced with Asana</span>
        </div>
      </footer>
    </div>
  );
}
