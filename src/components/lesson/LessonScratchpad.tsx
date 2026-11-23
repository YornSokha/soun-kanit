"use client";

import React, { useRef, useState } from "react";
import {
  formatDisplayNumber,
  type NumeralPreference,
} from "@/lib/khmer/numerals";

interface Stroke {
  color: string;
  points: Array<{ x: number; y: number }>;
}

interface LessonScratchpadProps {
  numeralPref: NumeralPreference;
}

const PAD_COLORS = [
  { id: "blue", hex: "#2563eb", labelKm: "ខៀវ" },
  { id: "amber", hex: "#b45309", labelKm: "មាស" },
  { id: "green", hex: "#15803d", labelKm: "បៃតង" },
] as const;

export function LessonScratchpad({ numeralPref }: LessonScratchpadProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [inkColor, setInkColor] = useState<string>("#2563eb");
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [activeStroke, setActiveStroke] = useState<Stroke | null>(null);
  const [tallyCount, setTallyCount] = useState<number>(0);

  const getSvgCoords = (e: React.PointerEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;
    const x = ((e.clientX - rect.left) / rect.width) * 320;
    const y = ((e.clientY - rect.top) / rect.height) * 170;
    return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
  };

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    const pt = getSvgCoords(e);
    if (!pt) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    setActiveStroke({ color: inkColor, points: [pt] });
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!activeStroke) return;
    const pt = getSvgCoords(e);
    if (!pt) return;
    setActiveStroke((prev) =>
      prev ? { ...prev, points: [...prev.points, pt] } : null
    );
  };

  const handlePointerUp = () => {
    if (!activeStroke) return;
    setStrokes((prev) => [...prev, activeStroke]);
    setActiveStroke(null);
  };

  const handleUndo = () => {
    if (strokes.length > 0) {
      setStrokes((prev) => prev.slice(0, -1));
    } else if (tallyCount > 0) {
      setTallyCount((c) => c - 1);
    }
  };

  const handleClear = () => {
    setStrokes([]);
    setActiveStroke(null);
    setTallyCount(0);
  };

  const allStrokes = activeStroke ? [...strokes, activeStroke] : strokes;

  return (
    <div
      data-testid="lesson-scratchpad-panel"
      className="rounded-2xl border-2 border-dashed border-accent/50 bg-canvas p-3 space-y-2.5"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-bold text-ink">
          ក្រដាសព្រាងគិតលេខ (គូស ឬប៉ះបន្ថែមចំណុចរាប់)
        </p>
        <div className="flex items-center gap-1.5">
          {PAD_COLORS.map((c) => (
            <button
              key={c.id}
              type="button"
              aria-pressed={inkColor === c.hex}
              onClick={() => setInkColor(c.hex)}
              className={`khmer-chip inline-flex items-center gap-1 rounded-full border px-2.5 text-xs font-bold ${
                inkColor === c.hex
                  ? "border-ink bg-surface text-ink"
                  : "border-border bg-surface-subtle text-ink-muted"
              }`}
            >
              <span
                aria-hidden="true"
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: c.hex }}
              />
              <span>{c.labelKm}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Safari-safe inline SVG doodle pad (zero foreignObject) */}
      <svg
        ref={svgRef}
        viewBox="0 0 320 170"
        className="w-full h-auto touch-none select-none rounded-xl border border-border bg-surface shadow-inner cursor-crosshair"
        role="img"
        aria-label={`ក្រដាសព្រាងមានគំនូស ${formatDisplayNumber(allStrokes.length, numeralPref)} និងចំណុចរាប់ ${formatDisplayNumber(tallyCount, numeralPref)}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {/* Soft notebook horizontal lines */}
        {[34, 68, 102, 136].map((y) => (
          <line
            key={y}
            x1={8}
            y1={y}
            x2={312}
            y2={y}
            stroke="#f1ece2"
            strokeWidth={1.2}
          />
        ))}

        {/* Single-pointer tap-added tally dots (grouped in 5s) */}
        {Array.from({ length: tallyCount }).map((_, idx) => {
          const group = Math.floor(idx / 5);
          const posInGroup = idx % 5;
          const x = 20 + (group % 5) * 58 + posInGroup * 9;
          const y = 24 + Math.floor(group / 5) * 26;
          return (
            <circle
              key={`tally-${idx}`}
              cx={x}
              cy={y}
              r={3.8}
              fill="#d97706"
            />
          );
        })}

        {/* Freehand doodle strokes */}
        {allStrokes.map((s, idx) =>
          s.points.length === 1 ? (
            <circle
              key={`st-${idx}`}
              cx={s.points[0].x}
              cy={s.points[0].y}
              r={2.5}
              fill={s.color}
            />
          ) : (
            <polyline
              key={`st-${idx}`}
              points={s.points.map((p) => `${p.x},${p.y}`).join(" ")}
              fill="none"
              stroke={s.color}
              strokeWidth={3.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )
        )}
      </svg>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          data-testid="scratchpad-tally-btn"
          disabled={tallyCount >= 25}
          onClick={() => setTallyCount((c) => Math.min(25, c + 1))}
          className="khmer-chip rounded-xl border border-amber-700/40 bg-amber-50 px-3 text-xs font-bold text-amber-900 disabled:opacity-45"
        >
          + ចំណុចរាប់ ({formatDisplayNumber(tallyCount, numeralPref)})
        </button>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            data-testid="scratchpad-undo-btn"
            disabled={strokes.length === 0 && tallyCount === 0}
            onClick={handleUndo}
            className="khmer-chip rounded-xl border border-border bg-surface px-3 text-xs font-bold text-ink disabled:opacity-40"
          >
            ត្រឡប់
          </button>
          <button
            type="button"
            data-testid="scratchpad-clear-btn"
            disabled={strokes.length === 0 && tallyCount === 0}
            onClick={handleClear}
            className="khmer-chip rounded-xl border border-border bg-surface-subtle px-3 text-xs font-semibold text-ink-muted hover:text-ink disabled:opacity-40"
          >
            លុបទាំងអស់
          </button>
        </div>
      </div>
    </div>
  );
}
