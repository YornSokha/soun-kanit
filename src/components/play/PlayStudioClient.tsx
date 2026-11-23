"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useLearner } from "@/components/providers/LearnerProvider";
import { NumeralToggle } from "@/components/ui/NumeralToggle";
import { AudioToggle } from "@/components/ui/AudioReadButton";
import { MascotFrog } from "@/components/ui/MascotFrog";
import { CelebrationBurst } from "@/components/ui/CelebrationBurst";
import { detectKramaPattern } from "@/lib/math/kramaPattern";
import {
  playGentleNudgeChime,
  playPatternMelody,
  playScaleNote,
  playSuccessChime,
} from "@/lib/audio/chimes";
import {
  formatDisplayNumber,
  formatTextNumerals,
} from "@/lib/khmer/numerals";

interface MarketOrder {
  id: string;
  customerKm: string;
  itemType: "mango" | "orange" | "lotus";
  itemNameKm: string;
  unitPriceKhr: number;
  quantity: number;
  totalKhr: number;
}

const MARKET_ORDERS: MarketOrder[] = [
  {
    id: "ord-1",
    customerKm: "លោកយាយសំ",
    itemType: "mango",
    itemNameKm: "ស្វាយទុំ",
    unitPriceKhr: 500,
    quantity: 2,
    totalKhr: 1000,
  },
  {
    id: "ord-2",
    customerKm: "បងស្រីម៉ាលី",
    itemType: "orange",
    itemNameKm: "ក្រូចពោធិ៍សាត់",
    unitPriceKhr: 500,
    quantity: 3,
    totalKhr: 1500,
  },
  {
    id: "ord-3",
    customerKm: "មិត្តដារ៉ា",
    itemType: "lotus",
    itemNameKm: "ផ្កាឈូក",
    unitPriceKhr: 1000,
    quantity: 2,
    totalKhr: 2000,
  },
  {
    id: "ord-4",
    customerKm: "ពូសុខា",
    itemType: "mango",
    itemNameKm: "ស្វាយទុំ",
    unitPriceKhr: 500,
    quantity: 4,
    totalKhr: 2000,
  },
  {
    id: "ord-5",
    customerKm: "អ្នកមីងរតនា",
    itemType: "orange",
    itemNameKm: "ក្រូចពោធិ៍សាត់",
    unitPriceKhr: 500,
    quantity: 5,
    totalKhr: 2500,
  },
];

const KRAMA_COLORS = [
  { id: "red", labelKm: "ក្រហម", fill: "#b91c1c", stripe: "#fca5a5", idx: 0 },
  { id: "blue", labelKm: "ខៀវ", fill: "#1d4ed8", stripe: "#93c5fd", idx: 1 },
  { id: "gold", labelKm: "លឿង", fill: "#d97706", stripe: "#fde68a", idx: 2 },
  { id: "green", labelKm: "បៃតង", fill: "#15803d", stripe: "#86efac", idx: 3 },
] as const;

const BANKNOTES = [100, 500, 1000, 2000] as const;

export function PlayStudioClient() {
  const { numeralPref, audioEnabled } = useLearner();
  const [activeMode, setActiveMode] = useState<"market" | "krama">("market");

  // Market Stall state
  const [orderIdx, setOrderIdx] = useState<number>(0);
  const [packedCount, setPackedCount] = useState<number>(0);
  const [notesOnTray, setNotesOnTray] = useState<number[]>([]);
  const [marketStatus, setMarketStatus] = useState<{
    ok: boolean;
    messageKm: string;
  } | null>(null);
  const [customersServed, setCustomersServed] = useState<number>(0);

  // Krama Pattern Weaver state
  const [loomSlots, setLoomSlots] = useState<Array<string | null>>(() =>
    Array.from({ length: 8 }, () => null)
  );
  const [selectedColorId, setSelectedColorId] = useState<string>("red");
  const [kramaChecked, setKramaChecked] = useState<boolean>(false);

  const currentOrder = MARKET_ORDERS[orderIdx % MARKET_ORDERS.length];
  const traySumKhr = notesOnTray.reduce((s, n) => s + n, 0);

  const kramaAnalysis = useMemo(
    () => detectKramaPattern(loomSlots),
    [loomSlots]
  );

  // Market Stall handlers
  const handleAddFruit = () => {
    if (packedCount >= 8) return;
    const next = packedCount + 1;
    setPackedCount(next);
    setMarketStatus(null);
    playScaleNote(next - 1, audioEnabled);
  };

  const handleRemoveFruit = () => {
    if (packedCount <= 0) return;
    setPackedCount((c) => c - 1);
    setMarketStatus(null);
  };

  const handleAddNote = (note: number) => {
    setNotesOnTray((prev) => [...prev, note]);
    setMarketStatus(null);
    playScaleNote(Math.min(8, notesOnTray.length + 2), audioEnabled);
  };

  const handleServeOrder = () => {
    const countOk = packedCount === currentOrder.quantity;
    const moneyOk = traySumKhr === currentOrder.totalKhr;

    if (countOk && moneyOk) {
      playSuccessChime(audioEnabled);
      setCustomersServed((c) => c + 1);
      setMarketStatus({
        ok: true,
        messageKm: `«អរគុណច្រើនណាកូន!» ${currentOrder.customerKm} ពេញចិត្តណាស់ — គ្រប់ ${currentOrder.quantity} និង ${currentOrder.totalKhr.toLocaleString("en-US")}៛ ត្រឹមត្រូវ!`,
      });
      return;
    }

    playGentleNudgeChime(audioEnabled);
    if (!countOk) {
      setMarketStatus({
        ok: false,
        messageKm:
          packedCount < currentOrder.quantity
            ? `នៅខ្វះ${currentOrder.itemNameKm}បន្តិចទៀត! ភ្ញៀវកម្ម៉ង់ ${currentOrder.quantity} ណា៎។`
            : `លើស${currentOrder.itemNameKm}បន្តិចហើយ! ភ្ញៀវកម្ម៉ង់តែ ${currentOrder.quantity} ទេណា៎។`,
      });
    } else {
      setMarketStatus({
        ok: false,
        messageKm:
          traySumKhr < currentOrder.totalKhr
            ? `ផ្លែឈើគ្រប់ហើយ! ប៉ុន្តែប្រាក់លើថាសនៅខ្វះដល់ ${currentOrder.totalKhr.toLocaleString("en-US")}៛ ណា៎។`
            : `ផ្លែឈើគ្រប់ហើយ! ប៉ុន្តែប្រាក់លើថាសលើស ${currentOrder.totalKhr.toLocaleString("en-US")}៛ ហើយ សាកដកចេញខ្លះវិញណា៎។`,
      });
    }
  };

  const handleNextCustomer = () => {
    setOrderIdx((i) => (i + 1) % MARKET_ORDERS.length);
    setPackedCount(0);
    setNotesOnTray([]);
    setMarketStatus(null);
  };

  // Krama Weaver handlers
  const handleWeaveSlot = (slotIdx: number) => {
    const colorObj = KRAMA_COLORS.find((c) => c.id === selectedColorId);
    setLoomSlots((prev) =>
      prev.map((val, i) => (i === slotIdx ? selectedColorId : val))
    );
    setKramaChecked(false);
    if (colorObj) {
      playScaleNote(colorObj.idx + 3, audioEnabled);
    }
  };

  const handleWeaveNext = () => {
    const firstEmpty = loomSlots.findIndex((s) => s === null);
    if (firstEmpty === -1) return;
    handleWeaveSlot(firstEmpty);
  };

  const handleApplyPreset = (preset: "AB" | "ABC" | "AABB") => {
    const map =
      preset === "AB"
        ? ["red", "blue", "red", "blue", "red", "blue", "red", "blue"]
        : preset === "ABC"
          ? ["red", "blue", "gold", "red", "blue", "gold", "red", "blue"]
          : ["red", "red", "gold", "gold", "red", "red", "gold", "gold"];
    setLoomSlots(map);
    setKramaChecked(true);
    playPatternMelody(
      map.map((id) => KRAMA_COLORS.find((c) => c.id === id)?.idx ?? 0),
      audioEnabled
    );
  };

  const handlePlayMelody = () => {
    const indices = loomSlots
      .filter((s): s is string => Boolean(s))
      .map((id) => KRAMA_COLORS.find((c) => c.id === id)?.idx ?? 0);
    if (indices.length > 0) {
      playPatternMelody(indices, audioEnabled);
    }
  };

  const handleCheckKrama = () => {
    setKramaChecked(true);
    if (kramaAnalysis.isRepeating) {
      playSuccessChime(audioEnabled);
    } else {
      playGentleNudgeChime(audioEnabled);
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <header className="sticky top-0 z-20 border-b border-border bg-surface/95 backdrop-blur px-3 py-2.5">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-2">
          <Link
            href="/learn"
            className="khmer-chip inline-flex items-center rounded-xl border border-border bg-surface px-3 text-sm font-semibold text-ink hover:bg-surface-subtle"
          >
            ← ផ្លូវរៀន
          </Link>
          <div className="flex items-center gap-1.5">
            <AudioToggle />
            <NumeralToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-3 py-5 pb-12">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-xs font-bold text-accent">
              លេង និងស្វែងយល់ • គ្មានម៉ោងរាប់ថយក្រោយ
            </p>
            <h1 className="text-2xl font-bold text-ink">
              ក្ដារលេងគណិតសប្បាយៗ
            </h1>
          </div>
          <Link
            href="/garden"
            className="khmer-chip inline-flex items-center rounded-full border border-success bg-success-soft px-3.5 text-xs font-bold text-success"
          >
            ទៅសួនគណិត →
          </Link>
        </div>

        {/* Mode Switcher */}
        <nav aria-label="ជ្រើសរើសហ្គេមគណិត" className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            data-testid="play-tab-market"
            aria-pressed={activeMode === "market"}
            onClick={() => setActiveMode("market")}
            className={`khmer-chip rounded-2xl border-2 px-3 py-2.5 text-sm font-bold transition-colors ${
              activeMode === "market"
                ? "border-accent bg-accent text-white shadow-xs"
                : "border-border bg-surface text-ink hover:bg-surface-subtle"
            }`}
          >
            ហាងផ្លែឈើខ្មែរ
          </button>
          <button
            type="button"
            data-testid="play-tab-krama"
            aria-pressed={activeMode === "krama"}
            onClick={() => setActiveMode("krama")}
            className={`khmer-chip rounded-2xl border-2 px-3 py-2.5 text-sm font-bold transition-colors ${
              activeMode === "krama"
                ? "border-accent bg-accent text-white shadow-xs"
                : "border-border bg-surface text-ink hover:bg-surface-subtle"
            }`}
          >
            ត្បាញក្រមាគណិត
          </button>
        </nav>

        {activeMode === "market" ? (
          <section
            data-testid="market-stall-panel"
            className="rounded-3xl border border-border bg-surface p-4 sm:p-5 shadow-xs space-y-4"
          >
            {/* Customer Order Bubble */}
            <div className="flex items-start gap-3 rounded-2xl border border-border bg-canvas p-3.5">
              <MascotFrog
                mood={marketStatus?.ok ? "happy" : "curious"}
                size={48}
              />
              <div className="flex-1 space-y-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-bold text-accent">
                    ភ្ញៀវ៖ {currentOrder.customerKm}
                  </p>
                  <span
                    data-testid="market-served-count"
                    className="rounded-full bg-success-soft px-2.5 py-0.5 text-xs font-bold text-success"
                  >
                    បានលក់ជូន៖ {formatDisplayNumber(customersServed, numeralPref)} នាក់
                  </span>
                </div>
                <p
                  data-testid="market-order-prompt"
                  className="text-base font-bold text-ink"
                >
                  {formatTextNumerals(
                    `«សុំទិញ${currentOrder.itemNameKm} ${currentOrder.quantity} (មួយថ្លៃ ${currentOrder.unitPriceKhr.toLocaleString("en-US")}៛ — សរុប ${currentOrder.totalKhr.toLocaleString("en-US")}៛)»`,
                    numeralPref
                  )}
                </p>
              </div>
            </div>

            <CelebrationBurst active={Boolean(marketStatus?.ok)} />

            {/* Woven Fruit Tray SVG (Safari-safe, zero foreignObject) */}
            <div className="rounded-2xl border border-border bg-canvas p-3 space-y-3">
              <div className="flex items-center justify-between text-sm font-bold text-ink">
                <span>ថាសរៀប{currentOrder.itemNameKm}៖</span>
                <span data-testid="market-packed-count" className="text-accent">
                  {formatDisplayNumber(packedCount, numeralPref)} /{" "}
                  {formatDisplayNumber(currentOrder.quantity, numeralPref)}
                </span>
              </div>

              <svg
                viewBox="0 0 320 74"
                className="w-full max-w-[340px] mx-auto h-auto select-none"
                role="img"
                aria-label={`ថាសមាន${currentOrder.itemNameKm} ${formatDisplayNumber(packedCount, numeralPref)}`}
              >
                <rect
                  x={4}
                  y={6}
                  width={312}
                  height={62}
                  rx={16}
                  fill="#fffbeb"
                  stroke="#d97706"
                  strokeWidth={2}
                />
                {Array.from({ length: packedCount }).map((_, idx) => {
                  const cx = 32 + idx * 36;
                  const cy = 37;
                  if (currentOrder.itemType === "lotus") {
                    return (
                      <g key={idx}>
                        <ellipse cx={cx} cy={cy} rx={10} ry={13} fill="#f472b6" stroke="#be185d" strokeWidth={1.5} />
                        <circle cx={cx} cy={cy + 2} r={3.5} fill="#facc15" />
                      </g>
                    );
                  }
                  if (currentOrder.itemType === "orange") {
                    return (
                      <circle key={idx} cx={cx} cy={cy} r={13} fill="#fb923c" stroke="#c2410c" strokeWidth={1.8} />
                    );
                  }
                  return (
                    <ellipse
                      key={idx}
                      cx={cx}
                      cy={cy}
                      rx={13}
                      ry={10.5}
                      transform={`rotate(-18 ${cx} ${cy})`}
                      fill="#f59e0b"
                      stroke="#b45309"
                      strokeWidth={1.8}
                    />
                  );
                })}
              </svg>

              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  data-testid="market-fruit-dec"
                  disabled={packedCount <= 0 || Boolean(marketStatus?.ok)}
                  onClick={handleRemoveFruit}
                  className="manipulative-target rounded-xl border border-border bg-surface px-4 text-base font-bold text-ink disabled:opacity-40"
                >
                  −{formatDisplayNumber(1, numeralPref)}
                </button>
                <button
                  type="button"
                  data-testid="market-fruit-inc"
                  disabled={packedCount >= 8 || Boolean(marketStatus?.ok)}
                  onClick={handleAddFruit}
                  className="manipulative-target rounded-xl bg-amber-700 px-5 text-base font-bold text-white disabled:opacity-40"
                >
                  +{formatDisplayNumber(1, numeralPref)} {currentOrder.itemNameKm}
                </button>
              </div>
            </div>

            {/* Riel Banknote Cash Tray */}
            <div className="rounded-2xl border border-border bg-canvas p-3 space-y-2.5">
              <div className="flex items-center justify-between text-sm font-bold text-ink">
                <span>ប្រាក់រៀលលើថាស៖</span>
                <span data-testid="market-tray-sum" className="text-accent">
                  {formatDisplayNumber(
                    traySumKhr.toLocaleString("en-US"),
                    numeralPref
                  )}
                  ៛
                </span>
              </div>

              {notesOnTray.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {notesOnTray.map((note, idx) => (
                    <button
                      key={`${note}-${idx}`}
                      type="button"
                      disabled={Boolean(marketStatus?.ok)}
                      onClick={() =>
                        setNotesOnTray((prev) => prev.filter((_, i) => i !== idx))
                      }
                      className="khmer-chip rounded-xl border border-emerald-700 bg-emerald-50 px-2.5 text-xs font-bold text-emerald-900"
                    >
                      {formatDisplayNumber(
                        note.toLocaleString("en-US"),
                        numeralPref
                      )}
                      ៛ ✕
                    </button>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                {BANKNOTES.map((note) => (
                  <button
                    key={note}
                    type="button"
                    data-testid={`market-note-${note}`}
                    disabled={Boolean(marketStatus?.ok)}
                    onClick={() => handleAddNote(note)}
                    className="manipulative-target rounded-xl border-2 border-border bg-surface px-3 text-sm font-bold text-ink hover:border-accent hover:bg-accent-soft disabled:opacity-45"
                  >
                    +
                    {formatDisplayNumber(
                      note.toLocaleString("en-US"),
                      numeralPref
                    )}
                    ៛
                  </button>
                ))}
              </div>
            </div>

            {marketStatus && (
              <div
                data-testid="market-feedback"
                role="status"
                aria-live="polite"
                className={`rounded-2xl border-2 p-3.5 text-sm font-bold ${
                  marketStatus.ok
                    ? "border-success bg-success-soft text-ink"
                    : "border-hint bg-hint-soft text-ink"
                }`}
              >
                {formatTextNumerals(marketStatus.messageKm, numeralPref)}
              </div>
            )}

            <div className="flex gap-2.5">
              {!marketStatus?.ok ? (
                <button
                  type="button"
                  data-testid="market-serve-btn"
                  onClick={handleServeOrder}
                  className="khmer-chip flex-1 rounded-2xl bg-accent px-5 py-3 text-base font-bold text-white shadow-xs hover:bg-accent-hover"
                >
                  ប្រគល់ជូនភ្ញៀវ
                </button>
              ) : (
                <button
                  type="button"
                  data-testid="market-next-btn"
                  onClick={handleNextCustomer}
                  className="khmer-chip flex-1 rounded-2xl bg-success px-5 py-3 text-base font-bold text-white shadow-xs"
                >
                  ទទួលភ្ញៀវបន្ទាប់ →
                </button>
              )}
            </div>
          </section>
        ) : (
          /* Krama Pattern Weaver */
          <section
            data-testid="krama-weaver-panel"
            className="rounded-3xl border border-border bg-surface p-4 sm:p-5 shadow-xs space-y-4"
          >
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-ink">
                ត្បាញក្រមាគណិតដោយខ្លួនឯង!
              </h2>
              <p className="text-xs text-ink-muted">
                ជ្រើសរើសពណ៌សូត្រ រួចប៉ះប្រឡោះទាំង ៨ ដើម្បីបង្កើតលំនាំ AB, ABC ឬ AABB រួចស្ដាប់ភ្លេងក្រមា!
              </p>
            </div>

            <CelebrationBurst
              active={kramaChecked && kramaAnalysis.isRepeating}
            />

            {/* 8-slot Krama Loom (>= 56x56px each) */}
            <div className="rounded-2xl border border-border bg-canvas p-3 grid grid-cols-4 gap-2">
              {loomSlots.map((colorId, idx) => {
                const cObj = KRAMA_COLORS.find((c) => c.id === colorId);
                return (
                  <button
                    key={idx}
                    type="button"
                    data-testid={`krama-slot-${idx}`}
                    onClick={() => handleWeaveSlot(idx)}
                    className="manipulative-target flex h-16 w-full items-center justify-center rounded-xl border-2 border-border bg-surface p-1 shadow-xs hover:border-accent"
                  >
                    <span className="sr-only">
                      {cObj
                        ? `ប្រឡោះទី ${idx + 1} ពណ៌ ${cObj.labelKm}`
                        : `ប្រឡោះទំនេរទី ${idx + 1}`}
                    </span>
                    {cObj ? (
                      <svg
                        viewBox="0 0 44 44"
                        className="h-12 w-12"
                        aria-hidden="true"
                      >
                        <rect
                          x={2}
                          y={2}
                          width={40}
                          height={40}
                          rx={8}
                          fill={cObj.fill}
                        />
                        <line x1={2} y1={14} x2={42} y2={14} stroke={cObj.stripe} strokeWidth={3} />
                        <line x1={2} y1={30} x2={42} y2={30} stroke={cObj.stripe} strokeWidth={3} />
                        <line x1={14} y1={2} x2={14} y2={42} stroke={cObj.stripe} strokeWidth={2.5} />
                        <line x1={30} y1={2} x2={30} y2={42} stroke={cObj.stripe} strokeWidth={2.5} />
                      </svg>
                    ) : (
                      <span className="text-base font-bold text-ink-muted" aria-hidden="true">
                        {formatDisplayNumber(idx + 1, numeralPref)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Thread color palette (>= 56x56px) */}
            <div className="grid grid-cols-4 gap-2">
              {KRAMA_COLORS.map((c) => {
                const active = selectedColorId === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    data-testid={`krama-color-${c.id}`}
                    aria-pressed={active}
                    onClick={() => {
                      setSelectedColorId(c.id);
                      playScaleNote(c.idx + 3, audioEnabled);
                    }}
                    className={`manipulative-target flex flex-col items-center justify-center gap-1 rounded-2xl border-2 p-2 text-xs font-bold ${
                      active
                        ? "border-accent bg-accent-soft text-ink ring-2 ring-accent/30"
                        : "border-border bg-surface text-ink"
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className="h-6 w-6 rounded-full"
                      style={{ backgroundColor: c.fill }}
                    />
                    <span>{c.labelKm}</span>
                  </button>
                );
              })}
            </div>

            {/* Quick actions & starter presets */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                data-testid="krama-weave-next-btn"
                onClick={handleWeaveNext}
                className="khmer-chip rounded-xl border border-accent bg-accent-soft px-3.5 text-xs font-bold text-accent"
              >
                + ដាក់ប្រឡោះបន្ទាប់
              </button>
              <button
                type="button"
                data-testid="krama-preset-ab"
                onClick={() => handleApplyPreset("AB")}
                className="khmer-chip rounded-xl border border-border bg-surface px-3 text-xs font-semibold text-ink"
              >
                គំរូ AB
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset("ABC")}
                className="khmer-chip rounded-xl border border-border bg-surface px-3 text-xs font-semibold text-ink"
              >
                គំរូ ABC
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoomSlots(Array.from({ length: 8 }, () => null));
                  setKramaChecked(false);
                }}
                className="khmer-chip rounded-xl border border-border bg-surface-subtle px-3 text-xs font-semibold text-ink-muted"
              >
                សម្អាត
              </button>
            </div>

            {kramaChecked && (
              <div
                data-testid="krama-result-panel"
                role="status"
                aria-live="polite"
                className={`rounded-2xl border-2 p-3.5 text-sm font-bold ${
                  kramaAnalysis.isRepeating
                    ? "border-success bg-success-soft text-ink"
                    : "border-hint bg-hint-soft text-ink"
                }`}
              >
                {formatTextNumerals(kramaAnalysis.messageKm, numeralPref)}
              </div>
            )}

            <div className="flex flex-wrap gap-2.5">
              <button
                type="button"
                data-testid="krama-check-btn"
                onClick={handleCheckKrama}
                className="khmer-chip flex-1 rounded-2xl bg-accent px-4 py-3 text-sm font-bold text-white shadow-xs hover:bg-accent-hover"
              >
                ពិនិត្យលំនាំក្រមា
              </button>
              <button
                type="button"
                data-testid="krama-play-melody-btn"
                onClick={handlePlayMelody}
                className="khmer-chip rounded-2xl border-2 border-success bg-success-soft px-4 py-3 text-sm font-bold text-success"
              >
                ស្ដាប់ភ្លេងក្រមា
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
