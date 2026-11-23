import { z } from "zod";

export const ConcretenessStageSchema = z.enum([
  "concrete",
  "iconic",
  "symbolic",
]);

export const HintTierSchema = z.object({
  tier: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  kind: z.enum(["visual-cue", "strategy-nudge", "worked-step"]),
  textKm: z.string().min(4).max(180),
  highlightTargetId: z.string().optional(),
});

const HintsArraySchema = z
  .array(HintTierSchema)
  .length(3)
  .refine(
    (hints) =>
      hints[0].tier === 1 &&
      hints[0].kind === "visual-cue" &&
      hints[1].tier === 2 &&
      hints[1].kind === "strategy-nudge" &&
      hints[2].tier === 3 &&
      hints[2].kind === "worked-step",
    {
      message:
        "Hints must contain 3 ordered tiers: 1 (visual-cue), 2 (strategy-nudge), 3 (worked-step)",
    }
  );

export const CountingStageStepSchema = z.object({
  id: z.string().min(1),
  type: z.literal("counting-stage"),
  stage: ConcretenessStageSchema,
  promptKm: z.string().min(4).max(180),
  audioUrl: z.string().optional(),
  config: z.object({
    frameSize: z.union([z.literal(5), z.literal(10), z.literal(20)]),
    tokenTheme: z.enum(["mango", "orange", "lotus", "dot", "cube"]),
    initialInFrame: z.number().int().min(0),
    initialOutside: z.number().int().min(0),
    allowFreeExplore: z.boolean().default(false),
    showLiveCount: z.boolean().default(true),
    requireFullTenBundle: z.boolean().default(false),
  }),
  solution: z.object({
    expectedInFrame: z.number().int().min(0),
    expectedTotal: z.number().int().min(0).optional(),
  }),
  hints: HintsArraySchema,
  explanationKm: z.string().min(4).max(240),
});

export const NumberLineStepSchema = z.object({
  id: z.string().min(1),
  type: z.literal("number-line"),
  stage: ConcretenessStageSchema,
  promptKm: z.string().min(4).max(180),
  audioUrl: z.string().optional(),
  config: z.object({
    min: z.number(),
    max: z.number(),
    step: z.number().positive(),
    startValue: z.number(),
    showJumps: z.boolean().default(true),
    hiddenTickValues: z.array(z.number()).default([]),
    theme: z.enum(["default", "frog-lotus"]).default("default"),
  }),
  solution: z.object({
    expectedValue: z.number(),
    requiredIntermediateValue: z.number().optional(),
    tolerance: z.number().nonnegative().default(0),
  }),
  hints: HintsArraySchema,
  explanationKm: z.string().min(4).max(240),
});

export const PlaceValueBlocksStepSchema = z.object({
  id: z.string().min(1),
  type: z.literal("place-value-blocks"),
  stage: ConcretenessStageSchema,
  promptKm: z.string().min(4).max(180),
  audioUrl: z.string().optional(),
  config: z.object({
    initialHundreds: z.number().int().min(0).default(0),
    initialTens: z.number().int().min(0).default(0),
    initialOnes: z.number().int().min(0).default(0),
    allowHundreds: z.boolean().default(false),
    allowBundle: z.boolean().default(true),
    allowUnbundle: z.boolean().default(true),
    showLiveTotal: z.boolean().default(true),
  }),
  solution: z.object({
    expectedTotal: z.number().int().min(0),
    requireCanonical: z.boolean().default(false),
  }),
  hints: HintsArraySchema,
  explanationKm: z.string().min(4).max(240),
});

export const ScenarioChoiceOptionSchema = z.object({
  id: z.string().min(1),
  labelKm: z.string().min(1).max(120),
  diagnosticFeedbackKm: z.string().max(180).optional(),
});

export const ScenarioChoiceStepSchema = z.object({
  id: z.string().min(1),
  type: z.literal("scenario-choice"),
  stage: ConcretenessStageSchema,
  promptKm: z.string().min(4).max(180),
  audioUrl: z.string().optional(),
  config: z.object({
    variant: z.enum([
      "single-choice",
      "banknote-builder",
      "worked-error-check",
    ]),
    visualCue: z.string().optional(),
    workedExampleKm: z.string().max(260).optional(),
    options: z.array(ScenarioChoiceOptionSchema).min(2).max(4).optional(),
    availableNotesKhr: z.array(z.number().int().positive()).optional(),
  }),
  solution: z.object({
    correctOptionId: z.string().optional(),
    expectedSumKhr: z.number().int().positive().optional(),
  }),
  hints: HintsArraySchema,
  explanationKm: z.string().min(4).max(240),
});

export const ActivityStepSchema = z.discriminatedUnion("type", [
  CountingStageStepSchema,
  NumberLineStepSchema,
  PlaceValueBlocksStepSchema,
  ScenarioChoiceStepSchema,
]);

export const LessonDocumentV1Schema = z.object({
  schemaVersion: z.literal("1.0"),
  id: z.string().regex(/^[a-z0-9-]+$/),
  pathId: z.string().min(1),
  order: z.number().int().positive(),
  moeysGradeRef: z.enum(["G1", "G2", "G3", "G4", "G5", "G6"]),
  topicSlug: z.string().min(1),
  titleKm: z.string().min(2).max(80),
  subtitleKm: z.string().min(2).max(120),
  estimatedMinutes: z.number().int().min(3).max(15),
  learningObjectiveKm: z.string().min(4).max(180),
  steps: z.array(ActivityStepSchema).min(3).max(8),
});

export type ConcretenessStage = z.infer<typeof ConcretenessStageSchema>;
export type HintTier = z.infer<typeof HintTierSchema>;
export type CountingStageStep = z.infer<typeof CountingStageStepSchema>;
export type NumberLineStep = z.infer<typeof NumberLineStepSchema>;
export type PlaceValueBlocksStep = z.infer<typeof PlaceValueBlocksStepSchema>;
export type ScenarioChoiceStep = z.infer<typeof ScenarioChoiceStepSchema>;
export type ActivityStep = z.infer<typeof ActivityStepSchema>;
export type LessonDocumentV1 = z.infer<typeof LessonDocumentV1Schema>;
