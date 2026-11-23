"use client";

import React from "react";

interface MascotFrogProps {
  mood: "curious" | "happy" | "encouraging";
  size?: number;
}

/**
 * Friendly Cambodian pond frog companion (*កូនកង្កែបឆ្លាត*) rendered in
 * pure Safari-safe inline SVG (zero foreignObject).
 */
export function MascotFrog({ mood, size = 48 }: MascotFrogProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className="shrink-0 select-none"
      aria-hidden="true"
    >
      {/* Soft lotus halo */}
      <circle cx={32} cy={34} r={28} fill="#dcfce7" />
      {/* Frog eyes */}
      <circle cx={20} cy={20} r={9} fill="#22c55e" stroke="#15803d" strokeWidth={2} />
      <circle cx={44} cy={20} r={9} fill="#22c55e" stroke="#15803d" strokeWidth={2} />
      <circle cx={20} cy={20} r={5} fill="#ffffff" />
      <circle cx={44} cy={20} r={5} fill="#ffffff" />
      {mood === "happy" ? (
        <>
          <path d="M 17 20 Q 20 16 23 20" fill="none" stroke="#111827" strokeWidth={2.2} strokeLinecap="round" />
          <path d="M 41 20 Q 44 16 47 20" fill="none" stroke="#111827" strokeWidth={2.2} strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx={mood === "curious" ? 21 : 20} cy={20} r={2.5} fill="#111827" />
          <circle cx={mood === "curious" ? 45 : 44} cy={20} r={2.5} fill="#111827" />
        </>
      )}

      {/* Frog face */}
      <ellipse cx={32} cy={38} rx={22} ry={17} fill="#22c55e" stroke="#15803d" strokeWidth={2} />
      {/* Rosy cheeks */}
      <ellipse cx={17} cy={39} rx={4} ry={2.4} fill="#f9a8d4" opacity={0.85} />
      <ellipse cx={47} cy={39} rx={4} ry={2.4} fill="#f9a8d4" opacity={0.85} />

      {/* Mouth expression */}
      {mood === "happy" && (
        <path
          d="M 22 41 Q 32 51 42 41 Z"
          fill="#f472b6"
          stroke="#14532d"
          strokeWidth={2}
          strokeLinejoin="round"
        />
      )}
      {mood === "curious" && (
        <path
          d="M 24 43 Q 32 47 40 43"
          fill="none"
          stroke="#14532d"
          strokeWidth={2.2}
          strokeLinecap="round"
        />
      )}
      {mood === "encouraging" && (
        <path
          d="M 25 44 Q 32 46 39 42"
          fill="none"
          stroke="#14532d"
          strokeWidth={2.2}
          strokeLinecap="round"
        />
      )}

      {/* Sparkle star when happy */}
      {mood === "happy" && (
        <path
          d="M 55 11 L 57 15 L 61 17 L 57 19 L 55 23 L 53 19 L 49 17 L 53 15 Z"
          fill="#f59e0b"
        />
      )}
    </svg>
  );
}
