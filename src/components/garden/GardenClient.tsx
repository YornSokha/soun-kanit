"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useLearner } from "@/components/providers/LearnerProvider";
import { NumeralToggle } from "@/components/ui/NumeralToggle";
import { AudioToggle } from "@/components/ui/AudioReadButton";
import { CelebrationBurst } from "@/components/ui/CelebrationBurst";
import { AchievementCertificate } from "@/components/ui/AchievementCertificate";
import { computeGardenState } from "@/lib/math/garden";
import {
  playScaleNote,
  playSuccessChime,
  playWaterPlop,
} from "@/lib/audio/chimes";
import {
  formatDisplayNumber,
  formatTextNumerals,
} from "@/lib/khmer/numerals";

const MANGO_SPOTS = [
  { x: 90, y: 88 },
  { x: 122, y: 74 },
  { x: 148, y: 92 },
  { x: 76, y: 112 },
  { x: 112, y: 108 },
  { x: 138, y: 118 },
  { x: 102, y: 66 },
  { x: 162, y: 108 },
  { x: 64, y: 92 },
  { x: 128, y: 96 },
  { x: 86, y: 128 },
  { x: 152, y: 78 },
];

const LOTUS_SPOTS = [
  { x: 74, y: 218 },
  { x: 128, y: 232 },
  { x: 186, y: 214 },
  { x: 242, y: 228 },
  { x: 294, y: 216 },
  { x: 102, y: 248 },
  { x: 214, y: 246 },
  { x: 274, y: 244 },
];

const BUTTERFLY_SPOTS = [
  { x: 232, y: 78, color: "#f472b6" },
  { x: 282, y: 96, color: "#f59e0b" },
  { x: 205, y: 114, color: "#60a5fa" },
  { x: 310, y: 68, color: "#a78bfa" },
  { x: 256, y: 54, color: "#34d399" },
  { x: 185, y: 70, color: "#fb7185" },
];

export function GardenClient() {
  const { profile, progressByLesson, numeralPref, audioEnabled } = useLearner();
  const garden = useMemo(
    () => computeGardenState(progressByLesson),
    [progressByLesson]
  );

  const [countedMangoes, setCountedMangoes] = useState<number>(0);
  const [frogPadIndex, setFrogPadIndex] = useState<number>(0);
  const [lotusBloomed, setLotusBloomed] = useState<boolean>(false);
  const [butterflyFlutter, setButterflyFlutter] = useState<number>(0);
  const [gardenMessageKm, setGardenMessageKm] = useState<string>(
    "ប៉ះប៊ូតុងខាងក្រោម ដើម្បីរាប់ស្វាយ នាំកង្កែបលោត ឬមើលផ្កាឈូករីក!"
  );

  const handleCountMango = () => {
    const next =
      countedMangoes >= garden.mangoCount ? 1 : countedMangoes + 1;
    setCountedMangoes(next);
    if (next === garden.mangoCount) {
      playSuccessChime(audioEnabled);
      setGardenMessageKm(
        `ល្អណាស់! ដើមស្វាយរបស់អ្នកមានផ្លែស្វាយទុំសរុប ${garden.mangoCount} ផ្លែ!`
      );
    } else {
      playScaleNote(next - 1, audioEnabled);
      setGardenMessageKm(`រាប់ស្វាយលើដើម៖ ${next} ផ្លែ!`);
    }
  };

  const handleHopFrog = () => {
    const padCount = Math.min(5, Math.max(3, garden.lotusCount));
    const nextPad = (frogPadIndex + 1) % padCount;
    setFrogPadIndex(nextPad);
    playWaterPlop(audioEnabled);
    setGardenMessageKm(
      `កង្កែបតូចលោតទៅស្លឹកឈូកទី ${nextPad + 1}! ប្ល៊ុប!`
    );
  };

  const handleBloomLotus = () => {
    setLotusBloomed((v) => !v);
    playSuccessChime(audioEnabled);
    setGardenMessageKm(
      `ផ្កាឈូកទាំង ${garden.lotusCount} ទងកំពុងរីកស្រស់ស្អាតលើស្រះ!`
    );
  };

  const handleFlutterButterflies = () => {
    const next = butterflyFlutter + 1;
    setButterflyFlutter(next);
    playScaleNote((next % 7) + 3, audioEnabled);
    setGardenMessageKm(
      `មេអំបៅ ${garden.butterflyCount} ក្បាលកំពុងហោះលេងក្នុងសួនគណិត!`
    );
  };

  const activeFrogSpot =
    LOTUS_SPOTS[frogPadIndex % Math.min(LOTUS_SPOTS.length, Math.max(3, garden.lotusCount))];

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
            <p className="text-xs font-bold text-success">
              {garden.gardenLevelKm}
            </p>
            <h1 className="text-2xl font-bold text-ink">
              សួនគណិតរបស់ {profile ? profile.displayName : "អ្នករៀន"}
            </h1>
          </div>
          <Link
            href="/play"
            className="khmer-chip inline-flex items-center rounded-full border border-accent bg-accent-soft px-3.5 text-xs font-bold text-accent hover:bg-accent hover:text-white"
          >
            ទៅក្ដារលេង →
          </Link>
        </div>

        {/* Living Interactive Cambodian Garden SVG (Safari-safe, zero foreignObject) */}
        <section className="rounded-3xl border border-border bg-surface p-3 shadow-xs space-y-3">
          <CelebrationBurst active={lotusBloomed} />

          <div className="w-full overflow-hidden rounded-2xl border border-border">
            <svg
              viewBox="0 0 360 272"
              className="w-full h-auto block select-none"
              role="img"
              aria-label={`សួនគណិតមានផ្លែស្វាយ ${formatDisplayNumber(garden.mangoCount, numeralPref)} ផ្លែ និងផ្កាឈូក ${formatDisplayNumber(garden.lotusCount, numeralPref)} ទង`}
            >
              {/* Warm sunrise sky */}
              <rect x={0} y={0} width={360} height={170} fill="#fef3c7" />
              <circle cx={302} cy={46} r={24} fill="#fde047" opacity={0.9} />

              {/* Distant calm silhouette & green hills */}
              <path
                d="M 218 145 L 228 122 L 236 145 M 242 145 L 254 110 L 266 145 M 272 145 L 280 124 L 290 145 Z"
                fill="#e7d7be"
              />
              <ellipse cx={95} cy={176} rx={155} ry={46} fill="#bbf7d0" />
              <ellipse cx={280} cy={178} rx={140} ry={42} fill="#86efac" />

              {/* Tranquil lotus pond */}
              <rect x={0} y={182} width={360} height={90} fill="#bae6fd" />
              <ellipse cx={180} cy={226} rx={156} ry={34} fill="#7dd3fc" />

              {/* Mango tree trunk & canopy */}
              <rect x={102} y={120} width={22} height={68} rx={8} fill="#92400e" />
              <circle cx={88} cy={104} r={36} fill="#16a34a" />
              <circle cx={142} cy={102} r={38} fill="#15803d" />
              <circle cx={116} cy={78} r={36} fill="#22c55e" />

              {/* Ripe Golden Mangoes (1 per completed Early Foundations lesson + 2 starters) */}
              {MANGO_SPOTS.slice(0, garden.mangoCount).map((pos, idx) => {
                const isCounted = idx < countedMangoes;
                return (
                  <g key={`mango-${idx}`}>
                    <ellipse
                      cx={pos.x}
                      cy={pos.y}
                      rx={isCounted ? 10.5 : 8.5}
                      ry={isCounted ? 8.5 : 7}
                      transform={`rotate(-18 ${pos.x} ${pos.y})`}
                      fill={isCounted ? "#fde047" : "#f59e0b"}
                      stroke={isCounted ? "#b45309" : "#92400e"}
                      strokeWidth={isCounted ? 2.2 : 1.5}
                    />
                  </g>
                );
              })}

              {/* Blooming Lotus Pads & Pink Flowers */}
              {LOTUS_SPOTS.slice(0, garden.lotusCount).map((pos, idx) => (
                <g key={`lotus-${idx}`}>
                  <ellipse
                    cx={pos.x}
                    cy={pos.y + 8}
                    rx={20}
                    ry={9}
                    fill="#4ade80"
                    stroke="#15803d"
                    strokeWidth={1.5}
                  />
                  <ellipse
                    cx={pos.x - 6}
                    cy={pos.y}
                    rx={lotusBloomed ? 6.5 : 5}
                    ry={lotusBloomed ? 10 : 8}
                    transform={`rotate(-22 ${pos.x - 6} ${pos.y})`}
                    fill="#f472b6"
                    stroke="#be185d"
                    strokeWidth={1.2}
                  />
                  <ellipse
                    cx={pos.x + 6}
                    cy={pos.y}
                    rx={lotusBloomed ? 6.5 : 5}
                    ry={lotusBloomed ? 10 : 8}
                    transform={`rotate(22 ${pos.x + 6} ${pos.y})`}
                    fill="#f472b6"
                    stroke="#be185d"
                    strokeWidth={1.2}
                  />
                  <ellipse
                    cx={pos.x}
                    cy={pos.y - 2}
                    rx={lotusBloomed ? 6.5 : 5.5}
                    ry={lotusBloomed ? 11 : 9}
                    fill="#fbcfe8"
                    stroke="#be185d"
                    strokeWidth={1.2}
                  />
                  <circle cx={pos.x} cy={pos.y + 2} r={3} fill="#facc15" />
                </g>
              ))}

              {/* Friendly Pond Frog hopping across pads */}
              {activeFrogSpot && (
                <g>
                  <circle
                    cx={activeFrogSpot.x}
                    cy={activeFrogSpot.y - 10}
                    r={12}
                    fill="#22c55e"
                    stroke="#15803d"
                    strokeWidth={1.8}
                  />
                  <circle cx={activeFrogSpot.x - 5} cy={activeFrogSpot.y - 20} r={4} fill="#22c55e" stroke="#15803d" strokeWidth={1.4} />
                  <circle cx={activeFrogSpot.x + 5} cy={activeFrogSpot.y - 20} r={4} fill="#22c55e" stroke="#15803d" strokeWidth={1.4} />
                  <circle cx={activeFrogSpot.x - 5} cy={activeFrogSpot.y - 20} r={1.6} fill="#111827" />
                  <circle cx={activeFrogSpot.x + 5} cy={activeFrogSpot.y - 20} r={1.6} fill="#111827" />
                  <path
                    d={`M ${activeFrogSpot.x - 5} ${activeFrogSpot.y - 8} Q ${activeFrogSpot.x} ${activeFrogSpot.y - 3} ${activeFrogSpot.x + 5} ${activeFrogSpot.y - 8}`}
                    fill="none"
                    stroke="#14532d"
                    strokeWidth={1.6}
                    strokeLinecap="round"
                  />
                </g>
              )}

              {/* Gentle Butterflies */}
              {BUTTERFLY_SPOTS.slice(0, garden.butterflyCount).map((b, idx) => {
                const dy = (butterflyFlutter + idx) % 2 === 0 ? -4 : 4;
                const dx = (butterflyFlutter + idx) % 2 === 0 ? 3 : -3;
                return (
                  <g key={`bf-${idx}`} transform={`translate(${dx}, ${dy})`}>
                    <ellipse cx={b.x - 5} cy={b.y} rx={6} ry={4.5} fill={b.color} opacity={0.9} />
                    <ellipse cx={b.x + 5} cy={b.y} rx={6} ry={4.5} fill={b.color} opacity={0.9} />
                    <line x1={b.x} y1={b.y - 4} x2={b.x} y2={b.y + 4} stroke="#374151" strokeWidth={1.8} />
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Live calm interaction message */}
          <p
            data-testid="garden-status-message"
            role="status"
            aria-live="polite"
            className="rounded-2xl bg-canvas border border-border px-4 py-2.5 text-center text-sm font-semibold text-ink"
          >
            {formatTextNumerals(gardenMessageKm, numeralPref)}
          </p>

          {/* Child-sized >= 56x56px interactive garden play buttons */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              data-testid="garden-count-mango-btn"
              onClick={handleCountMango}
              className="manipulative-target rounded-2xl border-2 border-hint bg-hint-soft px-3 py-2.5 text-sm font-bold text-hint-ink hover:opacity-95"
            >
              រាប់ផ្លែស្វាយ ({formatDisplayNumber(countedMangoes, numeralPref)}/{formatDisplayNumber(garden.mangoCount, numeralPref)})
            </button>

            <button
              type="button"
              data-testid="garden-hop-frog-btn"
              onClick={handleHopFrog}
              className="manipulative-target rounded-2xl border-2 border-success bg-success-soft px-3 py-2.5 text-sm font-bold text-success hover:opacity-95"
            >
              នាំកង្កែបលោត ({formatDisplayNumber(frogPadIndex + 1, numeralPref)})
            </button>

            <button
              type="button"
              data-testid="garden-bloom-lotus-btn"
              onClick={handleBloomLotus}
              className="manipulative-target rounded-2xl border-2 border-accent bg-accent-soft px-3 py-2.5 text-sm font-bold text-accent hover:opacity-95"
            >
              ផ្កាឈូករីក ({formatDisplayNumber(garden.lotusCount, numeralPref)})
            </button>

            <button
              type="button"
              data-testid="garden-butterflies-btn"
              onClick={handleFlutterButterflies}
              className="manipulative-target rounded-2xl border-2 border-border bg-surface px-3 py-2.5 text-sm font-bold text-ink hover:bg-surface-subtle"
            >
              មេអំបៅហោះ ({formatDisplayNumber(garden.butterflyCount, numeralPref)})
            </button>
          </div>
        </section>

        {/* Growth guide */}
        <section className="rounded-3xl border border-border bg-surface p-4 text-sm text-ink-muted space-y-1.5">
          <h2 className="text-base font-bold text-ink">
            របៀបធ្វើឱ្យសួនគណិតកាន់តែស្រស់ស្អាត
          </h2>
          <p>
            • បញ្ចប់មេរៀន <strong className="text-ink">គ្រឹះថ្នាក់ដំបូង</strong> នីមួយៗ → ដើមស្វាយផ្លែទុំបន្ថែម ១ ផ្លែ!
          </p>
          <p>
            • បញ្ចប់មេរៀន <strong className="text-ink">ធរណីមាត្រ / ប្រភាគ</strong> ឬ <strong className="text-ink">លំហាត់ប្រចាំថ្ងៃ</strong> → ផ្កាឈូករីកថ្មីលើស្រះ!
          </p>
          <p>
            • ទទួលបាន <strong className="text-ink">សញ្ញាសម្គាល់ការយល់ដឹង</strong> → មេអំបៅថ្មីហោះមកលេងក្នុងសួន!
          </p>
        </section>

        {/* Printable Offline Khmer Achievement Certificate */}
        <AchievementCertificate />
      </main>
    </div>
  );
}
