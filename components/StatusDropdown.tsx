"use client";

import { useState, useRef, useEffect } from "react";
import { StatusOption, STATUS_OPTIONS, STATUS_COLORS } from "@/types";

interface Props {
  value: StatusOption | null;
  onChange: (value: StatusOption) => void;
  disabled?: boolean;
}

export default function StatusDropdown({ value, onChange, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const colorClass = value ? STATUS_COLORS[value] : "bg-gray-100 text-gray-500 border-gray-200";

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border cursor-pointer transition-all hover:opacity-80 ${colorClass} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        {value || "No Status"}
        {!disabled && (
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>

      {open && (
        <div className="absolute z-50 top-full mt-1 left-0 bg-white border border-gray-200 rounded-lg shadow-lg min-w-[220px] py-1 overflow-hidden">
          {STATUS_OPTIONS.map((option) => (
            <button
              key={option}
              onClick={() => {
                onChange(option);
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 flex items-center gap-2 ${
                value === option ? "bg-gray-50" : ""
              }`}
            >
              <span
                className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[option]}`}
              >
                {option}
              </span>
              {value === option && (
                <svg className="w-3 h-3 text-gray-500 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
