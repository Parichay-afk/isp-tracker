"use client";

import { useEffect, useState } from "react";
import { Note } from "@/types";
import { format } from "date-fns";

interface Props {
  taskGid: string;
  taskName: string;
  onClose: () => void;
}

export default function NotesPanel({ taskGid, taskName, onClose }: Props) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [author, setAuthor] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadNotes();
  }, [taskGid]);

  async function loadNotes() {
    setLoading(true);
    try {
      const res = await fetch(`/api/tasks/${taskGid}/notes`);
      const data = await res.json();
      setNotes(data.notes || []);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    if (!content.trim()) return;
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`/api/tasks/${taskGid}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content.trim(),
          author: author.trim() || "Anonymous",
          taskName,
        }),
      });

      if (!res.ok) throw new Error("Failed to add note");

      setContent("");
      await loadNotes();
    } catch (e) {
      setError("Failed to save note. Please try again.");
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      <div className="w-full max-w-md bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="bg-slate-800 px-6 py-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wide mb-1">Notes</p>
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

        {/* Add note form */}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Add a Note</p>
          <input
            type="text"
            placeholder="Your name (optional)"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 mb-2 focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white"
          />
          <textarea
            placeholder="Write a note... e.g. Design approved, waiting on content from client"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white"
          />
          {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
          <button
            onClick={handleSubmit}
            disabled={submitting || !content.trim()}
            className="mt-2 w-full bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium py-2 rounded-lg transition-colors"
          >
            {submitting ? "Saving..." : "Add Note"}
          </button>
        </div>

        {/* Notes list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-6 h-6 border-2 border-slate-200 border-t-slate-600 rounded-full animate-spin" />
            </div>
          ) : notes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
              </div>
              <p className="text-slate-500 text-sm">No notes yet</p>
              <p className="text-slate-400 text-xs mt-1">Add the first note above</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {notes.map((note) => (
                <div key={note.id} className="px-6 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-700">{note.author}</span>
                    <span className="text-xs text-slate-400">
                      {format(new Date(note.created_at), "MMM d, yyyy 'at' h:mm a")}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">{note.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
