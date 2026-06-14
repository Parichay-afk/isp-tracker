"use client";

import { useEffect, useState } from "react";
import { ChangelogEntry } from "@/types";
import { format } from "date-fns";

interface Props {
  taskGid: string;
  taskName: string;
  onClose: () => void;
}

const FIELD_LABELS: Record<string, string> = {
  name: "Wall Name",
  status: "Status",
  due_on: "Due Date",
  responsible: "Responsible Party",
  task: "Task",
  completed: "Completed",
  note: "Note Added",
};

const SOURCE_BADGE = {
  tracker: "bg-blue-50 text-blue-700 border-blue-200",
  asana: "bg-purple-50 text-purple-700 border-purple-200",
};

export default function ChangelogPanel({ taskGid, taskName, onClose }: Props) {
  const [entries, setEntries] = useState<ChangelogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/tasks/${taskGid}/changelog`);
        const data = await res.json();
        setEntries(data.changelog || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [taskGid]);

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="flex-1 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="w-full max-w-md bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="bg-praxis px-6 py-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wide mb-1">Change History</p>
            <h2 className="text-white font-semibold text-sm leading-snug">{taskName}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors mt-0.5"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-6 h-6 border-2 border-slate-200 border-t-slate-600 rounded-full animate-spin" />
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-slate-500 text-sm">No changes recorded yet</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {entries.map((entry) => (
                <div key={entry.id} className="px-6 py-4">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                      {FIELD_LABELS[entry.field_name] || entry.field_name}
                    </span>
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded border font-medium ${
                        SOURCE_BADGE[entry.source] || "bg-gray-50 text-gray-600 border-gray-200"
                      }`}
                    >
                      {entry.source === "asana" ? "Asana" : "Tracker"}
                    </span>
                  </div>

                  {entry.old_value && entry.new_value ? (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="line-through text-slate-400 max-w-[120px] truncate">
                        {entry.old_value}
                      </span>
                      <svg className="w-3 h-3 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                      <span className="font-medium text-slate-800 max-w-[120px] truncate">
                        {entry.new_value}
                      </span>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-600">
                      {entry.new_value || entry.old_value || "Changed"}
                    </p>
                  )}

                  <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {format(new Date(entry.changed_at), "MMM d, yyyy 'at' h:mm a")}
                    <span className="text-slate-300">·</span>
                    <span>{entry.changed_by}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
