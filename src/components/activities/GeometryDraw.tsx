"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import type { GeometryDrawStep } from "@/lib/curriculum/schema";
import type { StepAnswer } from "@/lib/math/grader";
import {
  analyzeDrawnPolygon,
  canonicalEdgeKey,
  parsePointKey,
  pointKey,
  type DrawnEdge,
} from "@/lib/math/geometryDraw";
import {
  formatDisplayNumber,
  type NumeralPreference,
} from "@/lib/khmer/numerals";
import { playScaleNote } from "@/lib/audio/chimes";
import { useLearner } from "@/components/providers/LearnerProvider";

interface GeometryDrawProps {
  step: GeometryDrawStep;
  numeralPref: NumeralPreference;
  disabled?: boolean;
  onAnswerChange: (
    answer: Extract<StepAnswer, { type: "geometry-draw" }>
  ) => void;
}

const INK_SWATCHES = [
  { id: "blue", hex: "#2563eb", labelKm: "ខៀវ" },
  { id: "pink", hex: "#db2777", labelKm: "ផ្កាឈូក" },
  { id: "green", hex: "#15803d", labelKm: "បៃតង" },
  { id: "amber", hex: "#d97706", labelKm: "មាស" },
] as const;

const KIND_LABELS_KM: Record<string, string> = {
  triangle: "ត្រីកោណ (៣ ជ្រុង)",
  square: "ការ៉េ (៤ ជ្រុងស្មើ)",
  rectangle: "ចតុកោណកែង (៤ ជ្រុង)",
  polygon: "ពហុកោណបិទជិត",
  open: "កំពុងគូរ...",
};

export function GeometryDraw({
  step,
  numeralPref,
  disabled = false,
  onAnswerChange,
}: GeometryDrawProps) {
  const { audioEnabled } = useLearner();
  const { mode, gridRows, gridCols, templateLeftCells, inkColor } = step.config;

  const [activeColor, setActiveColor] = useState<string>(inkColor || "#2563eb");
  const [edges, setEdges] = useState<DrawnEdge[]>([]);
  const [activePeg, setActivePeg] = useState<string | null>(null);
  const [paintedCells, setPaintedCells] = useState<string[]>([]);
  const [isPointerPainting, setIsPointerPainting] = useState<boolean>(false);

  const onAnswerChangeRef = useRef(onAnswerChange);
  useEffect(() => {
    onAnswerChangeRef.current = onAnswerChange;
  }, [onAnswerChange]);

  useEffect(() => {
    if (mode === "dot-connect") {
      onAnswerChangeRef.current({
        type: "geometry-draw",
        edges,
      });
    } else {
      onAnswerChangeRef.current({
        type: "geometry-draw",
        paintedCells,
      });
    }
  }, [mode, edges, paintedCells]);

  const polyAnalysis = useMemo(() => analyzeDrawnPolygon(edges), [edges]);

  const svgSize = 320;
  const halfCols = Math.floor(gridCols / 2);
  const templateSet = useMemo(
    () => new Set(templateLeftCells),
    [templateLeftCells]
  );

  // Dot-connect peg coordinates (each peg has a 64x64 hit area)
  const pegPos = (r: number, c: number) => {
    const pad = 40;
    const stepX = gridCols > 1 ? (svgSize - pad * 2) / (gridCols - 1) : 0;
    const stepY = gridRows > 1 ? (svgSize - pad * 2) / (gridRows - 1) : 0;
    return { x: pad + c * stepX, y: pad + r * stepY };
  };

  const handlePegTap = (r: number, c: number) => {
    if (disabled) return;
    const key = pointKey(r, c);

    if (!activePeg) {
      setActivePeg(key);
      playScaleNote(r + c, audioEnabled);
      return;
    }

    if (activePeg === key) {
      setActivePeg(null);
      return;
    }

    const edgeKey = canonicalEdgeKey(activePeg, key);
    setEdges((prev) => {
      const exists = prev.some(
        (e) => canonicalEdgeKey(e.from, e.to) === edgeKey
      );
      if (exists) {
        return prev.filter((e) => canonicalEdgeKey(e.from, e.to) !== edgeKey);
      }
      playScaleNote((prev.length + 1) % 10, audioEnabled);
      return [...prev, { from: activePeg, to: key }];
    });
    setActivePeg(key);
  };

  const handleUndoEdge = () => {
    if (disabled || edges.length === 0) return;
    setEdges((prev) => prev.slice(0, -1));
    setActivePeg(null);
  };

  const handleClear = () => {
    if (disabled) return;
    setEdges([]);
    setActivePeg(null);
    setPaintedCells([]);
  };

  const toggleGridCell = (key: string, forceAdd = false) => {
    if (disabled) return;
    setPaintedCells((prev) => {
      const exists = prev.includes(key);
      if (exists && !forceAdd) {
        return prev.filter((k) => k !== key);
      }
      if (!exists) {
        playScaleNote(prev.length % 10, audioEnabled);
        return [...prev, key];
      }
      return prev;
    });
  };

  // Closed polygon fill points for dot-connect visual delight
  const closedFillPoints = useMemo(() => {
    if (!polyAnalysis.isClosed || polyAnalysis.corners.length < 3) return "";
    return polyAnalysis.corners
      .map((pt) => {
        const { x, y } = pegPos(pt.row, pt.col);
        return `${x},${y}`;
      })
      .join(" ");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [polyAnalysis, gridCols, gridRows]);

  const cellW = (svgSize - 16) / gridCols;
  const cellH = (svgSize - 16) / gridRows;

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      {/* Live geometric readout */}
      <div
        className="flex flex-wrap items-center justify-center gap-2 text-sm font-semibold"
        aria-live="polite"
      >
        {mode === "dot-connect" ? (
          <span
            data-testid="draw-status-badge"
            className="rounded-full border border-border bg-surface px-3.5 py-1 text-ink shadow-xs"
          >
            រូបដែលគូរ៖{" "}
            <strong className={polyAnalysis.isClosed ? "text-success" : "text-accent"}>
              {KIND_LABELS_KM[polyAnalysis.kind]}
            </strong>
          </span>
        ) : (
          <span
            data-testid="draw-area-badge"
            className="rounded-full border border-border bg-surface px-3.5 py-1 text-ink shadow-xs"
          >
            ប្រឡោះដែលលាបពណ៌៖{" "}
            <strong className="text-accent">
              {formatDisplayNumber(paintedCells.length, numeralPref)}
            </strong>
          </span>
        )}
      </div>

      {/* Ink color palette */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {INK_SWATCHES.map((sw) => {
          const selected = activeColor === sw.hex;
          return (
            <button
              key={sw.id}
              type="button"
              disabled={disabled}
              aria-pressed={selected}
              onClick={() => setActiveColor(sw.hex)}
              className={`khmer-chip inline-flex items-center gap-1.5 rounded-full border-2 px-3 text-xs font-bold ${
                selected
                  ? "border-ink bg-surface shadow-xs text-ink"
                  : "border-border bg-surface-subtle text-ink-muted"
              }`}
            >
              <span
                aria-hidden="true"
                className="h-4 w-4 rounded-full"
                style={{ backgroundColor: sw.hex }}
              />
              <span>{sw.labelKm}</span>
            </button>
          );
        })}
      </div>

      <p className="text-xs text-ink-muted text-center">
        {mode === "dot-connect"
          ? activePeg
            ? "ឥឡូវប៉ះចំណុចបន្ទាប់ ដើម្បីគូសបន្ទាត់តភ្ជាប់!"
            : "ប៉ះចំណុចម្ដងមួយៗ ដើម្បីគូរជ្រុងរូបធរណីមាត្រ"
          : mode === "symmetry-mirror"
            ? "ប៉ះ ឬអូសលើប្រឡោះខាងស្ដាំ ដើម្បីគូរឆ្លុះឱ្យស្មើនឹងខាងឆ្វេង!"
            : "ប៉ះ ឬអូសលើប្រឡោះក្រឡា ដើម្បីលាបពណ៌ផ្ទៃក្រឡា!"}
      </p>

      {/* Safari-safe inline SVG drawing board (zero foreignObject, >= 56x56px targets) */}
      <div className="w-full max-w-[340px] flex justify-center">
        <svg
          viewBox={`0 0 ${svgSize} ${svgSize}`}
          className="w-full h-auto select-none rounded-2xl border-2 border-border bg-surface shadow-xs"
          role="group"
          aria-label="ក្ដារគូររូបគណិត"
          onPointerUp={() => setIsPointerPainting(false)}
          onPointerLeave={() => setIsPointerPainting(false)}
        >
          {mode === "dot-connect" ? (
            <>
              {/* Subtle drafting guide lines */}
              {Array.from({ length: gridRows }).map((_, r) => {
                const pStart = pegPos(r, 0);
                const pEnd = pegPos(r, gridCols - 1);
                return (
                  <line
                    key={`h-${r}`}
                    x1={pStart.x}
                    y1={pStart.y}
                    x2={pEnd.x}
                    y2={pEnd.y}
                    stroke="#f1ece2"
                    strokeWidth={1.5}
                  />
                );
              })}
              {Array.from({ length: gridCols }).map((_, c) => {
                const pStart = pegPos(0, c);
                const pEnd = pegPos(gridRows - 1, c);
                return (
                  <line
                    key={`v-${c}`}
                    x1={pStart.x}
                    y1={pStart.y}
                    x2={pEnd.x}
                    y2={pEnd.y}
                    stroke="#f1ece2"
                    strokeWidth={1.5}
                  />
                );
              })}

              {/* Soft interior polygon fill once closed */}
              {closedFillPoints && (
                <polygon
                  points={closedFillPoints}
                  fill={activeColor}
                  fillOpacity={0.18}
                />
              )}

              {/* Drawn glowing strokes */}
              {edges.map((e, idx) => {
                const p1 = parsePointKey(e.from);
                const p2 = parsePointKey(e.to);
                if (!p1 || !p2) return null;
                const a = pegPos(p1.row, p1.col);
                const b = pegPos(p2.row, p2.col);
                return (
                  <line
                    key={`edge-${idx}`}
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    stroke={activeColor}
                    strokeWidth={6}
                    strokeLinecap="round"
                  />
                );
              })}

              {/* Pegboard dots (each >= 64x64 CSS px hit area) */}
              {Array.from({ length: gridRows }).map((_, r) =>
                Array.from({ length: gridCols }).map((__, c) => {
                  const key = pointKey(r, c);
                  const pos = pegPos(r, c);
                  const isActive = activePeg === key;
                  const isConnected = edges.some(
                    (e) => e.from === key || e.to === key
                  );
                  return (
                    <g
                      key={key}
                      data-testid={`draw-peg-${r}-${c}`}
                      className="manipulative-target cursor-pointer"
                      role="button"
                      tabIndex={disabled ? -1 : 0}
                      aria-pressed={isActive}
                      aria-label={`ចំណុចជួរ ${formatDisplayNumber(r + 1, numeralPref)} ជួរឈរ ${formatDisplayNumber(c + 1, numeralPref)}`}
                      onClick={() => handlePegTap(r, c)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handlePegTap(r, c);
                        }
                      }}
                    >
                      <rect
                        x={pos.x - 32}
                        y={pos.y - 32}
                        width={64}
                        height={64}
                        rx={16}
                        fill="transparent"
                      />
                      {isActive && (
                        <circle
                          cx={pos.x}
                          cy={pos.y}
                          r={18}
                          fill="none"
                          stroke={activeColor}
                          strokeWidth={3}
                          strokeDasharray="4 3"
                        />
                      )}
                      <circle
                        cx={pos.x}
                        cy={pos.y}
                        r={isActive ? 11 : isConnected ? 9.5 : 8}
                        fill={
                          isActive || isConnected ? activeColor : "#cbd5e1"
                        }
                        stroke="#ffffff"
                        strokeWidth={2.5}
                      />
                    </g>
                  );
                })
              )}
            </>
          ) : (
            /* Symmetry Mirror & Area Grid Painter */
            <>
              {Array.from({ length: gridRows }).map((_, r) =>
                Array.from({ length: gridCols }).map((__, c) => {
                  const key = pointKey(r, c);
                  const x = 8 + c * cellW;
                  const y = 8 + r * cellH;
                  const isLeftLocked =
                    mode === "symmetry-mirror" && c < halfCols;
                  const isTemplateFilled = templateSet.has(key);
                  const isUserPainted = paintedCells.includes(key);

                  if (isLeftLocked) {
                    return (
                      <rect
                        key={key}
                        x={x + 3}
                        y={y + 3}
                        width={cellW - 6}
                        height={cellH - 6}
                        rx={10}
                        fill={isTemplateFilled ? "#f59e0b" : "#f8f4ec"}
                        stroke={isTemplateFilled ? "#b45309" : "#e5dfd3"}
                        strokeWidth={2}
                      />
                    );
                  }

                  return (
                    <g
                      key={key}
                      data-testid={`draw-cell-${r}-${c}`}
                      className="manipulative-target cursor-pointer"
                      role="button"
                      tabIndex={disabled ? -1 : 0}
                      aria-pressed={isUserPainted}
                      aria-label={`ប្រឡោះជួរ ${formatDisplayNumber(r + 1, numeralPref)} ជួរឈរ ${formatDisplayNumber(c + 1, numeralPref)}`}
                      onPointerDown={() => {
                        setIsPointerPainting(true);
                        toggleGridCell(key, false);
                      }}
                      onPointerEnter={() => {
                        if (isPointerPainting) {
                          toggleGridCell(key, true);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          toggleGridCell(key, false);
                        }
                      }}
                    >
                      <rect
                        x={x + 3}
                        y={y + 3}
                        width={Math.max(56, cellW - 6)}
                        height={Math.max(56, cellH - 6)}
                        rx={10}
                        fill={isUserPainted ? activeColor : "#ffffff"}
                        stroke={isUserPainted ? "#1e3a8a" : "#cbd5e1"}
                        strokeWidth={2}
                      />
                    </g>
                  );
                })
              )}

              {/* Glowing vertical mirror symmetry axis */}
              {mode === "symmetry-mirror" && (
                <line
                  x1={svgSize / 2}
                  y1={4}
                  x2={svgSize / 2}
                  y2={svgSize - 4}
                  stroke="#dc2626"
                  strokeWidth={3.5}
                  strokeDasharray="7 5"
                  pointerEvents="none"
                />
              )}
            </>
          )}
        </svg>
      </div>

      {/* Undo / Clear controls */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {mode === "dot-connect" && (
          <button
            type="button"
            data-testid="draw-undo-btn"
            disabled={disabled || edges.length === 0}
            onClick={handleUndoEdge}
            className="khmer-chip rounded-xl border border-border bg-surface px-4 text-xs font-bold text-ink disabled:opacity-40"
          >
            ត្រឡប់ក្រោយ
          </button>
        )}
        <button
          type="button"
          data-testid="draw-clear-btn"
          disabled={disabled || (edges.length === 0 && paintedCells.length === 0)}
          onClick={handleClear}
          className="khmer-chip rounded-xl border border-border bg-surface-subtle px-4 text-xs font-semibold text-ink-muted hover:text-ink disabled:opacity-40"
        >
          លុបគូរថ្មី
        </button>
      </div>
    </div>
  );
}
