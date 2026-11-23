import type { ActivityStep } from "@/lib/curriculum/schema";
import { normalizeNumericInput, stripZwsp } from "@/lib/khmer/numerals";

export type StepAnswer =
  | {
      type: "counting-stage";
      inFrame: number | string;
      outside?: number | string;
      total?: number | string;
    }
  | {
      type: "number-line";
      value: number | string;
      visitedValues?: Array<number | string>;
    }
  | {
      type: "place-value-blocks";
      hundreds?: number | string;
      tens?: number | string;
      ones?: number | string;
      total?: number | string;
    }
  | {
      type: "scenario-choice";
      selectedOptionId?: string;
      selectedNotesKhr?: Array<number | string>;
      sumKhr?: number | string;
    };

export interface GradeDiscrepancy {
  kind:
    | "count-mismatch"
    | "total-mismatch"
    | "missing-intermediate"
    | "value-mismatch"
    | "needs-regrouping"
    | "wrong-option"
    | "banknote-mismatch"
    | "invalid-input";
  expected?: number;
  actual?: number;
  missingIntermediate?: number;
  needsRegrouping?: boolean;
}

export interface GradeResult {
  isCorrect: boolean;
  feedbackKm: string;
  discrepancy?: GradeDiscrepancy;
}

/**
 * Pure deterministic grader shared across offline client, build-time validator,
 * and server verification. Normalizes Khmer/Arabic numerals and strips U+200B ZWSP.
 */
export function gradeStep(step: ActivityStep, answer: StepAnswer): GradeResult {
  if (step.type !== answer.type) {
    return {
      isCorrect: false,
      feedbackKm: "សូមសាកល្បងម្ដងទៀត ដោយប្រើឧបករណ៍លើអេក្រង់ណា៎!",
      discrepancy: { kind: "invalid-input" },
    };
  }

  switch (step.type) {
    case "counting-stage": {
      const ans = answer as Extract<StepAnswer, { type: "counting-stage" }>;
      const inFrame = normalizeNumericInput(ans.inFrame);
      const outside =
        ans.outside !== undefined ? normalizeNumericInput(ans.outside) : null;
      const explicitTotal =
        ans.total !== undefined ? normalizeNumericInput(ans.total) : null;

      if (inFrame === null || inFrame < 0) {
        return {
          isCorrect: false,
          feedbackKm: "សូមរំកិល ឬប៉ះវត្ថុដាក់ចូលប្រអប់សិនណា៎!",
          discrepancy: { kind: "invalid-input" },
        };
      }

      const computedTotal =
        explicitTotal !== null
          ? explicitTotal
          : outside !== null
            ? inFrame + outside
            : inFrame;

      const inFrameMatches = inFrame === step.solution.expectedInFrame;
      const totalMatches =
        step.solution.expectedTotal === undefined ||
        computedTotal === step.solution.expectedTotal;

      if (inFrameMatches && totalMatches) {
        return {
          isCorrect: true,
          feedbackKm: "ល្អណាស់! ចម្លើយរបស់អ្នកត្រឹមត្រូវហើយ!",
        };
      }

      if (!inFrameMatches) {
        const directionKm =
          inFrame < step.solution.expectedInFrame
            ? "ជិតត្រូវហើយ! ប្រអប់នៅខ្វះបន្តិចទៀត សាករាប់មើលប្រឡោះទំនេរម្ដងទៀតណា៎។"
            : "ជិតត្រូវហើយ! ចំនួនក្នុងប្រអប់លើសបន្តិចហើយ សាកដកចេញវិញបន្តិចណា៎។";
        return {
          isCorrect: false,
          feedbackKm: directionKm,
          discrepancy: {
            kind: "count-mismatch",
            expected: step.solution.expectedInFrame,
            actual: inFrame,
          },
        };
      }

      return {
        isCorrect: false,
        feedbackKm: "ពិនិត្យចំនួនសរុបទាំងក្នុង និងក្រៅប្រអប់ម្ដងទៀតណា៎!",
        discrepancy: {
          kind: "total-mismatch",
          expected: step.solution.expectedTotal,
          actual: computedTotal,
        },
      };
    }

    case "number-line": {
      const ans = answer as Extract<StepAnswer, { type: "number-line" }>;
      const actualValue = normalizeNumericInput(ans.value);
      if (actualValue === null) {
        return {
          isCorrect: false,
          feedbackKm: "សូមប៉ះ ឬអូសសញ្ញាទៅលើចំណុចមួយនៅលើបន្ទាត់ចំនួនណា៎!",
          discrepancy: { kind: "invalid-input" },
        };
      }

      const tolerance = step.solution.tolerance ?? 0;
      const valueMatches =
        Math.abs(actualValue - step.solution.expectedValue) <= tolerance + 1e-9;

      const visited = (ans.visitedValues ?? [])
        .map((v) => normalizeNumericInput(v))
        .filter((v): v is number => v !== null);

      const requiredMid = step.solution.requiredIntermediateValue;
      const hasIntermediate =
        requiredMid === undefined ||
        visited.some((v) => Math.abs(v - requiredMid) <= tolerance + 1e-9);

      if (valueMatches && hasIntermediate) {
        return {
          isCorrect: true,
          feedbackKm: "ពូកែណាស់! ការលោតលើបន្ទាត់ចំនួនត្រឹមត្រូវហើយ!",
        };
      }

      if (valueMatches && !hasIntermediate && requiredMid !== undefined) {
        return {
          isCorrect: false,
          feedbackKm:
            "លេខចុងក្រោយត្រូវហើយ ប៉ុន្តែសាកឈប់សម្រាកនៅគោលកណ្ដាលសិនណា៎ ដើម្បីឃើញវិធីបង្គ្រប់ ១០!",
          discrepancy: {
            kind: "missing-intermediate",
            expected: step.solution.expectedValue,
            actual: actualValue,
            missingIntermediate: requiredMid,
          },
        };
      }

      const hintDirection =
        actualValue < step.solution.expectedValue
          ? "ជិតដល់ហើយ! សាកលោតទៅខាងស្ដាំបន្ថែមបន្តិចទៀតណា៎។"
          : "ហួសបន្តិចហើយ! សាកលោតត្រឡប់មកខាងឆ្វេងវិញបន្តិចណា៎។";

      return {
        isCorrect: false,
        feedbackKm: hintDirection,
        discrepancy: {
          kind: "value-mismatch",
          expected: step.solution.expectedValue,
          actual: actualValue,
        },
      };
    }

    case "place-value-blocks": {
      const ans = answer as Extract<StepAnswer, { type: "place-value-blocks" }>;
      const hundreds =
        ans.hundreds !== undefined
          ? (normalizeNumericInput(ans.hundreds) ?? 0)
          : 0;
      const tens =
        ans.tens !== undefined ? (normalizeNumericInput(ans.tens) ?? 0) : 0;
      const ones =
        ans.ones !== undefined ? (normalizeNumericInput(ans.ones) ?? 0) : 0;

      const explicitTotal =
        ans.total !== undefined ? normalizeNumericInput(ans.total) : null;
      const computedTotal =
        explicitTotal !== null
          ? explicitTotal
          : hundreds * 100 + tens * 10 + ones;

      if (
        !Number.isFinite(computedTotal) ||
        hundreds < 0 ||
        tens < 0 ||
        ones < 0
      ) {
        return {
          isCorrect: false,
          feedbackKm: "សូមរៀបចំដុំគូបខ្ទង់រាយ និងដំបងខ្ទង់ដប់ម្ដងទៀតណា៎!",
          discrepancy: { kind: "invalid-input" },
        };
      }

      const totalMatches = computedTotal === step.solution.expectedTotal;
      const isCanonical = ones < 10 && tens < 10;

      if (totalMatches && (!step.solution.requireCanonical || isCanonical)) {
        return {
          isCorrect: true,
          feedbackKm: "អស្ចារ្យ! អ្នករៀបចំតម្លៃលេខតាមខ្ទង់បានត្រឹមត្រូវហើយ!",
        };
      }

      if (totalMatches && step.solution.requireCanonical && !isCanonical) {
        return {
          isCorrect: false,
          feedbackKm:
            "ចំនួនសរុបត្រូវហើយ! ប៉ុន្តែសាកចុច «ផ្ដុំ ១០» ដើម្បីប្ដូរដុំរាយ ១០ ជាដំបងដប់ ១ ណា៎!",
          discrepancy: {
            kind: "needs-regrouping",
            expected: step.solution.expectedTotal,
            actual: computedTotal,
            needsRegrouping: true,
          },
        };
      }

      return {
        isCorrect: false,
        feedbackKm:
          computedTotal < step.solution.expectedTotal
            ? "ជិតត្រូវហើយ! តម្លៃសរុបនៅតិចជាងគោលដៅបន្តិច សាកបន្ថែមដុំខ្ទង់ដប់ ឬខ្ទង់រាយទៀតណា៎។"
            : "ជិតត្រូវហើយ! តម្លៃសរុបច្រើនជាងគោលដៅបន្តិច សាកដកចេញខ្លះវិញណា៎។",
        discrepancy: {
          kind: "value-mismatch",
          expected: step.solution.expectedTotal,
          actual: computedTotal,
        },
      };
    }

    case "scenario-choice": {
      const ans = answer as Extract<StepAnswer, { type: "scenario-choice" }>;

      if (step.config.variant === "banknote-builder") {
        const expectedSum = step.solution.expectedSumKhr;
        if (expectedSum === undefined) {
          return {
            isCorrect: false,
            feedbackKm: "មិនអាចផ្ទៀងផ្ទាត់ចំនួនប្រាក់បានទេ។",
            discrepancy: { kind: "invalid-input" },
          };
        }

        let actualSum: number | null = null;
        if (ans.sumKhr !== undefined) {
          actualSum = normalizeNumericInput(ans.sumKhr);
        } else if (ans.selectedNotesKhr) {
          let sum = 0;
          for (const note of ans.selectedNotesKhr) {
            const parsed = normalizeNumericInput(note);
            if (parsed === null || parsed < 0) {
              return {
                isCorrect: false,
                feedbackKm: "សូមជ្រើសរើសក្រដាសប្រាក់រៀលម្ដងទៀតណា៎!",
                discrepancy: { kind: "invalid-input" },
              };
            }
            sum += parsed;
          }
          actualSum = sum;
        }

        if (actualSum === null) {
          return {
            isCorrect: false,
            feedbackKm: "សូមប៉ះក្រដាសប្រាក់រៀលដាក់លើថាសសិនណា៎!",
            discrepancy: { kind: "invalid-input" },
          };
        }

        if (actualSum === expectedSum) {
          return {
            isCorrect: true,
            feedbackKm: "ល្អណាស់! ចំនួនប្រាក់រៀលគ្រប់ត្រឹមត្រូវហើយ!",
          };
        }

        return {
          isCorrect: false,
          feedbackKm:
            actualSum < expectedSum
              ? "ប្រាក់លើថាសនៅខ្វះបន្តិចទៀត សាកបន្ថែមក្រដាសប្រាក់ទៀតណា៎!"
              : "ប្រាក់លើថាសលើសបន្តិចហើយ សាកដកក្រដាសប្រាក់ចេញវិញខ្លះណា៎!",
          discrepancy: {
            kind: "banknote-mismatch",
            expected: expectedSum,
            actual: actualSum,
          },
        };
      }

      // single-choice or worked-error-check
      const cleanSelected = ans.selectedOptionId
        ? stripZwsp(ans.selectedOptionId).trim()
        : "";
      const cleanExpected = step.solution.correctOptionId
        ? stripZwsp(step.solution.correctOptionId).trim()
        : "";

      if (!cleanSelected) {
        return {
          isCorrect: false,
          feedbackKm: "សូមជ្រើសរើសចម្លើយមួយសិនណា៎!",
          discrepancy: { kind: "invalid-input" },
        };
      }

      const chosenOption = step.config.options?.find(
        (opt) => stripZwsp(opt.id).trim() === cleanSelected
      );

      if (cleanSelected === cleanExpected) {
        return {
          isCorrect: true,
          feedbackKm:
            chosenOption?.diagnosticFeedbackKm ??
            "ល្អណាស់! ការជ្រើសរើសរបស់អ្នកត្រឹមត្រូវហើយ!",
        };
      }

      return {
        isCorrect: false,
        feedbackKm:
          chosenOption?.diagnosticFeedbackKm ??
          "ជិតត្រូវហើយ! សាកពិនិត្យមើលជម្រើសផ្សេងទៀត ឬសុំជំនួយណា៎។",
        discrepancy: { kind: "wrong-option" },
      };
    }
  }
}
