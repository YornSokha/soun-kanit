"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CountingStageStep } from "@/lib/curriculum/schema";
import type { StepAnswer } from "@/lib/math/grader";
import {
  formatDisplayNumber,
  type NumeralPreference,
} from "@/lib/khmer/numerals";

interface TokenItem {
  id: string;
  location: "frame" | "outside";
  slotIndex: number;
}

interface CountingStageProps {
  step: CountingStageStep;
  numeralPref: NumeralPreference;
  highlightTargetId?: string;
  disabled?: boolean;
  onAnswerChange: (answer: Extract<StepAnswer, { type: "counting-stage" }>) => void;
}

function buildInitialTokens(step: CountingStageStep): TokenItem[] {
  const items: TokenItem[] = [];
  for (let i = 0; i < step.config.initialInFrame; i++) {
    items.push({ id: `tok-in-${i}`, location: "frame", slotIndex: i });
  }
  for (let i = 0; i < step.config.initialOutside; i++) {
    items.push({ id: `tok-out-${i}`, location: "outside", slotIndex: i });
  }
  return items;
}

function renderTokenGlyph(
  theme: CountingStageStep["config"]["tokenTheme"],
  cx: number,
  cy: number,
  selected: boolean
) {
  const ring = selected ? (
    <circle
      cx={cx}
      cy={cy}
      r={26}
      fill="none"
      stroke="#2563eb"
      strokeWidth={3}
      strokeDasharray="5 3"
    />
  ) : null;

  switch (theme) {
    case "mango":
      return (
        <g pointerEvents="none">
          {ring}
          <ellipse
            cx={cx}
            cy={cy + 2}
            rx={17}
            ry={14}
            transform={`rotate(-18 ${cx} ${cy + 2})`}
            fill="#f59e0b"
            stroke="#b45309"
            strokeWidth={2}
          />
          <ellipse
            cx={cx - 5}
            cy={cy - 2}
            rx={5}
            ry={3}
            transform={`rotate(-25 ${cx - 5} ${cy - 2})`}
            fill="#fef3c7"
            opacity={0.75}
          />
          <path
            d={`M ${cx + 6} ${cy - 12} Q ${cx + 15} ${cy - 19} ${cx + 17} ${cy - 11} Q ${cx + 11} ${cy - 8} ${cx + 6} ${cy - 12} Z`}
            fill="#15803d"
          />
        </g>
      );
    case "orange":
      return (
        <g pointerEvents="none">
          {ring}
          <circle
            cx={cx}
            cy={cy + 2}
            r={16}
            fill="#fb923c"
            stroke="#c2410c"
            strokeWidth={2}
          />
          <circle cx={cx - 5} cy={cy - 3} r={3.5} fill="#ffedd5" opacity={0.7} />
          <path
            d={`M ${cx} ${cy - 14} Q ${cx + 9} ${cy - 20} ${cx + 12} ${cy - 12} Q ${cx + 5} ${cy - 10} ${cx} ${cy - 14} Z`}
            fill="#15803d"
          />
        </g>
      );
    case "lotus":
      return (
        <g pointerEvents="none">
          {ring}
          <ellipse cx={cx - 9} cy={cy + 3} rx={7} ry={12} transform={`rotate(-22 ${cx - 9} ${cy + 3})`} fill="#f472b6" stroke="#be185d" strokeWidth={1.6} />
          <ellipse cx={cx + 9} cy={cy + 3} rx={7} ry={12} transform={`rotate(22 ${cx + 9} ${cy + 3})`} fill="#f472b6" stroke="#be185d" strokeWidth={1.6} />
          <ellipse cx={cx} cy={cy} rx={8} ry={14} fill="#fbcfe8" stroke="#be185d" strokeWidth={1.8} />
          <circle cx={cx} cy={cy + 4} r={4} fill="#facc15" />
        </g>
      );
    case "cube":
      return (
        <g pointerEvents="none">
          {ring}
          <rect
            x={cx - 15}
            y={cy - 15}
            width={30}
            height={30}
            rx={6}
            fill="#3b82f6"
            stroke="#1d4ed8"
            strokeWidth={2}
          />
          <rect
            x={cx - 10}
            y={cy - 10}
            width={10}
            height={10}
            rx={2}
            fill="#93c5fd"
            opacity={0.75}
          />
        </g>
      );
    case "dot":
    default:
      return (
        <g pointerEvents="none">
          {ring}
          <circle
            cx={cx}
            cy={cy}
            r={16}
            fill="#2563eb"
            stroke="#1e40af"
            strokeWidth={2}
          />
          <circle cx={cx - 5} cy={cy - 5} r={4} fill="#bfdbfe" opacity={0.8} />
        </g>
      );
  }
}

export function CountingStage({
  step,
  numeralPref,
  highlightTargetId,
  disabled = false,
  onAnswerChange,
}: CountingStageProps) {
  const [tokens, setTokens] = useState<TokenItem[]>(() =>
    buildInitialTokens(step)
  );
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);
  const [dragging, setDragging] = useState<{
    id: string;
    startX: number;
    startY: number;
    x: number;
    y: number;
    moved: boolean;
  } | null>(null);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const onAnswerChangeRef = useRef(onAnswerChange);
  useEffect(() => {
    onAnswerChangeRef.current = onAnswerChange;
  }, [onAnswerChange]);

  const inFrameCount = useMemo(
    () => tokens.filter((t) => t.location === "frame").length,
    [tokens]
  );
  const outsideCount = useMemo(
    () => tokens.filter((t) => t.location === "outside").length,
    [tokens]
  );

  useEffect(() => {
    onAnswerChangeRef.current({
      type: "counting-stage",
      inFrame: inFrameCount,
      outside: outsideCount,
      total: tokens.length,
    });
  }, [inFrameCount, outsideCount, tokens.length]);

  const frameCols = 5;
  const frameRows = step.config.frameSize / 5;
  const cellSize = 60;
  const cellGap = 4;
  const svgWidth = 320;
  const frameStartX = 2;
  const frameStartY = 30;
  const frameHeight = frameRows * cellSize + (frameRows - 1) * cellGap;

  const outsideStartY = frameStartY + frameHeight + 36;
  const maxOutsideSlots = Math.max(
    5,
    step.config.initialOutside,
    outsideCount + (outsideCount < tokens.length ? 1 : 0)
  );
  const outsideRows = Math.max(1, Math.ceil(maxOutsideSlots / 5));
  const outsideHeight = outsideRows * cellSize + (outsideRows - 1) * cellGap + 12;
  const svgHeight = outsideStartY + outsideHeight + 12;

  const getFrameSlotPos = useCallback(
    (slotIndex: number) => {
      const col = slotIndex % frameCols;
      const row = Math.floor(slotIndex / frameCols);
      const x = frameStartX + col * (cellSize + cellGap);
      const y = frameStartY + row * (cellSize + cellGap);
      return { x, y, cx: x + cellSize / 2, cy: y + cellSize / 2 };
    },
    [frameStartX, frameStartY]
  );

  const getOutsideSlotPos = useCallback(
    (slotIndex: number) => {
      const col = slotIndex % 5;
      const row = Math.floor(slotIndex / 5);
      const x = frameStartX + col * (cellSize + cellGap);
      const y = outsideStartY + 6 + row * (cellSize + cellGap);
      return { x, y, cx: x + cellSize / 2, cy: y + cellSize / 2 };
    },
    [frameStartX, outsideStartY]
  );

  const occupiedFrameSlots = useMemo(() => {
    const map = new Map<number, TokenItem>();
    for (const tok of tokens) {
      if (tok.location === "frame") {
        map.set(tok.slotIndex, tok);
      }
    }
    return map;
  }, [tokens]);

  const outsideTokens = useMemo(
    () =>
      tokens
        .filter((t) => t.location === "outside")
        .sort((a, b) => a.slotIndex - b.slotIndex),
    [tokens]
  );

  const moveTokenToFrameSlot = useCallback(
    (tokenId: string, targetSlot?: number) => {
      if (disabled) return;
      setTokens((prev) => {
        const used = new Set(
          prev
            .filter((t) => t.location === "frame" && t.id !== tokenId)
            .map((t) => t.slotIndex)
        );
        let slot = targetSlot;
        if (slot === undefined || used.has(slot) || slot >= step.config.frameSize) {
          slot = undefined;
          for (let i = 0; i < step.config.frameSize; i++) {
            if (!used.has(i)) {
              slot = i;
              break;
            }
          }
        }
        if (slot === undefined) return prev;
        return prev.map((t) =>
          t.id === tokenId ? { ...t, location: "frame", slotIndex: slot! } : t
        );
      });
      setSelectedTokenId(null);
    },
    [disabled, step.config.frameSize]
  );

  const moveTokenToOutside = useCallback(
    (tokenId: string) => {
      if (disabled) return;
      setTokens((prev) => {
        const usedOutside = new Set(
          prev
            .filter((t) => t.location === "outside" && t.id !== tokenId)
            .map((t) => t.slotIndex)
        );
        let slot = 0;
        while (usedOutside.has(slot)) slot++;
        return prev.map((t) =>
          t.id === tokenId ? { ...t, location: "outside", slotIndex: slot } : t
        );
      });
      setSelectedTokenId(null);
    },
    [disabled]
  );

  const toSvgCoords = (clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    const scaleX = svgWidth / Math.max(1, rect.width);
    const scaleY = svgHeight / Math.max(1, rect.height);
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const handleTokenPointerDown = (
    e: React.PointerEvent<SVGGElement>,
    token: TokenItem
  ) => {
    if (disabled) return;
    e.stopPropagation();
    const pos = toSvgCoords(e.clientX, e.clientY);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignore synthetic events in tests without active pointerId
    }
    setDragging({
      id: token.id,
      startX: pos.x,
      startY: pos.y,
      x: pos.x,
      y: pos.y,
      moved: false,
    });
  };

  const handleTokenPointerMove = (e: React.PointerEvent<SVGGElement>) => {
    if (!dragging || disabled) return;
    const pos = toSvgCoords(e.clientX, e.clientY);
    const dist = Math.hypot(pos.x - dragging.startX, pos.y - dragging.startY);
    setDragging((prev) =>
      prev
        ? { ...prev, x: pos.x, y: pos.y, moved: prev.moved || dist > 8 }
        : null
    );
  };

  const handleTokenPointerUp = (
    e: React.PointerEvent<SVGGElement>,
    token: TokenItem
  ) => {
    if (disabled) return;
    e.stopPropagation();
    const activeDrag = dragging;
    setDragging(null);

    if (activeDrag && activeDrag.moved) {
      // Dropped via drag
      const inFrameZone =
        activeDrag.y >= frameStartY - 12 &&
        activeDrag.y <= frameStartY + frameHeight + 12;
      if (inFrameZone) {
        const col = Math.max(
          0,
          Math.min(
            frameCols - 1,
            Math.floor((activeDrag.x - frameStartX) / (cellSize + cellGap))
          )
        );
        const row = Math.max(
          0,
          Math.min(
            frameRows - 1,
            Math.floor((activeDrag.y - frameStartY) / (cellSize + cellGap))
          )
        );
        moveTokenToFrameSlot(token.id, row * frameCols + col);
      } else if (activeDrag.y >= outsideStartY - 16) {
        moveTokenToOutside(token.id);
      }
      return;
    }

    // Single-pointer tap-to-select behavior (WCAG 2.2 SC 2.5.7)
    if (selectedTokenId === token.id) {
      setSelectedTokenId(null);
    } else {
      setSelectedTokenId(token.id);
    }
  };

  const handleEmptySlotTap = (slotIndex: number) => {
    if (disabled) return;
    if (selectedTokenId) {
      moveTokenToFrameSlot(selectedTokenId, slotIndex);
    } else if (outsideTokens.length > 0) {
      // Convenient single-tap fallback: tapping an empty slot brings the next outside token in
      moveTokenToFrameSlot(outsideTokens[0].id, slotIndex);
    }
  };

  const handleOutsideTrayTap = () => {
    if (disabled) return;
    if (selectedTokenId) {
      const tok = tokens.find((t) => t.id === selectedTokenId);
      if (tok?.location === "frame") {
        moveTokenToOutside(selectedTokenId);
      }
    }
  };

  const highlightEmptySlots = highlightTargetId === "empty-slots";

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      {/* Live count summary badges */}
      {step.config.showLiveCount && (
        <div
          className="flex flex-wrap items-center justify-center gap-2 text-sm font-semibold"
          aria-live="polite"
        >
          <span
            data-testid="counting-in-frame-badge"
            className="rounded-full border border-border bg-surface px-3.5 py-1 text-ink shadow-xs"
          >
            ក្នុងប្រអប់៖{" "}
            <strong className="text-accent">
              {formatDisplayNumber(inFrameCount, numeralPref)}
            </strong>{" "}
            / {formatDisplayNumber(step.config.frameSize, numeralPref)}
          </span>
          {outsideCount > 0 && (
            <span
              data-testid="counting-outside-badge"
              className="rounded-full border border-border bg-surface-subtle px-3.5 py-1 text-ink-muted"
            >
              ខាងក្រៅ៖{" "}
              <strong className="text-ink">
                {formatDisplayNumber(outsideCount, numeralPref)}
              </strong>
            </span>
          )}
        </div>
      )}

      {/* Tap-to-place helper instruction */}
      <p className="text-xs text-ink-muted text-center">
        {selectedTokenId
          ? "ឥឡូវប៉ះប្រឡោះទំនេរ ឬថាសខាងក្រៅដើម្បីដាក់!"
          : "ប៉ះវត្ថុ រួចប៉ះប្រឡោះទំនេរ ឬអូសដាក់ផ្ទាល់ក៏បាន"}
      </p>

      {/* Inline Safari-safe SVG (zero foreignObject, >=56x56px targets at 360px) */}
      <div className="w-full max-w-[380px] flex justify-center">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full min-w-[320px] h-auto select-none overflow-visible"
          role="group"
          aria-label="ក្ដាររាប់វត្ថុ"
        >
          {/* Frame title */}
          <text
            x={8}
            y={19}
            fontSize={13}
            fontWeight={600}
            fill="#4b5563"
          >
            ថាសប្រអប់ {formatDisplayNumber(step.config.frameSize, numeralPref)}
          </text>

          {/* Frame outer background */}
          <rect
            x={0}
            y={frameStartY - 4}
            width={svgWidth}
            height={frameHeight + 8}
            rx={14}
            fill="#fffdf8"
            stroke={inFrameCount === 10 && step.config.requireFullTenBundle ? "#15803d" : "#d6cfc2"}
            strokeWidth={inFrameCount === 10 && step.config.requireFullTenBundle ? 2.5 : 1.5}
          />

          {/* Frame slots */}
          {Array.from({ length: step.config.frameSize }).map((_, slotIndex) => {
            const pos = getFrameSlotPos(slotIndex);
            const occupant = occupiedFrameSlots.get(slotIndex);
            const isEmpty = !occupant;
            const isHighlighted = isEmpty && (highlightEmptySlots || Boolean(selectedTokenId));

            if (isEmpty) {
              return (
                <g
                  key={`slot-${slotIndex}`}
                  data-testid={`frame-slot-${slotIndex}`}
                  className="manipulative-target cursor-pointer"
                  role="button"
                  tabIndex={disabled ? -1 : 0}
                  aria-label={`ប្រឡោះទំនេរទី ${formatDisplayNumber(slotIndex + 1, numeralPref)}`}
                  onClick={() => handleEmptySlotTap(slotIndex)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleEmptySlotTap(slotIndex);
                    }
                  }}
                >
                  <rect
                    x={pos.x}
                    y={pos.y}
                    width={cellSize}
                    height={cellSize}
                    rx={10}
                    fill={isHighlighted ? "#fef3c7" : "#f5f1e8"}
                    stroke={isHighlighted ? "#d97706" : "#d6cfc2"}
                    strokeWidth={isHighlighted ? 2.2 : 1.5}
                    strokeDasharray={isHighlighted ? "5 3" : undefined}
                  />
                </g>
              );
            }

            return (
              <rect
                key={`slot-bg-${slotIndex}`}
                x={pos.x}
                y={pos.y}
                width={cellSize}
                height={cellSize}
                rx={10}
                fill="#ffffff"
                stroke="#e5dfd3"
                strokeWidth={1.5}
              />
            );
          })}

          {/* Outside tray label */}
          <text
            x={8}
            y={outsideStartY - 10}
            fontSize={13}
            fontWeight={600}
            fill="#4b5563"
          >
            ខាងក្រៅប្រអប់
          </text>

          {/* Outside tray drop target */}
          <g
            data-testid="outside-tray-drop"
            className="manipulative-target cursor-pointer"
            role="button"
            tabIndex={disabled ? -1 : 0}
            aria-label="ដាក់វត្ថុមកខាងក្រៅប្រអប់"
            onClick={handleOutsideTrayTap}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleOutsideTrayTap();
              }
            }}
          >
            <rect
              x={0}
              y={outsideStartY}
              width={svgWidth}
              height={Math.max(68, outsideHeight)}
              rx={14}
              fill={
                selectedTokenId &&
                tokens.find((t) => t.id === selectedTokenId)?.location === "frame"
                  ? "#eff6ff"
                  : "#f8f4ec"
              }
              stroke={
                selectedTokenId &&
                tokens.find((t) => t.id === selectedTokenId)?.location === "frame"
                  ? "#2563eb"
                  : "#d6cfc2"
              }
              strokeWidth={1.5}
              strokeDasharray="6 4"
            />
          </g>

          {/* Tokens inside frame */}
          {tokens
            .filter((t) => t.location === "frame")
            .map((tok, idx) => {
              const slotPos = getFrameSlotPos(tok.slotIndex);
              const isDraggingThis = dragging?.id === tok.id && dragging.moved;
              const cx = isDraggingThis ? dragging.x : slotPos.cx;
              const cy = isDraggingThis ? dragging.y : slotPos.cy;
              const isSelected = selectedTokenId === tok.id;

              return (
                <g
                  key={tok.id}
                  data-testid={`frame-token-${idx}`}
                  className="manipulative-target cursor-grab active:cursor-grabbing"
                  role="button"
                  tabIndex={disabled ? -1 : 0}
                  aria-pressed={isSelected}
                  aria-label={`វត្ថុក្នុងប្រអប់ទី ${formatDisplayNumber(idx + 1, numeralPref)}`}
                  onPointerDown={(e) => handleTokenPointerDown(e, tok)}
                  onPointerMove={handleTokenPointerMove}
                  onPointerUp={(e) => handleTokenPointerUp(e, tok)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedTokenId((prev) =>
                        prev === tok.id ? null : tok.id
                      );
                    }
                  }}
                >
                  {/* Transparent 60x60 hit target */}
                  <rect
                    x={cx - cellSize / 2}
                    y={cy - cellSize / 2}
                    width={cellSize}
                    height={cellSize}
                    rx={10}
                    fill="transparent"
                  />
                  {renderTokenGlyph(step.config.tokenTheme, cx, cy, isSelected)}
                </g>
              );
            })}

          {/* Tokens outside frame */}
          {outsideTokens.map((tok, idx) => {
            const slotPos = getOutsideSlotPos(idx);
            const isDraggingThis = dragging?.id === tok.id && dragging.moved;
            const cx = isDraggingThis ? dragging.x : slotPos.cx;
            const cy = isDraggingThis ? dragging.y : slotPos.cy;
            const isSelected = selectedTokenId === tok.id;

            return (
              <g
                key={tok.id}
                data-testid={`outside-token-${idx}`}
                className="manipulative-target cursor-grab active:cursor-grabbing"
                role="button"
                tabIndex={disabled ? -1 : 0}
                aria-pressed={isSelected}
                aria-label={`វត្ថុខាងក្រៅទី ${formatDisplayNumber(idx + 1, numeralPref)}`}
                onPointerDown={(e) => handleTokenPointerDown(e, tok)}
                onPointerMove={handleTokenPointerMove}
                onPointerUp={(e) => handleTokenPointerUp(e, tok)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedTokenId((prev) =>
                      prev === tok.id ? null : tok.id
                    );
                  }
                }}
              >
                {/* Transparent 60x60 hit target */}
                <rect
                  x={cx - cellSize / 2}
                  y={cy - cellSize / 2}
                  width={cellSize}
                  height={cellSize}
                  rx={10}
                  fill="transparent"
                />
                {renderTokenGlyph(step.config.tokenTheme, cx, cy, isSelected)}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
