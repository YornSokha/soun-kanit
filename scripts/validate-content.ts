import fs from "node:fs";
import path from "node:path";
import {
  LessonDocumentV1Schema,
  type ActivityStep,
} from "../src/lib/curriculum/schema";
import { gradeStep, type StepAnswer } from "../src/lib/math/grader";
import { toKhmerDigits } from "../src/lib/khmer/numerals";

const CONTENT_DIR = path.join(process.cwd(), "content");

function collectJsonFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectJsonFiles(full));
    } else if (entry.isFile() && entry.name.endsWith(".json")) {
      files.push(full);
    }
  }
  return files.sort();
}

function buildValidAnswer(step: ActivityStep, useKhmer = false): StepAnswer {
  const fmt = (n: number) => (useKhmer ? `${toKhmerDigits(n)}\u200B` : n);

  switch (step.type) {
    case "counting-stage": {
      const total =
        step.solution.expectedTotal ??
        step.config.initialInFrame + step.config.initialOutside;
      const outside = Math.max(0, total - step.solution.expectedInFrame);
      return {
        type: "counting-stage",
        inFrame: fmt(step.solution.expectedInFrame),
        outside: fmt(outside),
        total: fmt(total),
      };
    }
    case "number-line": {
      const visited: Array<number | string> = [step.config.startValue];
      if (step.solution.requiredIntermediateValue !== undefined) {
        visited.push(fmt(step.solution.requiredIntermediateValue));
      }
      visited.push(fmt(step.solution.expectedValue));
      return {
        type: "number-line",
        value: fmt(step.solution.expectedValue),
        visitedValues: visited,
      };
    }
    case "place-value-blocks": {
      const total = step.solution.expectedTotal;
      const hundreds = Math.floor(total / 100);
      const tens = Math.floor((total % 100) / 10);
      const ones = total % 10;
      return {
        type: "place-value-blocks",
        hundreds: fmt(hundreds),
        tens: fmt(tens),
        ones: fmt(ones),
      };
    }
    case "scenario-choice": {
      if (step.config.variant === "banknote-builder") {
        return {
          type: "scenario-choice",
          sumKhr: fmt(step.solution.expectedSumKhr ?? 0),
        };
      }
      return {
        type: "scenario-choice",
        selectedOptionId: useKhmer
          ? `${step.solution.correctOptionId ?? ""}\u200B`
          : step.solution.correctOptionId,
      };
    }
  }
}

function buildInvalidAnswers(step: ActivityStep): StepAnswer[] {
  switch (step.type) {
    case "counting-stage": {
      const wrongInFrame =
        step.solution.expectedInFrame > 0
          ? step.solution.expectedInFrame - 1
          : step.solution.expectedInFrame + 1;
      return [{ type: "counting-stage", inFrame: wrongInFrame }];
    }
    case "number-line": {
      const wrongVal =
        step.solution.expectedValue === step.config.min
          ? step.config.max
          : step.config.min;
      const cases: StepAnswer[] = [
        { type: "number-line", value: wrongVal, visitedValues: [wrongVal] },
      ];
      if (step.solution.requiredIntermediateValue !== undefined) {
        cases.push({
          type: "number-line",
          value: step.solution.expectedValue,
          visitedValues: [step.config.startValue, step.solution.expectedValue],
        });
      }
      return cases;
    }
    case "place-value-blocks": {
      return [
        {
          type: "place-value-blocks",
          tens: 0,
          ones: step.solution.expectedTotal + 1,
        },
      ];
    }
    case "scenario-choice": {
      if (step.config.variant === "banknote-builder") {
        return [
          {
            type: "scenario-choice",
            sumKhr: (step.solution.expectedSumKhr ?? 500) + 100,
          },
        ];
      }
      return (step.config.options ?? [])
        .filter((o) => o.id !== step.solution.correctOptionId)
        .map((o) => ({
          type: "scenario-choice" as const,
          selectedOptionId: o.id,
        }));
    }
  }
}

function main() {
  const files = collectJsonFiles(CONTENT_DIR);
  if (files.length === 0) {
    console.error("ERROR: No lesson JSON files found under content/.");
    process.exit(1);
  }

  let errorCount = 0;
  let totalStepsChecked = 0;
  const seenIds = new Set<string>();

  for (const filePath of files) {
    const rel = path.relative(process.cwd(), filePath);
    let rawJson: unknown;
    try {
      rawJson = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    } catch (err) {
      console.error(`FAIL [${rel}]: Invalid JSON syntax`, err);
      errorCount++;
      continue;
    }

    const parsed = LessonDocumentV1Schema.safeParse(rawJson);
    if (!parsed.success) {
      console.error(`FAIL [${rel}]: Schema validation errors:`);
      for (const issue of parsed.error.issues) {
        console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
      }
      errorCount++;
      continue;
    }

    const lesson = parsed.data;
    if (seenIds.has(lesson.id)) {
      console.error(`FAIL [${rel}]: Duplicate lesson id "${lesson.id}"`);
      errorCount++;
    }
    seenIds.add(lesson.id);

    for (const step of lesson.steps) {
      totalStepsChecked++;

      // 1. Arabic/canonical solution must pass
      const validArabic = gradeStep(step, buildValidAnswer(step, false));
      if (!validArabic.isCorrect) {
        console.error(
          `FAIL [${rel} -> ${step.id}]: Declared solution failed grader: ${validArabic.feedbackKm}`
        );
        errorCount++;
      }

      // 2. Khmer + ZWSP solution must pass identically
      const validKhmer = gradeStep(step, buildValidAnswer(step, true));
      if (!validKhmer.isCorrect) {
        console.error(
          `FAIL [${rel} -> ${step.id}]: Khmer/ZWSP normalized solution failed grader: ${validKhmer.feedbackKm}`
        );
        errorCount++;
      }

      // 3. Invalid answers / distractors must fail with non-empty Khmer feedback
      for (const badAnswer of buildInvalidAnswers(step)) {
        const res = gradeStep(step, badAnswer);
        if (res.isCorrect || !res.feedbackKm.trim()) {
          console.error(
            `FAIL [${rel} -> ${step.id}]: Distractor/invalid answer did not fail cleanly with feedback`
          );
          errorCount++;
        }
      }
    }

    console.log(
      `PASS [${rel}] — ${lesson.titleKm} (${lesson.steps.length} steps verified)`
    );
  }

  console.log(
    `\nValidated ${files.length} lessons (${totalStepsChecked} steps). Errors: ${errorCount}`
  );

  if (errorCount > 0) {
    process.exit(1);
  }
}

main();
