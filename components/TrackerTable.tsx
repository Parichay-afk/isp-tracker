"use client";

import { useEffect, useState, useCallback } from "react";
import { TrackerTask, StatusOption, STATUS_OPTIONS, STATUS_COLORS } from "@/types";
import StatusDropdown from "./StatusDropdown";
import ChangelogPanel from "./ChangelogPanel";
import NotesPanel from "./NotesPanel";
import { format, parseISO, isAfter, addDays, startOfDay } from "date-fns";

type Panel = { type: "changelog"; task: TrackerTask } | { type: "notes"; task: TrackerTask } | null;
type SortDir = "asc" | "desc";

interface Section {
  key: string;
  label: string;
  color: string;
  tasks: TrackerTask[];
}

// ---- Helpers ----

function getSection(task: TrackerTask): "done" | "thisWeek" | "nextWeek" | "later" {
  if (task.status === "Installed") return "done";
  if (!task.due_on) return "later";
  const due = parseISO(task.due_on);
  const today = startOfDay(new Date());
  if (!isAfter(due, addDays(today, 7))) return "thisWeek";
  if (!isAfter(due, addDays(today, 14))) return "nextWeek";
  return "later";
}

function sortByDate(tasks: TrackerTask[], dir: SortDir): TrackerTask[] {
  return [...tasks].sort((a, b) => {
    if (!a.due_on && !b.due_on) return 0;
    if (!a.due_on) return 1;
    if (!b.due_on) return -1;
    const diff = a.due_on.localeCompare(b.due_on);
    return dir === "asc" ? diff : -diff;
  });
}

// ---- Progress Bar ----

function ProgressBar({ tasks }: { tasks: TrackerTask[] }) {
  const total = tasks.length;
  const done = tasks.filter((t) => t.status === "Installed").length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  const barColor = pct === 100 ? "bg-green-500" : pct >= 60 ? "bg-blue-500" : pct >= 30 ? "bg-amber-500" : "bg-slate-400";

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 mb-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-semibold text-slate-800">Overall Progress</p>
          <p className="text-xs text-slate-500 mt-0.5">{done} of {total} walls installed</p>
        </div>
        <span className="text-2xl font-bold text-praxis">{pct}%</span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
        <div
          className={`h-3 rounded-full transition-all duration-700 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex items-center justify-between mt-2 text-xs text-slate-400">
        <span>0%</span>
        <span>100% complete</span>
      </div>
    </div>
  );
}

// ---- Status Filter Chips ----

function StatusFilters({
  active,
  onChange,
  counts,
}: {
  active: StatusOption | null;
  onChange: (s: StatusOption | null) => void;
  counts: Record<string, number>;
}) {
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      <button
        onClick={() => onChange(null)}
        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
          active === null
            ? "bg-praxis text-white border-praxis"
            : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
        }`}
      >
        All ({Object.values(counts).reduce((a, b) => a + b, 0)})
      </button>
      {STATUS_OPTIONS.map((s) =>
        counts[s] ? (
          <button
            key={s}
            onClick={() => onChange(active === s ? null : s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
              active === s
                ? `${STATUS_COLORS[s]} ring-2 ring-offset-1 ring-slate-400`
                : `${STATUS_COLORS[s]} opacity-70 hover:opacity-100`
            }`}
          >
            {s} ({counts[s]})
          </button>
        ) : null
      )}
    </div>
  );
}

// ---- Task Row ----

function TaskRow({
  task,
  idx,
  saving,
  editingName,
  nameValue,
  noteCount,
  onStatusChange,
  onDateChange,
  onResponsibleChange,
  onNameClick,
  onNameChange,
  onNameSave,
  onNameKeyDown,
  onNotesClick,
  onHistoryClick,
}: {
  task: TrackerTask;
  idx: number;
  saving: Record<string, boolean>;
  editingName: string | null;
  nameValue: string;
  noteCount: number;
  onStatusChange: (t: TrackerTask, v: StatusOption) => void;
  onDateChange: (t: TrackerTask, v: string) => void;
  onResponsibleChange: (t: TrackerTask, v: "Praxis" | "ISP") => void;
  onNameClick: (t: TrackerTask) => void;
  onNameChange: (v: string) => void;
  onNameSave: (t: TrackerTask) => void;
  onNameKeyDown: (e: React.KeyboardEvent, t: TrackerTask) => void;
  onNotesClick: (t: TrackerTask) => void;
  onHistoryClick: (t: TrackerTask) => void;
}) {
  const isOverdue =
    task.due_on &&
    task.status !== "Installed" &&
    parseISO(task.due_on) < startOfDay(new Date());

  return (
    <tr className="bg-white hover:bg-slate-50 transition-colors group border-b border-slate-100 last:border-0">
      <td className="px-5 py-3.5 text-xs text-slate-400 font-mono w-8">
        {String(idx + 1).padStart(2, "0")}
      </td>

      <td className="px-4 py-3.5 min-w-[200px]">
        {editingName === task.gid ? (
          <input
            type="text"
            value={nameValue}
            onChange={(e) => onNameChange(e.target.value)}
            onBlur={() => onNameSave(task)}
            onKeyDown={(e) => onNameKeyDown(e, task)}
            autoFocus
            className="w-full text-sm font-medium text-slate-800 border border-slate-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
        ) : (
          <button
            onClick={() => onNameClick(task)}
            className="text-sm font-medium text-slate-800 hover:text-slate-600 text-left w-full truncate"
            title={task.name}
          >
            {task.name}
          </button>
        )}
      </td>

      <td className="px-4 py-3.5 w-[200px]">
        <div className="flex items-center gap-2">
          <StatusDropdown value={task.status} onChange={(v) => onStatusChange(task, v)} />
          {saving[`${task.gid}-status`] && <Spinner />}
        </div>
      </td>

      <td className="px-4 py-3.5 w-[150px]">
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={task.due_on || ""}
            onChange={(e) => onDateChange(task, e.target.value)}
            className={`text-xs border rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-slate-400 cursor-pointer ${
              isOverdue
                ? "border-red-300 text-red-600 bg-red-50"
                : "border-slate-200 text-slate-700"
            }`}
          />
          {saving[`${task.gid}-due_on`] && <Spinner />}
        </div>
      </td>

      <td className="px-4 py-3.5 w-[130px]">
        <div className="flex items-center gap-2">
          <select
            value={task.responsible}
            onChange={(e) => onResponsibleChange(task, e.target.value as "Praxis" | "ISP")}
            className={`text-xs font-medium px-2.5 py-1.5 rounded-lg border cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-400 ${
              task.responsible === "Praxis"
                ? "bg-praxis text-white border-praxis-dark"
                : "bg-amber-50 text-amber-800 border-amber-200"
            }`}
          >
            <option value="Praxis">Praxis</option>
            <option value="ISP">ISP</option>
          </select>
          {saving[`${task.gid}-responsible`] && <Spinner />}
        </div>
      </td>

      <td className="px-4 py-3.5 min-w-[260px]">
        <button
          onClick={() => onNotesClick(task)}
          className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-800 transition-colors group/note w-full text-left"
        >
          <div className="flex-1 min-w-0">
            {noteCount > 0 ? (
              <span className="text-slate-600">
                {noteCount} note{noteCount !== 1 ? "s" : ""}
              </span>
            ) : (
              <span className="text-slate-300 group-hover/note:text-slate-400 italic">
                Click to add a note...
              </span>
            )}
          </div>
          <svg className="w-3.5 h-3.5 flex-shrink-0 opacity-0 group-hover/note:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </button>
      </td>

      <td className="px-4 py-3.5 w-[100px]">
        <button
          onClick={() => onHistoryClick(task)}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          History
        </button>
      </td>
    </tr>
  );
}

function Spinner() {
  return <div className="w-3 h-3 border border-slate-300 border-t-slate-600 rounded-full animate-spin flex-shrink-0" />;
}


// ---- Mobile Task Card ----

function MobileTaskCard({
  task,
  saving,
  editingName,
  nameValue,
  noteCount,
  onStatusChange,
  onDateChange,
  onResponsibleChange,
  onNameClick,
  onNameChange,
  onNameSave,
  onNameKeyDown,
  onNotesClick,
  onHistoryClick,
}: {
  task: TrackerTask;
  saving: Record<string, boolean>;
  editingName: string | null;
  nameValue: string;
  noteCount: number;
  onStatusChange: (t: TrackerTask, v: StatusOption) => void;
  onDateChange: (t: TrackerTask, v: string) => void;
  onResponsibleChange: (t: TrackerTask, v: "Praxis" | "ISP") => void;
  onNameClick: (t: TrackerTask) => void;
  onNameChange: (v: string) => void;
  onNameSave: (t: TrackerTask) => void;
  onNameKeyDown: (e: React.KeyboardEvent, t: TrackerTask) => void;
  onNotesClick: (t: TrackerTask) => void;
  onHistoryClick: (t: TrackerTask) => void;
}) {
  const isOverdue =
    task.due_on &&
    task.status !== "Installed" &&
    parseISO(task.due_on) < startOfDay(new Date());

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      {/* Top row: status + responsible */}
      <div className="flex items-center justify-between px-4 pt-3.5 pb-2">
        <StatusDropdown value={task.status} onChange={(v) => onStatusChange(task, v)} />
        <div className="flex items-center gap-2">
          {saving[`${task.gid}-status`] && <Spinner />}
          <select
            value={task.responsible}
            onChange={(e) => onResponsibleChange(task, e.target.value as "Praxis" | "ISP")}
            className={`text-xs font-medium px-2.5 py-1.5 rounded-lg border cursor-pointer focus:outline-none ${
              task.responsible === "Praxis"
                ? "bg-praxis text-white border-praxis-dark"
                : "bg-amber-50 text-amber-800 border-amber-200"
            }`}
          >
            <option value="Praxis">Praxis</option>
            <option value="ISP">ISP</option>
          </select>
          {saving[`${task.gid}-responsible`] && <Spinner />}
        </div>
      </div>

      {/* Wall name */}
      <div className="px-4 pb-2">
        {editingName === task.gid ? (
          <input
            type="text"
            value={nameValue}
            onChange={(e) => onNameChange(e.target.value)}
            onBlur={() => onNameSave(task)}
            onKeyDown={(e) => onNameKeyDown(e, task)}
            autoFocus
            className="w-full text-sm font-semibold text-slate-800 border border-slate-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-praxis"
          />
        ) : (
          <button
            onClick={() => onNameClick(task)}
            className="text-sm font-semibold text-slate-800 text-left w-full leading-snug"
          >
            {task.name}
          </button>
        )}
      </div>

      {/* Due date */}
      <div className="px-4 pb-3 flex items-center gap-2">
        <svg className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <input
          type="date"
          value={task.due_on || ""}
          onChange={(e) => onDateChange(task, e.target.value)}
          className={`text-xs border rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-praxis ${
            isOverdue
              ? "border-red-300 text-red-600 bg-red-50"
              : "border-slate-200 text-slate-600"
          }`}
        />
        {saving[`${task.gid}-due_on`] && <Spinner />}
        {!task.due_on && <span className="text-xs text-slate-400 italic">No date set</span>}
      </div>

      {/* Bottom row: notes + history */}
      <div className="border-t border-slate-100 flex divide-x divide-slate-100">
        <button
          onClick={() => onNotesClick(task)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
          </svg>
          {noteCount > 0 ? `${noteCount} note${noteCount !== 1 ? "s" : ""}` : "Add note"}
        </button>
        <button
          onClick={() => onHistoryClick(task)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          History
        </button>
      </div>
    </div>
  );
}

// ---- Section Block ----

function SectionBlock({
  section,
  collapsed,
  onToggle,
  children,
  mobileCards,
}: {
  section: Section;
  collapsed: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  mobileCards: React.ReactNode;
}) {
  if (section.tasks.length === 0) return null;
  return (
    <div className="mb-4">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 py-2 px-1 group"
      >
        <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${section.color}`} />
        <span className="text-sm font-semibold text-slate-700 group-hover:text-slate-900">
          {section.label}
        </span>
        <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
          {section.tasks.length}
        </span>
        <div className="flex-1 h-px bg-slate-100" />
        <svg
          className={`w-4 h-4 text-slate-400 transition-transform ${collapsed ? "-rotate-90" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {!collapsed && (
        <>
          {/* Desktop: table */}
          <div className="hidden md:block rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="bg-praxis text-white/80 text-xs font-semibold uppercase tracking-wide">
                    <th className="text-left px-5 py-3 w-8">#</th>
                    <th className="text-left px-4 py-3 min-w-[200px]">Wall / Space</th>
                    <th className="text-left px-4 py-3 w-[200px]">Status</th>
                    <th className="text-left px-4 py-3 w-[150px]">Due Date</th>
                    <th className="text-left px-4 py-3 w-[130px]">Responsible</th>
                    <th className="text-left px-4 py-3 min-w-[260px]">Notes</th>
                    <th className="text-left px-4 py-3 w-[100px]">History</th>
                  </tr>
                </thead>
                <tbody>{children}</tbody>
              </table>
            </div>
          </div>

          {/* Mobile: cards */}
          <div className="md:hidden space-y-3">
            {mobileCards}
          </div>
        </>
      )}
    </div>
  );
}

// ---- Main Component ----

export default function TrackerTable({ projectName }: { projectName: string }) {
  const [tasks, setTasks] = useState<TrackerTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");
  const [panel, setPanel] = useState<Panel>(null);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [editingName, setEditingName] = useState<string | null>(null);
  const [nameValue, setNameValue] = useState("");
  const [noteCounts, setNoteCounts] = useState<Record<string, number>>({});
  const [statusFilter, setStatusFilter] = useState<StatusOption | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({ done: true });

  const fetchTasks = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setSyncing(true);
    try {
      const res = await fetch(`/api/tasks?project=${encodeURIComponent(projectName)}&t=${Date.now()}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load tasks");
      const data = await res.json();
      setTasks(data.tasks || []);
      setLastRefresh(new Date());
      setError("");
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  }, []);

  const fetchNoteCounts = useCallback(async (taskList: TrackerTask[]) => {
    const counts: Record<string, number> = {};
    await Promise.all(
      taskList.map(async (task) => {
        try {
          const res = await fetch(`/api/tasks/${task.gid}/notes`);
          const data = await res.json();
          counts[task.gid] = (data.notes || []).length;
        } catch {
          counts[task.gid] = 0;
        }
      })
    );
    setNoteCounts(counts);
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);
  useEffect(() => { if (tasks.length > 0) fetchNoteCounts(tasks); }, [tasks, fetchNoteCounts]);
  useEffect(() => {
    const interval = setInterval(() => fetchTasks(true), 30_000);
    return () => clearInterval(interval);
  }, [fetchTasks]);

  async function updateField(task: TrackerTask, field: string, value: unknown, optimistic?: (prev: TrackerTask[]) => TrackerTask[]) {
    const key = `${task.gid}-${field}`;
    setSaving((s) => ({ ...s, [key]: true }));
    if (optimistic) setTasks(optimistic);
    try {
      const res = await fetch(`/api/tasks/${task.gid}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ field, value, taskName: task.name }),
      });
      if (!res.ok) throw new Error("Update failed");
    } catch (e) {
      console.error(e);
      fetchTasks(true);
    } finally {
      setSaving((s) => ({ ...s, [key]: false }));
    }
  }

  function toggleSection(key: string) {
    setCollapsed((c) => ({ ...c, [key]: !c[key] }));
  }

  // Apply filter then sort
  const filtered = tasks.filter((t) => !statusFilter || t.status === statusFilter);
  const sorted = sortByDate(filtered, sortDir);

  // Group into sections
  const groups = { thisWeek: [] as TrackerTask[], nextWeek: [] as TrackerTask[], later: [] as TrackerTask[], done: [] as TrackerTask[] };
  sorted.forEach((t) => groups[getSection(t)].push(t));

  const sections: Section[] = [
    { key: "thisWeek", label: "This Week", color: "bg-red-400", tasks: groups.thisWeek },
    { key: "nextWeek", label: "Next Week", color: "bg-amber-400", tasks: groups.nextWeek },
    { key: "later", label: "Later", color: "bg-slate-400", tasks: groups.later },
    { key: "done", label: "Done", color: "bg-green-400", tasks: groups.done },
  ];

  // Status counts for filter chips
  const statusCounts: Record<string, number> = {};
  tasks.forEach((t) => {
    if (t.status) statusCounts[t.status] = (statusCounts[t.status] || 0) + 1;
  });

  // Shared row handlers
  const rowHandlers = {
    saving,
    editingName,
    nameValue,
    onStatusChange: (t: TrackerTask, v: StatusOption) =>
      updateField(t, "status", v, (prev) => prev.map((x) => (x.gid === t.gid ? { ...x, status: v } : x))),
    onDateChange: (t: TrackerTask, v: string) =>
      updateField(t, "due_on", v || null, (prev) => prev.map((x) => (x.gid === t.gid ? { ...x, due_on: v || null } : x))),
    onResponsibleChange: (t: TrackerTask, v: "Praxis" | "ISP") =>
      updateField(t, "responsible", v, (prev) => prev.map((x) => (x.gid === t.gid ? { ...x, responsible: v } : x))),
    onNameClick: (t: TrackerTask) => { setEditingName(t.gid); setNameValue(t.name); },
    onNameChange: (v: string) => setNameValue(v),
    onNameSave: (t: TrackerTask) => {
      const trimmed = nameValue.trim();
      if (trimmed && trimmed !== t.name) updateField(t, "name", trimmed, (prev) => prev.map((x) => (x.gid === t.gid ? { ...x, name: trimmed } : x)));
      setEditingName(null);
    },
    onNameKeyDown: (e: React.KeyboardEvent, t: TrackerTask) => {
      if (e.key === "Enter") { const trimmed = nameValue.trim(); if (trimmed && trimmed !== t.name) updateField(t, "name", trimmed, (prev) => prev.map((x) => (x.gid === t.gid ? { ...x, name: trimmed } : x))); setEditingName(null); }
      if (e.key === "Escape") setEditingName(null);
    },
    onNotesClick: (t: TrackerTask) => setPanel({ type: "notes", task: t }),
    onHistoryClick: (t: TrackerTask) => setPanel({ type: "changelog", task: t }),
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-600 rounded-full animate-spin mb-4" />
        <p className="text-slate-400 text-sm">Loading tracker from Asana...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md text-center">
          <p className="text-red-700 font-medium text-sm">Connection Error</p>
          <p className="text-red-500 text-xs mt-1">{error}</p>
          <button onClick={() => fetchTasks()} className="mt-4 px-4 py-2 bg-praxis text-white text-sm rounded-lg hover:bg-praxis-light">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Progress bar */}
      <ProgressBar tasks={tasks} />

      {/* Controls row */}
      <div className="flex items-center justify-between gap-4 mb-3">
        <StatusFilters active={statusFilter} onChange={setStatusFilter} counts={statusCounts} />
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 bg-white rounded-lg px-3 py-1.5 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7l4-4m0 0l4 4m-4-4v18M16 17l-4 4m0 0l-4-4m4 4V3" />
            </svg>
            Date {sortDir === "asc" ? "Earliest first" : "Latest first"}
          </button>
          <button
            onClick={() => fetchTasks(true)}
            disabled={syncing}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 bg-white rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50"
          >
            <svg className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {syncing ? "Syncing..." : "Sync with Asana"}
          </button>
        </div>
      </div>

      <p className="text-xs text-slate-400 mb-4">
        {filtered.length} wall{filtered.length !== 1 ? "s" : ""} shown · Last synced {format(lastRefresh, "h:mm a")} · Auto-refreshes every 30s
      </p>

      {/* Sections */}
      {sections.map((section) => (
        <SectionBlock
          key={section.key}
          section={section}
          collapsed={!!collapsed[section.key]}
          onToggle={() => toggleSection(section.key)}
          mobileCards={section.tasks.map((task) => (
            <MobileTaskCard key={task.gid} task={task} noteCount={noteCounts[task.gid] || 0} {...rowHandlers} />
          ))}
        >
          {section.tasks.map((task, idx) => (
            <TaskRow key={task.gid} task={task} idx={idx} noteCount={noteCounts[task.gid] || 0} {...rowHandlers} />
          ))}
        </SectionBlock>
      ))}

      {filtered.length === 0 && (
        <div className="text-center py-16 text-slate-400 text-sm">No tasks match the current filter</div>
      )}

      {panel?.type === "changelog" && (
        <ChangelogPanel taskGid={panel.task.gid} taskName={panel.task.name} onClose={() => setPanel(null)} />
      )}
      {panel?.type === "notes" && (
        <NotesPanel
          taskGid={panel.task.gid}
          taskName={panel.task.name}
          onClose={() => { setPanel(null); fetchNoteCounts(tasks); }}
        />
      )}
    </>
  );
}
