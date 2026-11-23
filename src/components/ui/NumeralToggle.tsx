"use client";

import React from "react";
import { useLearner } from "@/components/providers/LearnerProvider";

interface NumeralToggleProps {
  className?: string;
}

export function NumeralToggle({ className = "" }: NumeralToggleProps) {
  const { numeralPref, toggleNumeralPref } = useLearner();
  const isKhmer = numeralPref === "km";

  return (
    <button
      type="button"
      data-testid="numeral-toggle"
      onClick={() => void toggleNumeralPref()}
      aria-pressed={!isKhmer}
      className={`khmer-chip inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 text-sm font-semibold text-ink shadow-xs transition-colors hover:bg-surface-subtle ${className}`}
    >
      <span className="sr-only">
        {isKhmer ? "ប្ដូរទៅលេខអារ៉ាប់ " : "ប្ដូរទៅលេខខ្មែរ "}
      </span>
      <span
        className={`rounded-full px-2 py-0.5 transition-colors ${
          isKhmer
            ? "bg-accent text-white"
            : "text-ink-muted"
        }`}
      >
        ១២៣
      </span>
      {" "}
      <span
        className={`rounded-full px-2 py-0.5 transition-colors ${
          !isKhmer
            ? "bg-accent text-white"
            : "text-ink-muted"
        }`}
      >
        123
      </span>
    </button>
  );
}
