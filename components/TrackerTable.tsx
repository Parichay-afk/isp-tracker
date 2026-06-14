"use client";

import { useEffect, useState, useCallback } from "react";
import { TrackerTask, StatusOption, Note } from "@/types";
import StatusDropdown from "./StatusDropdown";
import ChangelogPanel from "./ChangelogPanel";
import NotesPanel from "./NotesPanel";
import { format } from "date-fns";

type Panel =
  | { type: "changelog"; task: TrackerTask }
  | { type: "notes"; task: TrackerTask }
  | null;

export default function TrackerTable() {
  const [tasks, setTasks] = useState<TrackerTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [panel, setPanel] = useState<Panel>(null);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [editingName, setEditingName] = useState<string | null>(null);
  const [nameValue, setNameValue] = useState("");
  const [noteCounts, setNoteCounts] = useState<Record<string, number>>({});

  const fetchTasks = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch("/api/tasks");
      if (!res.ok) throw new Error("Failed to load tasks");
      const data = await res.json();
      setTasks(data.tasks || []);
      setLastRefresh(new Date());
      setError("");
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch note counts for all tasks
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

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    if (tasks.length > 0) {
      fetchNoteCounts(tasks);
    }
  }, [tasks, fetchNoteCounts]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => fetchTasks(true), 30_000);
    return () => clearInterval(interval);
  }, [fetchTasks]);

  async function updateField(
    task: TrackerTask,
    field: string,
    value: unknown,
    optimisticUpdate?: (prev: TrackerTask[]) => TrackerTask[]
  ) {
    const key = `${task.gid}-${field}`;
    setSaving((s) => ({ ...s, [key]: true }));

    if (optimisticUpdate) {
      setTasks(optimisticUpdate);
    }

    try {
      const res = await fetch(`/api/tasks/${task.gid}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ field, value, taskName: task.name }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Update failed");
      }
    } catch (e) {
      console.error("Update failed:", e);
      // Revert on failure
      fetchTasks(true);
    } finally {
      setSaving((s) => ({ ...s, [key]: false }));
    }
  }

  function handleStatusChange(task: TrackerTask, newStatus: StatusOption) {
    updateField(task, "status", newStatus, (prev) =>
      prev.map((t) => (t.gid === task.gid ? { ...t, status: newStatus } : t))
    );
  }

  function handleDateChange(task: TrackerTask, newDate: string) {
    updateField(task, "due_on", newDate || null, (prev) =>
      prev.map((t) => (t.gid === task.gid ? { ...t, due_on: newDate || null } : t))
    );
  }

  function handleResponsibleChange(
    task: TrackerTask,
    newValue: "Praxis" | "ISP"
  ) {
    updateField(task, "responsible", newValue, (prev) =>
      prev.map((t) => (t.gid === task.gid ? { ...t, responsible: newValue } : t))
    );
  }

  function handleNameSave(task: TrackerTask) {
    const trimmed = nameValue.trim();
    if (!trimmed || trimmed === task.name) {
      setEditingName(null);
      return;
    }
    updateField(task, "name", trimmed, (prev) =>
      prev.map((t) => (t.gid === task.gid ? { ...t, name: trimmed } : t))
    );
    setEditingName(null);
  }

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
          <svg className="w-8 h-8 text-red-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-red-700 font-medium text-sm">Connection Error</p>
          <p className="text-red-500 text-xs mt-1">{error}</p>
          <button
            onClick={() => fetchTasks()}
            className="mt-4 px-4 py-2 bg-slate-800 text-white text-sm rounded-lg hover:bg-slate-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Refresh indicator */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-slate-400">
          {tasks.length} {tasks.length === 1 ? "wall" : "walls"} · Last updated{" "}
          {format(lastRefresh, "h:mm a")} · Auto-refreshes every 30s
        </p>
        <button
          onClick={() => fetchTasks()}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Table wrapper */}
      <div className="rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="bg-slate-800 text-slate-300 text-xs font-semibold uppercase tracking-wide">
                <th className="text-left px-5 py-3.5 w-8">#</th>
                <th className="text-left px-4 py-3.5 min-w-[200px]">Wall / Space</th>
                <th className="text-left px-4 py-3.5 w-[190px]">Status</th>
                <th className="text-left px-4 py-3.5 w-[140px]">Due Date</th>
                <th className="text-left px-4 py-3.5 w-[130px]">Responsible</th>
                <th className="text-left px-4 py-3.5 min-w-[260px]">Notes</th>
                <th className="text-left px-4 py-3.5 w-[100px]">History</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tasks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-slate-400 text-sm">
                    No active tasks found in this project
                  </td>
                </tr>
              ) : (
                tasks.map((task, idx) => {
                  const statusKey = `${task.gid}-status`;
                  const dateKey = `${task.gid}-due_on`;
                  const responsibleKey = `${task.gid}-responsible`;

                  return (
                    <tr
                      key={task.gid}
                      className="bg-white hover:bg-slate-50 transition-colors group"
                    >
                      {/* Row number */}
                      <td className="px-5 py-3.5 text-xs text-slate-400 font-mono">
                        {String(idx + 1).padStart(2, "0")}
                      </td>

                      {/* Wall name */}
                      <td className="px-4 py-3.5">
                        {editingName === task.gid ? (
                          <input
                            type="text"
                            value={nameValue}
                            onChange={(e) => setNameValue(e.target.value)}
                            onBlur={() => handleNameSave(task)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleNameSave(task);
                              if (e.key === "Escape") setEditingName(null);
                            }}
                            autoFocus
                            className="w-full text-sm font-medium text-slate-800 border border-slate-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-slate-400"
                          />
                        ) : (
                          <button
                            onClick={() => {
                              setEditingName(task.gid);
                              setNameValue(task.name);
                            }}
                            className="text-sm font-medium text-slate-800 hover:text-slate-600 text-left w-full truncate"
                            title={task.name}
                          >
                            {task.name}
                          </button>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <StatusDropdown
                            value={task.status}
                            onChange={(v) => handleStatusChange(task, v)}
                          />
                          {saving[statusKey] && (
                            <div className="w-3 h-3 border border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                          )}
                        </div>
                      </td>

                      {/* Due date */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <input
                            type="date"
                            value={task.due_on || ""}
                            onChange={(e) => handleDateChange(task, e.target.value)}
                            className="text-xs text-slate-700 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-slate-400 cursor-pointer"
                          />
                          {saving[dateKey] && (
                            <div className="w-3 h-3 border border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                          )}
                        </div>
                      </td>

                      {/* Responsible */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <select
                            value={task.responsible}
                            onChange={(e) =>
                              handleResponsibleChange(
                                task,
                                e.target.value as "Praxis" | "ISP"
                              )
                            }
                            className={`text-xs font-medium px-2.5 py-1.5 rounded-lg border cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-400 ${
                              task.responsible === "Praxis"
                                ? "bg-slate-800 text-white border-slate-700"
                                : "bg-amber-50 text-amber-800 border-amber-200"
                            }`}
                          >
                            <option value="Praxis">Praxis</option>
                            <option value="ISP">ISP</option>
                          </select>
                          {saving[responsibleKey] && (
                            <div className="w-3 h-3 border border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                          )}
                        </div>
                      </td>

                      {/* Notes */}
                      <td className="px-4 py-3.5">
                        <button
                          onClick={() => setPanel({ type: "notes", task })}
                          className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-800 transition-colors group/note w-full text-left"
                        >
                          <div className="flex-1 min-w-0">
                            {noteCounts[task.gid] ? (
                              <span className="text-slate-600">
                                {noteCounts[task.gid]} note{noteCounts[task.gid] !== 1 ? "s" : ""}
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

                      {/* History */}
                      <td className="px-4 py-3.5">
                        <button
                          onClick={() => setPanel({ type: "changelog", task })}
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
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Side panels */}
      {panel?.type === "changelog" && (
        <ChangelogPanel
          taskGid={panel.task.gid}
          taskName={panel.task.name}
          onClose={() => setPanel(null)}
        />
      )}
      {panel?.type === "notes" && (
        <NotesPanel
          taskGid={panel.task.gid}
          taskName={panel.task.name}
          onClose={() => {
            setPanel(null);
            fetchNoteCounts(tasks);
          }}
        />
      )}
    </>
  );
}
