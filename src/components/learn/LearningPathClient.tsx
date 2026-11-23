"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import type { LearningPathMeta } from "@/lib/curriculum/loader";
import { useLearner } from "@/components/providers/LearnerProvider";
import { NumeralToggle } from "@/components/ui/NumeralToggle";
import {
  formatDisplayNumber,
  formatTextNumerals,
} from "@/lib/khmer/numerals";
import { MASTERY_LABELS_KM, type MasteryTier } from "@/lib/math/mastery";
import { computeMasteryBadges } from "@/lib/math/badges";
import { buildReviewQueue } from "@/lib/math/reviewQueue";
import { getDailyProgressKey } from "@/lib/curriculum/daily";
import { cacheLessons } from "@/lib/storage/idb";

interface LearningPathClientProps {
  path: LearningPathMeta;
}

const MASTERY_BADGE_STYLE: Record<MasteryTier, string> = {
  not_started: "border-border bg-surface-subtle text-ink-muted",
  attempted: "border-hint bg-hint-soft text-hint-ink",
  familiar: "border-accent/40 bg-accent-soft text-accent",
  proficient: "border-success bg-success-soft text-success",
  mastered: "border-success bg-success text-white",
};

function countActiveDaysThisWeek(
  activeDates: string[],
  cutoffIso: string | null
): number {
  if (!cutoffIso) return 0;
  return activeDates.filter((d) => d >= cutoffIso).length;
}

export function LearningPathClient({ path }: LearningPathClientProps) {
  const {
    profile,
    profiles,
    progressByLesson,
    numeralPref,
    isOnline,
    pendingSyncCount,
    switchProfile,
  } = useLearner();

  const [offlineCached, setOfflineCached] = useState<boolean>(false);
  const [weekCutoffIso, setWeekCutoffIso] = useState<string | null>(null);
  const [todayDate, setTodayDate] = useState<{ iso: string; now: Date } | null>(
    null
  );

  // Cache all lessons locally in IndexedDB and compute current week cutoff on client
  useEffect(() => {
    let active = true;
    void cacheLessons(path.lessons).then(() => {
      if (!active) return;
      const now = new Date();
      const cutoff = new Date(now);
      cutoff.setDate(now.getDate() - 6);
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, "0");
      const d = String(now.getDate()).padStart(2, "0");
      setWeekCutoffIso(cutoff.toISOString().slice(0, 10));
      setTodayDate({ iso: `${y}-${m}-${d}`, now });
      setOfflineCached(true);
    });
    return () => {
      active = false;
    };
  }, [path.lessons]);

  const weeklyGoal = profile?.weeklyGoalDays ?? 3;
  const activeDaysThisWeek = Math.min(
    7,
    countActiveDaysThisWeek(profile?.activeDates ?? [], weekCutoffIso)
  );
  const completedCount = path.lessons.filter((l) => {
    const tier = progressByLesson[l.id]?.masteryTier;
    return tier && tier !== "not_started";
  }).length;
  const badges = computeMasteryBadges(progressByLesson);
  const earnedBadgesCount = badges.filter((b) => b.earned).length;
  const dueReviewCount = todayDate
    ? buildReviewQueue(path.lessons, progressByLesson, todayDate.now).due.length
    : 0;
  const dailyDoneToday = todayDate
    ? Boolean(progressByLesson[getDailyProgressKey(todayDate.iso)]?.completedAt)
    : false;

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <header className="sticky top-0 z-20 border-b border-border bg-surface/95 backdrop-blur px-4 py-3">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-2">
          <Link
            href="/"
            className="khmer-chip inline-flex items-center gap-2 rounded-xl px-2 text-base font-bold text-ink"
          >
            <span
              aria-hidden="true"
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-white text-base font-bold"
            >
              គ
            </span>
            <span>គន្លឹះគណិត</span>
          </Link>

          <div className="flex items-center gap-2">
            <NumeralToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-5 px-4 py-6 pb-12">
        {/* Learner calm summary & weekly rhythm card */}
        <section className="rounded-3xl border border-border bg-surface p-5 shadow-xs space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-ink-muted">
                សូមស្វាគមន៍មករៀន
              </p>
              <h1 className="text-2xl font-bold text-ink">
                {profile ? profile.displayName : "អ្នករៀនគន្លឹះគណិត"}
              </h1>
              {profile && (
                <p className="text-xs text-ink-muted">
                  ថ្នាក់ទី {formatDisplayNumber(profile.gradeLevel, numeralPref)} •{" "}
                  ពិន្ទុគំនិត{" "}
                  <strong className="text-accent">
                    {formatDisplayNumber(profile.totalXp, numeralPref)} XP
                  </strong>
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span
                data-testid="offline-readiness-badge"
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                  isOnline
                    ? "border-success/40 bg-success-soft text-success"
                    : "border-hint bg-hint-soft text-hint-ink"
                }`}
              >
                {!isOnline
                  ? "កំពុងប្រើគ្មានអ៊ីនធឺណិត"
                  : offlineCached
                    ? "រួចរាល់សម្រាប់ប្រើគ្មានអ៊ីនធឺណិត"
                    : "កំពុងរៀបចំទុកក្នុងឧបករណ៍"}
              </span>
              {pendingSyncCount > 0 && (
                <span className="rounded-full border border-border bg-surface-subtle px-2.5 py-1 text-xs text-ink-muted">
                  រង់ចាំផ្សារភ្ជាប់៖{" "}
                  {formatDisplayNumber(pendingSyncCount, numeralPref)}
                </span>
              )}
            </div>
          </div>

          {/* Calm weekly rhythm (target 3 active days/week, zero guilt streaks) */}
          <div className="rounded-2xl border border-border bg-canvas p-3.5 flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-0.5">
              <p className="text-sm font-bold text-ink">
                ចង្វាក់រៀនប្រចាំសប្ដាហ៍
              </p>
              <p className="text-xs text-ink-muted">
                គោលដៅ {formatDisplayNumber(weeklyGoal, numeralPref)} ថ្ងៃក្នុងមួយសប្ដាហ៍ (សម្រាកថ្ងៃណាក៏បាន មិនដាច់ពិន្ទុទេ)
              </p>
            </div>
            <div className="flex items-center gap-1.5" aria-label="ថ្ងៃរៀនសប្ដាហ៍នេះ">
              {Array.from({ length: weeklyGoal }).map((_, idx) => {
                const filled = idx < activeDaysThisWeek;
                return (
                  <span
                    key={idx}
                    className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-xs font-bold ${
                      filled
                        ? "border-success bg-success text-white"
                        : "border-border bg-surface text-ink-muted"
                    }`}
                  >
                    {formatDisplayNumber(idx + 1, numeralPref)}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Calm informational mastery badges (zero loot boxes / guilt streaks) */}
          <div
            data-testid="mastery-badges-section"
            className="rounded-2xl border border-border bg-canvas p-3.5 space-y-2.5"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-bold text-ink">
                សញ្ញាសម្គាល់ការយល់ដឹង
              </p>
              <span className="text-xs font-semibold text-ink-muted">
                {formatDisplayNumber(earnedBadgesCount, numeralPref)} /{" "}
                {formatDisplayNumber(badges.length, numeralPref)}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {badges.map((badge) => (
                <div
                  key={badge.id}
                  data-testid={`badge-${badge.id}`}
                  data-earned={badge.earned ? "true" : "false"}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${
                    badge.earned
                      ? "border-success bg-success-soft text-success"
                      : "border-border bg-surface text-ink-muted"
                  }`}
                  title={formatTextNumerals(badge.descriptionKm, numeralPref)}
                >
                  <span aria-hidden="true">{badge.earned ? "★" : "○"}</span>
                  <span>{formatTextNumerals(badge.titleKm, numeralPref)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Multi-child local switcher on shared family devices */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex flex-wrap items-center gap-1.5">
              {profiles.length > 1 &&
                profiles.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => void switchProfile(p.id)}
                    className={`khmer-chip rounded-full border px-3 text-xs font-semibold ${
                      p.id === profile?.id
                        ? "border-accent bg-accent-soft text-accent"
                        : "border-border bg-surface text-ink-muted"
                    }`}
                  >
                    {p.displayName}
                  </button>
                ))}
            </div>
            <Link
              href="/onboarding"
              className="khmer-chip inline-flex items-center rounded-xl border border-border bg-surface px-3 text-xs font-semibold text-ink hover:bg-surface-subtle"
            >
              {profile ? "+ បន្ថែមឈ្មោះកុមារ" : "បង្កើតឈ្មោះរៀន"}
            </Link>
          </div>
        </section>

        {/* Quick calm actions: 2-min Daily Puzzle & Leitner Review Queue */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            href="/daily"
            data-testid="daily-puzzle-card"
            className="rounded-3xl border border-border bg-surface p-4 shadow-xs hover:border-accent hover:bg-surface-subtle transition-colors flex items-center justify-between gap-3"
          >
            <div className="space-y-0.5">
              <p className="text-base font-bold text-ink">
                លំហាត់ប្រចាំថ្ងៃ
              </p>
              <p className="text-xs text-ink-muted">
                {dailyDoneToday
                  ? "បានបញ្ចប់លំហាត់ថ្ងៃនេះហើយ!"
                  : `ល្បងគំនិតរូបភាព ${formatDisplayNumber(2, numeralPref)} នាទី`}
              </p>
            </div>
            <span
              className={`rounded-full border px-3 py-1 text-xs font-bold shrink-0 ${
                dailyDoneToday
                  ? "border-success bg-success-soft text-success"
                  : "border-accent bg-accent-soft text-accent"
              }`}
            >
              {dailyDoneToday ? "រួចរាល់" : "សាកល្បង"}
            </span>
          </Link>

          <Link
            href="/review"
            data-testid="review-queue-card"
            className="rounded-3xl border border-border bg-surface p-4 shadow-xs hover:border-accent hover:bg-surface-subtle transition-colors flex items-center justify-between gap-3"
          >
            <div className="space-y-0.5">
              <p className="text-base font-bold text-ink">
                រំលឹកឡើងវិញ
              </p>
              <p className="text-xs text-ink-muted">
                {dueReviewCount > 0
                  ? `ដល់ពេលរំលឹក ${formatDisplayNumber(dueReviewCount, numeralPref)} មេរៀន`
                  : "តារាងរំលឹកតាមប្រអប់ Leitner"}
              </p>
            </div>
            <span
              className={`rounded-full border px-3 py-1 text-xs font-bold shrink-0 ${
                dueReviewCount > 0
                  ? "border-hint bg-hint-soft text-hint-ink"
                  : "border-border bg-surface-subtle text-ink-muted"
              }`}
            >
              {dueReviewCount > 0
                ? `${formatDisplayNumber(dueReviewCount, numeralPref)} មេរៀន`
                : "មើលតារាង"}
            </span>
          </Link>
        </section>

        {/* Early Foundations Path Header */}
        <section className="space-y-3">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="text-xl font-bold text-ink">
                {formatTextNumerals(path.titleKm, numeralPref)}
              </h2>
              <p className="text-sm text-ink-muted">
                {formatTextNumerals(path.subtitleKm, numeralPref)}
              </p>
            </div>
            <span className="rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold text-ink-muted">
              បានរៀន {formatDisplayNumber(completedCount, numeralPref)} /{" "}
              {formatDisplayNumber(path.lessons.length, numeralPref)} មេរៀន
            </span>
          </div>

          {/* Unrestricted Lesson List (never locked by grade) */}
          <div className="grid grid-cols-1 gap-3">
            {path.lessons.map((lesson) => {
              const prog = progressByLesson[lesson.id];
              const tier: MasteryTier = prog?.masteryTier ?? "not_started";
              const gradeNum = lesson.moeysGradeRef.replace("G", "");

              return (
                <Link
                  key={lesson.id}
                  href={`/learn/${lesson.id}`}
                  data-testid={`lesson-card-${lesson.id}`}
                  className="group rounded-3xl border border-border bg-surface p-4 sm:p-5 shadow-xs transition-colors hover:border-accent hover:bg-surface-subtle flex items-start gap-4"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent-soft text-lg font-bold text-accent group-hover:bg-accent group-hover:text-white transition-colors">
                    {formatDisplayNumber(lesson.order, numeralPref)}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-base sm:text-lg font-bold text-ink">
                        {formatTextNumerals(lesson.titleKm, numeralPref)}
                      </h3>
                      <span
                        data-testid={`mastery-badge-${lesson.id}`}
                        className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${MASTERY_BADGE_STYLE[tier]}`}
                      >
                        {MASTERY_LABELS_KM[tier]}
                      </span>
                    </div>

                    <p className="text-sm text-ink-muted">
                      {formatTextNumerals(lesson.subtitleKm, numeralPref)}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 pt-0.5 text-xs text-ink-muted">
                      <span>
                        ថ្នាក់ទី {formatDisplayNumber(gradeNum, numeralPref)}
                      </span>
                      <span aria-hidden="true">•</span>
                      <span>
                        ប្រហែល{" "}
                        {formatDisplayNumber(
                          lesson.estimatedMinutes,
                          numeralPref
                        )}{" "}
                        នាទី
                      </span>
                      <span aria-hidden="true">•</span>
                      <span>
                        {formatDisplayNumber(lesson.steps.length, numeralPref)}{" "}
                        ជំហាន
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
