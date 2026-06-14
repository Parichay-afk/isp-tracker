"use client";

import { useState } from "react";
import TrackerTable from "./TrackerTable";

const PROJECTS = [
  {
    id: "al-twar",
    label: "Al Twar",
    fullName: "Star International Al Twar",
    subtitle: "Star International School, Al Twar",
  },
  {
    id: "mirdiff",
    label: "Mirdiff",
    fullName: "Mirdiff - Star International",
    subtitle: "Star International School, Mirdiff",
  },
];

export default function TabsContainer() {
  const [activeId, setActiveId] = useState(PROJECTS[0].id);
  const active = PROJECTS.find((p) => p.id === activeId)!;

  return (
    <div>
      {/* Tab bar */}
      <div className="border-b border-slate-200 bg-white mb-6">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="flex gap-0">
            {PROJECTS.map((project) => {
              const isActive = project.id === activeId;
              return (
                <button
                  key={project.id}
                  onClick={() => setActiveId(project.id)}
                  className={`relative px-5 py-3.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                    isActive
                      ? "text-praxis border-praxis"
                      : "text-slate-500 border-transparent hover:text-slate-800 hover:border-slate-300"
                  }`}
                >
                  {project.label}
                  {isActive && (
                    <span className="ml-2 text-xs bg-praxis text-white px-1.5 py-0.5 rounded-full">
                      Active
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Project subtitle */}
      <div className="max-w-[1400px] mx-auto px-6">
        <p className="text-xs text-slate-400 mb-4 font-medium uppercase tracking-wide">
          {active.subtitle}
        </p>
        <TrackerTable key={active.id} projectName={active.fullName} />
      </div>
    </div>
  );
}
