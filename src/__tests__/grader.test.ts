import { describe, expect, it } from "vitest";
import type {
  CountingStageStep,
  NumberLineStep,
  PlaceValueBlocksStep,
  ScenarioChoiceStep,
} from "@/lib/curriculum/schema";
import { gradeStep } from "@/lib/math/grader";

const sampleHints = [
  { tier: 1 as const, kind: "visual-cue" as const, textKm: "មើលចំណុចសំខាន់!" },
  { tier: 2 as const, kind: "strategy-nudge" as const, textKm: "គិតបង្គ្រប់ ១០!" },
  { tier: 3 as const, kind: "worked-step" as const, textKm: "ធ្វើតាមជំហាននេះ!" },
];

describe("gradeStep() deterministic grader", () => {
  it("grades counting-stage with Arabic, Khmer, and ZWSP inputs", () => {
    const step: CountingStageStep = {
      id: "cs-1",
      type: "counting-stage",
      stage: "concrete",
      promptKm: "បង្គ្រប់ ១០",
      config: {
        frameSize: 10,
        tokenTheme: "mango",
        initialInFrame: 8,
        initialOutside: 5,
        allowFreeExplore: true,
        showLiveCount: true,
        requireFullTenBundle: true,
      },
      solution: { expectedInFrame: 10, expectedTotal: 13 },
      hints: sampleHints,
      explanationKm: "១០ + ៣ = ១៣",
    };

    expect(
      gradeStep(step, { type: "counting-stage", inFrame: 10, outside: 3 })
        .isCorrect
    ).toBe(true);
    expect(
      gradeStep(step, {
        type: "counting-stage",
        inFrame: "១\u200B០",
        outside: "៣",
      }).isCorrect
    ).toBe(true);

    const low = gradeStep(step, {
      type: "counting-stage",
      inFrame: 8,
      outside: 5,
    });
    expect(low.isCorrect).toBe(false);
    expect(low.discrepancy?.kind).toBe("count-mismatch");

    const wrongTotal = gradeStep(step, {
      type: "counting-stage",
      inFrame: 10,
      outside: 2,
    });
    expect(wrongTotal.isCorrect).toBe(false);
    expect(wrongTotal.discrepancy?.kind).toBe("total-mismatch");
  });

  it("grades number-line including required intermediate stops", () => {
    const step: NumberLineStep = {
      id: "nl-1",
      type: "number-line",
      stage: "iconic",
      promptKm: "គណនា ៩ + ៦ តាមលេខ ១០",
      config: {
        min: 0,
        max: 20,
        step: 1,
        startValue: 9,
        showJumps: true,
        hiddenTickValues: [],
        theme: "default",
      },
      solution: {
        expectedValue: 15,
        requiredIntermediateValue: 10,
        tolerance: 0,
      },
      hints: sampleHints,
      explanationKm: "៩ + ១ + ៥ = ១៥",
    };

    expect(
      gradeStep(step, {
        type: "number-line",
        value: "១\u200B៥",
        visitedValues: [9, "១០", "១៥"],
      }).isCorrect
    ).toBe(true);

    const skippedTen = gradeStep(step, {
      type: "number-line",
      value: 15,
      visitedValues: [9, 15],
    });
    expect(skippedTen.isCorrect).toBe(false);
    expect(skippedTen.discrepancy?.kind).toBe("missing-intermediate");

    const wrongVal = gradeStep(step, {
      type: "number-line",
      value: 14,
      visitedValues: [9, 10, 14],
    });
    expect(wrongVal.isCorrect).toBe(false);
    expect(wrongVal.discrepancy?.kind).toBe("value-mismatch");
  });

  it("grades place-value-blocks with optional canonical regrouping check", () => {
    const step: PlaceValueBlocksStep = {
      id: "pv-1",
      type: "place-value-blocks",
      stage: "symbolic",
      promptKm: "ផ្ដុំ ១០",
      config: {
        initialHundreds: 0,
        initialTens: 0,
        initialOnes: 13,
        allowHundreds: false,
        allowBundle: true,
        allowUnbundle: true,
        showLiveTotal: true,
      },
      solution: { expectedTotal: 13, requireCanonical: true },
      hints: sampleHints,
      explanationKm: "១ ដប់ និង ៣ រាយ ស្មើ ១៣",
    };

    const ungrouped = gradeStep(step, {
      type: "place-value-blocks",
      tens: 0,
      ones: 13,
    });
    expect(ungrouped.isCorrect).toBe(false);
    expect(ungrouped.discrepancy?.kind).toBe("needs-regrouping");

    const grouped = gradeStep(step, {
      type: "place-value-blocks",
      tens: "១",
      ones: "៣\u200B",
    });
    expect(grouped.isCorrect).toBe(true);
  });

  it("grades scenario-choice single-choice and banknote-builder variants", () => {
    const choiceStep: ScenarioChoiceStep = {
      id: "sc-1",
      type: "scenario-choice",
      stage: "symbolic",
      promptKm: "ជ្រើសរើសចម្លើយ",
      config: {
        variant: "single-choice",
        options: [
          {
            id: "opt-a",
            labelKm: "៧ + ៣ + ២ = ១២",
            diagnosticFeedbackKm: "ត្រឹមត្រូវ!",
          },
          {
            id: "opt-b",
            labelKm: "៧ + ២ + ២ = ១១",
            diagnosticFeedbackKm: "២ + ២ ស្មើតែ ៤ ទេ!",
          },
        ],
      },
      solution: { correctOptionId: "opt-a" },
      hints: sampleHints,
      explanationKm: "៧ + ៣ + ២ = ១២",
    };

    expect(
      gradeStep(choiceStep, {
        type: "scenario-choice",
        selectedOptionId: "opt-a\u200B",
      }).isCorrect
    ).toBe(true);

    const wrongChoice = gradeStep(choiceStep, {
      type: "scenario-choice",
      selectedOptionId: "opt-b",
    });
    expect(wrongChoice.isCorrect).toBe(false);
    expect(wrongChoice.feedbackKm).toContain("៤");

    const banknoteStep: ScenarioChoiceStep = {
      id: "sc-2",
      type: "scenario-choice",
      stage: "concrete",
      promptKm: "រៀបចំប្រាក់ ១,៥០០៛",
      config: {
        variant: "banknote-builder",
        availableNotesKhr: [100, 500, 1000],
      },
      solution: { expectedSumKhr: 1500 },
      hints: sampleHints,
      explanationKm: "១,០០០៛ + ៥០០៛ = ១,៥០០៛",
    };

    expect(
      gradeStep(banknoteStep, {
        type: "scenario-choice",
        selectedNotesKhr: ["១០០០", "៥០០\u200B"],
      }).isCorrect
    ).toBe(true);

    expect(
      gradeStep(banknoteStep, {
        type: "scenario-choice",
        selectedNotesKhr: [1000, 100],
      }).isCorrect
    ).toBe(false);
  });
});
