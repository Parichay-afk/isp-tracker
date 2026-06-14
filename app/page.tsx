import TrackerTable from "@/components/TrackerTable";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-[1400px] mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-white font-bold text-lg tracking-tight">
                ISP Project Tracker
              </h1>
              <p className="text-slate-400 text-xs mt-0.5">
                Star International School · Managed by Praxis Advertising
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              Live sync with Asana
            </span>
          </div>
        </div>
      </header>

      {/* Legend */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-[1400px] mx-auto px-6 py-3 flex items-center gap-6 text-xs text-slate-500">
          <span className="font-medium text-slate-600">Responsible Party:</span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-slate-800 rounded" />
            Praxis — our team is working on this
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-amber-100 border border-amber-200 rounded" />
            ISP — awaiting client input
          </span>
          <span className="ml-auto text-slate-400">
            Click any field to edit · Changes sync to Asana instantly
          </span>
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-[1400px] mx-auto px-6 py-6">
        <TrackerTable />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 mt-8">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between text-xs text-slate-400">
          <span>Praxis Advertising · praxisadvertising.com</span>
          <span>All changes are logged and synced with Asana</span>
        </div>
      </footer>
    </div>
  );
}
