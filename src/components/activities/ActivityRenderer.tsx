"use client";

import React from "react";
import type { ActivityStep } from "@/lib/curriculum/schema";
import type { StepAnswer } from "@/lib/math/grader";
import type { NumeralPreference } from "@/lib/khmer/numerals";
import { CountingStage } from "./CountingStage";
import { NumberLine } from "./NumberLine";
import { PlaceValueBlocks } from "./PlaceValueBlocks";
import { ScenarioChoice } from "./ScenarioChoice";

interface ActivityRendererProps {
  step: ActivityStep;
  numeralPref: NumeralPreference;
  highlightTargetId?: string;
  disabled?: boolean;
  onAnswerChange: (answer: StepAnswer) => void;
}

/**
 * Single decoupled renderer mapping any Zod-validated ActivityStep JSON
 * to its corresponding reusable Safari-safe SVG manipulative primitive.
 */
export function ActivityRenderer({
  step,
  numeralPref,
  highlightTargetId,
  disabled = false,
  onAnswerChange,
}: ActivityRendererProps) {
  switch (step.type) {
    case "counting-stage":
      return (
        <CountingStage
          key={step.id}
          step={step}
          numeralPref={numeralPref}
          highlightTargetId={highlightTargetId}
          disabled={disabled}
          onAnswerChange={onAnswerChange}
        />
      );
    case "number-line":
      return (
        <NumberLine
          key={step.id}
          step={step}
          numeralPref={numeralPref}
          highlightTargetId={highlightTargetId}
          disabled={disabled}
          onAnswerChange={onAnswerChange}
        />
      );
    case "place-value-blocks":
      return (
        <PlaceValueBlocks
          key={step.id}
          step={step}
          numeralPref={numeralPref}
          disabled={disabled}
          onAnswerChange={onAnswerChange}
        />
      );
    case "scenario-choice":
      return (
        <ScenarioChoice
          key={step.id}
          step={step}
          numeralPref={numeralPref}
          highlightTargetId={highlightTargetId}
          disabled={disabled}
          onAnswerChange={onAnswerChange}
        />
      );
  }
}
