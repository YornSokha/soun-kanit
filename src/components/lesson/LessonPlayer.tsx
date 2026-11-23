"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { LessonDocumentV1 } from "@/lib/curriculum/schema";
import { gradeStep, type GradeResult, type StepAnswer } from "@/lib/math/grader";
import { MASTERY_LABELS_KM, type MasteryTier } from "@/lib/math/mastery";
import {
  formatDisplayNumber,
  formatTextNumerals,
} from "@/lib/khmer/numerals";
import { cacheLessons } from "@/lib/storage/idb";
import { useLearner } from "@/components/providers/LearnerProvider";
import { NumeralToggle } from "@/components/ui/NumeralToggle";
import { AudioReadButton, AudioToggle } from "@/components/ui/AudioReadButton";
import { ActivityRenderer } from "@/components/activities/ActivityRenderer";
import {
  playGentleNudgeChime,
  playHintChime,
  playSuccessChime,
} from "@/lib/audio/chimes";

interface LessonPlayerProps {
  lesson: LessonDocumentV1;
}

const STAGE_LABELS_KM: Record<string, string> = {
  concrete: "រូបភាពជាក់ស្ដែង",
  iconic: "គំរូរូបភាព",
  symbolic: "និមិត្តសញ្ញាគណិត",
};

const HINT_KIND_LABELS_KM: Record<string, string> = {
  "visual-cue": "ជំនួយទី ១ • មើលចំណុចសំខាន់",
  "strategy-nudge": "ជំនួយទី ២ • វិធីគិត",
  "worked-step": "ជំនួយទី ៣ • ជំហានណែនាំ",
};

export function LessonPlayer({ lesson }: LessonPlayerProps) {
  const {
    numeralPref,
    audioEnabled,
    isOnline,
    recordStepCompleted,
    recordLessonFinished,
  } = useLearner();

  const [stepIndex, setStepIndex] = useState<number>(0);
  const [currentAnswer, setCurrentAnswer] = useState<StepAnswer | null>(null);
  const [gradeResult, setGradeResult] = useState<GradeResult | null>(null);
  const [stepAttempts, setStepAttempts] = useState<number>(0);
  const [revealedHintCount, setRevealedHintCount] = useState<number>(0);

  // Lesson-wide metrics
  const [firstTryCorrectCount, setFirstTryCorrectCount] = useState<number>(0);
  const [totalHintsUsed, setTotalHintsUsed] = useState<number>(0);
  const [usedTier3Hint, setUsedTier3Hint] = useState<boolean>(false);
  const [completedStepIds, setCompletedStepIds] = useState<string[]>([]);

  const [summary, setSummary] = useState<{
    accuracyPct: number;
    masteryTier: MasteryTier;
    xpEarned: number;
    intervalDays: number;
  } | null>(null);

  // Cache lesson payload into IndexedDB immediately for offline durability
  useEffect(() => {
    void cacheLessons([lesson]);
  }, [lesson]);

  const activeStep = lesson.steps[stepIndex];
  const totalSteps = lesson.steps.length;
  const isStepSolved = Boolean(gradeResult?.isCorrect);

  const activeHighlightTargetId =
    revealedHintCount > 0 && activeStep
      ? activeStep.hints[revealedHintCount - 1]?.highlightTargetId
      : undefined;

  const handleAnswerChange = useCallback((answer: StepAnswer) => {
    setCurrentAnswer(answer);
    setGradeResult((prev) => (prev && !prev.isCorrect ? null : prev));
  }, []);

  const handleCheckAnswer = async () => {
    if (!activeStep || !currentAnswer || isStepSolved) return;

    const result = gradeStep(activeStep, currentAnswer);
    const nextAttempts = stepAttempts + 1;
    setStepAttempts(nextAttempts);
    setGradeResult(result);

    if (result.isCorrect) {
      playSuccessChime(audioEnabled);
      if (nextAttempts === 1 && revealedHintCount === 0) {
        setFirstTryCorrectCount((c) => c + 1);
      }
      setCompletedStepIds((prev) =>
        prev.includes(activeStep.id) ? prev : [...prev, activeStep.id]
      );
      await recordStepCompleted(lesson.id, activeStep.id);
    } else {
      playGentleNudgeChime(audioEnabled);
    }
  };

  const handleRevealNextHint = () => {
    if (!activeStep || revealedHintCount >= activeStep.hints.length) return;
    playHintChime(audioEnabled);
    const nextCount = revealedHintCount + 1;
    setRevealedHintCount(nextCount);
    setTotalHintsUsed((h) => h + 1);
    if (nextCount >= 3) {
      setUsedTier3Hint(true);
    }
  };

  const handleContinue = async () => {
    if (!isStepSolved) return;

    if (stepIndex + 1 < totalSteps) {
      setStepIndex((i) => i + 1);
      setCurrentAnswer(null);
      setGradeResult(null);
      setStepAttempts(0);
      setRevealedHintCount(0);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // Lesson finished! Compute accuracy & persist to IndexedDB + sync outbox
    const accuracyPct = Math.round((firstTryCorrectCount / totalSteps) * 100);
    const allStepIds = lesson.steps.map((s) => s.id);
    const saved = await recordLessonFinished({
      lessonId: lesson.id,
      accuracyPct,
      hintsUsed: totalHintsUsed,
      usedTier3Hint,
      completedStepIds: Array.from(new Set([...completedStepIds, ...allStepIds])),
    });

    setSummary({
      accuracyPct,
      masteryTier: saved.progress.masteryTier,
      xpEarned: saved.xpEarned,
      intervalDays: saved.intervalDays,
    });
  };

  const handleRestart = () => {
    setStepIndex(0);
    setCurrentAnswer(null);
    setGradeResult(null);
    setStepAttempts(0);
    setRevealedHintCount(0);
    setFirstTryCorrectCount(0);
    setTotalHintsUsed(0);
    setUsedTier3Hint(false);
    setCompletedStepIds([]);
    setSummary(null);
  };

  if (summary) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col">
        <header className="sticky top-0 z-20 border-b border-border bg-surface/95 backdrop-blur px-4 py-2.5">
          <div className="mx-auto flex max-w-xl items-center justify-between gap-2">
            <Link
              href="/learn"
              className="khmer-chip inline-flex items-center rounded-xl border border-border bg-surface px-3 text-sm font-semibold text-ink hover:bg-surface-subtle"
            >
              ← ផ្លូវរៀន
            </Link>
            <NumeralToggle />
          </div>
        </header>

        <main
          data-testid="lesson-summary"
          className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center px-4 py-8"
        >
          <section className="w-full rounded-3xl border border-border bg-surface p-6 shadow-sm text-center space-y-5">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success-soft text-success">
              <svg
                viewBox="0 0 48 48"
                className="h-10 w-10"
                aria-hidden="true"
              >
                <circle cx={24} cy={24} r={22} fill="none" stroke="currentColor" strokeWidth={3} />
                <path
                  d="M 14 25 L 21 32 L 34 17"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={3.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-ink">
                អបអរសាទរ! អ្នកបានបញ្ចប់មេរៀនហើយ
              </h1>
              <p className="text-base text-ink-muted">
                {formatTextNumerals(lesson.titleKm, numeralPref)}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2.5 pt-1">
              <div className="rounded-2xl border border-border bg-canvas p-3">
                <p className="text-xs text-ink-muted">កម្រិតស្ទាត់</p>
                <p
                  data-testid="summary-mastery-tier"
                  className="mt-1 text-sm font-bold text-success"
                >
                  {MASTERY_LABELS_KM[summary.masteryTier]}
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-canvas p-3">
                <p className="text-xs text-ink-muted">ភាពត្រឹមត្រូវ</p>
                <p className="mt-1 text-base font-bold text-ink">
                  {formatDisplayNumber(summary.accuracyPct, numeralPref)}%
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-canvas p-3">
                <p className="text-xs text-ink-muted">ពិន្ទុគំនិត</p>
                <p className="mt-1 text-base font-bold text-accent">
                  +{formatDisplayNumber(summary.xpEarned, numeralPref)} XP
                </p>
              </div>
            </div>

            <p className="rounded-2xl bg-surface-subtle px-4 py-3 text-sm text-ink-muted">
              កាលវិភាគរំលឹកឡើងវិញបន្ទាប់៖{" "}
              <strong className="text-ink">
                {formatDisplayNumber(summary.intervalDays, numeralPref)} ថ្ងៃទៀត
              </strong>
              {!isOnline && " (បានរក្សាទុកក្នុងឧបករណ៍ដោយជោគជ័យ)"}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link
                href="/learn"
                data-testid="back-to-path-btn"
                className="khmer-chip flex-1 inline-flex items-center justify-center rounded-2xl bg-accent px-5 py-3 text-base font-bold text-white shadow-xs hover:bg-accent-hover"
              >
                ត្រឡប់ទៅផ្លូវរៀន
              </Link>
              <button
                type="button"
                onClick={handleRestart}
                className="khmer-chip inline-flex items-center justify-center rounded-2xl border border-border bg-surface px-5 py-3 text-base font-semibold text-ink hover:bg-surface-subtle"
              >
                អនុវត្តម្ដងទៀត
              </button>
            </div>
          </section>
        </main>
      </div>
    );
  }

  const progressPercent = Math.round(
    ((stepIndex + (isStepSolved ? 1 : 0)) / totalSteps) * 100
  );

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      {/* Calm distraction-free sticky header (zero countdown timers) */}
      <header className="sticky top-0 z-20 border-b border-border bg-surface/95 backdrop-blur px-3 py-2.5">
        <div className="mx-auto flex max-w-xl items-center justify-between gap-2">
          <Link
            href="/learn"
            data-testid="lesson-exit-btn"
            className="khmer-chip inline-flex items-center rounded-xl border border-border bg-surface px-3 text-sm font-semibold text-ink hover:bg-surface-subtle"
          >
            ចាកចេញ
          </Link>

          <div className="flex-1 px-1">
            <div className="flex items-center justify-between text-xs font-semibold text-ink-muted mb-1">
              <span data-testid="step-counter">
                ជំហាន {formatDisplayNumber(stepIndex + 1, numeralPref)} /{" "}
                {formatDisplayNumber(totalSteps, numeralPref)}
              </span>
              {!isOnline && (
                <span
                  data-testid="offline-badge"
                  className="rounded-full bg-hint-soft px-2 py-0.5 text-hint-ink"
                >
                  គ្មានអ៊ីនធឺណិត
                </span>
              )}
            </div>
            <div
              className="h-2.5 w-full overflow-hidden rounded-full bg-surface-subtle"
              role="progressbar"
              aria-valuenow={progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="វឌ្ឍនភាពមេរៀន"
            >
              <div
                className="h-full rounded-full bg-accent transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <AudioToggle />
            <NumeralToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-4 px-3 py-4 pb-10">
        {/* Lesson title + Concreteness Fading stage chip */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-ink-muted">
            {formatTextNumerals(lesson.titleKm, numeralPref)}
          </p>
          <span className="rounded-full border border-border bg-surface px-3 py-0.5 text-xs font-semibold text-ink-muted">
            {STAGE_LABELS_KM[activeStep.stage] ?? activeStep.stage}
          </span>
        </div>

        {/* Active Step Card */}
        <section className="rounded-3xl border border-border bg-surface p-3.5 sm:p-5 shadow-xs space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h1
              data-testid="step-prompt"
              className="flex-1 min-w-[200px] text-lg sm:text-xl font-bold text-ink"
            >
              {formatTextNumerals(activeStep.promptKm, numeralPref)}
            </h1>
            <AudioReadButton
              textKm={activeStep.promptKm}
              audioUrl={activeStep.audioUrl}
            />
          </div>

          {/* Single decoupled SVG manipulative renderer */}
          <ActivityRenderer
            step={activeStep}
            numeralPref={numeralPref}
            highlightTargetId={activeHighlightTargetId}
            disabled={isStepSolved}
            onAnswerChange={handleAnswerChange}
          />
        </section>

        {/* Immediate non-punitive feedback & visual explanation */}
        {gradeResult && (
          <section
            data-testid="feedback-panel"
            role="status"
            aria-live="polite"
            className={`rounded-2xl border-2 p-4 space-y-2 ${
              gradeResult.isCorrect
                ? "border-success bg-success-soft text-ink"
                : "border-hint bg-hint-soft text-ink"
            }`}
          >
            <p className="text-base font-bold">
              {formatTextNumerals(gradeResult.feedbackKm, numeralPref)}
            </p>
            {gradeResult.isCorrect && (
              <p
                data-testid="step-explanation"
                className="text-sm text-ink"
              >
                {formatTextNumerals(activeStep.explanationKm, numeralPref)}
              </p>
            )}
          </section>
        )}

        {/* Gated 3-tier elaborative hint drawer */}
        {revealedHintCount > 0 && (
          <section
            data-testid="hint-drawer"
            aria-label="ជំនួយជាដំណាក់កាល"
            className="rounded-2xl border border-hint bg-hint-soft/80 p-4 space-y-2.5"
          >
            {activeStep.hints.slice(0, revealedHintCount).map((hint) => (
              <div
                key={hint.tier}
                data-testid={`hint-tier-${hint.tier}`}
                className="rounded-xl bg-surface p-3 border border-border space-y-0.5"
              >
                <p className="text-xs font-bold text-hint-ink">
                  {formatTextNumerals(
                    HINT_KIND_LABELS_KM[hint.kind] ?? `ជំនួយទី ${hint.tier}`,
                    numeralPref
                  )}
                </p>
                <p className="text-sm text-ink">
                  {formatTextNumerals(hint.textKm, numeralPref)}
                </p>
              </div>
            ))}
          </section>
        )}

        {/* Primary Action Row */}
        <div className="flex flex-wrap items-center gap-3 pt-1">
          {!isStepSolved ? (
            <>
              <button
                type="button"
                data-testid="check-answer-btn"
                onClick={() => void handleCheckAnswer()}
                className="khmer-chip flex-1 rounded-2xl bg-accent px-5 py-3 text-base font-bold text-white shadow-xs hover:bg-accent-hover"
              >
                ពិនិត្យចម្លើយ
              </button>

              <button
                type="button"
                data-testid="hint-btn"
                disabled={revealedHintCount >= activeStep.hints.length}
                onClick={handleRevealNextHint}
                className={`khmer-chip rounded-2xl border-2 px-4 py-3 text-sm font-bold transition-colors disabled:opacity-45 ${
                  stepAttempts > 0 && revealedHintCount < activeStep.hints.length
                    ? "border-hint bg-hint-soft text-hint-ink ring-2 ring-hint/30"
                    : "border-border bg-surface text-ink hover:bg-surface-subtle"
                }`}
              >
                {revealedHintCount === 0
                  ? "សុំជំនួយ"
                  : revealedHintCount < activeStep.hints.length
                    ? `សុំជំនួយបន្ថែម (${formatDisplayNumber(revealedHintCount, numeralPref)}/${formatDisplayNumber(activeStep.hints.length, numeralPref)})`
                    : "បានបង្ហាញជំនួយគ្រប់ហើយ"}
              </button>
            </>
          ) : (
            <button
              type="button"
              data-testid="continue-btn"
              onClick={() => void handleContinue()}
              className="khmer-chip w-full rounded-2xl bg-success px-5 py-3.5 text-base font-bold text-white shadow-xs hover:opacity-95"
            >
              {stepIndex + 1 < totalSteps ? "បន្តទៅមុខ" : "បញ្ចប់មេរៀន"}
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
