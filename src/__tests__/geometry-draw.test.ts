import { describe, expect, it } from "vitest";
import {
  analyzeDrawnPolygon,
  checkSymmetryMirror,
  computeMirrorCells,
} from "@/lib/math/geometryDraw";
import { gradeStep } from "@/lib/math/grader";
import type { GeometryDrawStep } from "@/lib/curriculum/schema";

describe("geometryDraw pure math engine", () => {
  it("recognizes a closed triangle regardless of orientation", () => {
    const res = analyzeDrawnPolygon([
      { from: "0,0", to: "0,2" },
      { from: "0,2", to: "2,1" },
      { from: "2,1", to: "0,0" },
    ]);
    expect(res.isClosed).toBe(true);
    expect(res.kind).toBe("triangle");
    expect(res.corners).toHaveLength(3);
  });

  it("recognizes a square and collapses intermediate collinear pegs", () => {
    const res = analyzeDrawnPolygon([
      { from: "0,0", to: "0,1" },
      { from: "0,1", to: "0,2" },
      { from: "0,2", to: "2,2" },
      { from: "2,2", to: "2,0" },
      { from: "2,0", to: "0,0" },
    ]);
    expect(res.isClosed).toBe(true);
    expect(res.kind).toBe("square");
    expect(res.corners).toHaveLength(4);
  });

  it("distinguishes a non-square rectangle from a square", () => {
    const res = analyzeDrawnPolygon([
      { from: "0,0", to: "0,3" },
      { from: "0,3", to: "2,3" },
      { from: "2,3", to: "2,0" },
      { from: "2,0", to: "0,0" },
    ]);
    expect(res.isClosed).toBe(true);
    expect(res.kind).toBe("rectangle");
  });

  it("marks incomplete open polylines as open", () => {
    const res = analyzeDrawnPolygon([
      { from: "0,0", to: "0,2" },
      { from: "0,2", to: "2,2" },
    ]);
    expect(res.isClosed).toBe(false);
    expect(res.kind).toBe("open");
  });

  it("computes and verifies horizontal mirror symmetry across vertical axis", () => {
    const left = ["0,0", "1,0", "1,1", "2,0", "2,1", "3,0"];
    const expectedRight = computeMirrorCells(4, left);
    expect(expectedRight).toEqual(["0,3", "1,2", "1,3", "2,2", "2,3", "3,3"]);

    const ok = checkSymmetryMirror(4, left, expectedRight);
    expect(ok.isMatch).toBe(true);
    expect(ok.missingCount).toBe(0);
    expect(ok.extraCount).toBe(0);

    const wrong = checkSymmetryMirror(4, left, ["0,3", "1,3"]);
    expect(wrong.isMatch).toBe(false);
    expect(wrong.missingCount).toBe(4);
  });
});

describe("gradeStep for geometry-draw primitive", () => {
  const baseHints = [
    { tier: 1 as const, kind: "visual-cue" as const, textKm: "គន្លឹះ ១" },
    { tier: 2 as const, kind: "strategy-nudge" as const, textKm: "គន្លឹះ ២" },
    { tier: 3 as const, kind: "worked-step" as const, textKm: "គន្លឹះ ៣" },
  ];

  it("grades dot-connect shapes and handles ZWSP in point keys", () => {
    const step: GeometryDrawStep = {
      id: "t-square",
      type: "geometry-draw",
      stage: "iconic",
      promptKm: "គូររូបការ៉េបិទជិតមួយ",
      config: {
        mode: "dot-connect",
        gridRows: 4,
        gridCols: 4,
        templateLeftCells: [],
        inkColor: "#15803d",
      },
      solution: { expectedShape: "square", requireSymmetryMirror: false },
      hints: baseHints,
      explanationKm: "ការ៉េមាន ៤ ជ្រុងស្មើគ្នា។",
    };

    const ok = gradeStep(step, {
      type: "geometry-draw",
      edges: [
        { from: "0,\u200B0", to: "0,2" },
        { from: "0,2", to: "2,2" },
        { from: "2,2", to: "2,0" },
        { from: "2,0", to: "0,0" },
      ],
    });
    expect(ok.isCorrect).toBe(true);

    const wrong = gradeStep(step, {
      type: "geometry-draw",
      edges: [
        { from: "0,0", to: "0,2" },
        { from: "0,2", to: "2,1" },
        { from: "2,1", to: "0,0" },
      ],
    });
    expect(wrong.isCorrect).toBe(false);
    expect(wrong.discrepancy?.kind).toBe("drawing-mismatch");
  });

  it("grades symmetry-mirror mode", () => {
    const step: GeometryDrawStep = {
      id: "t-sym",
      type: "geometry-draw",
      stage: "iconic",
      promptKm: "លាបស្លាបមេអំបៅឆ្លុះស៊ីមេទ្រី",
      config: {
        mode: "symmetry-mirror",
        gridRows: 4,
        gridCols: 4,
        templateLeftCells: ["0,0", "1,1"],
        inkColor: "#db2777",
      },
      solution: { requireSymmetryMirror: true },
      hints: baseHints,
      explanationKm: "ឆ្លុះស៊ីមេទ្រីតាមអ័ក្សកណ្ដាល។",
    };

    expect(
      gradeStep(step, {
        type: "geometry-draw",
        paintedCells: ["0,3", "1,\u200B2"],
      }).isCorrect
    ).toBe(true);

    expect(
      gradeStep(step, {
        type: "geometry-draw",
        paintedCells: ["0,3"],
      }).isCorrect
    ).toBe(false);
  });

  it("grades area-paint mode by exact painted cell count", () => {
    const step: GeometryDrawStep = {
      id: "t-area",
      type: "geometry-draw",
      stage: "symbolic",
      promptKm: "លាបផ្ទៃក្រឡា ៦ ឯកតាការ៉េ",
      config: {
        mode: "area-paint",
        gridRows: 4,
        gridCols: 4,
        templateLeftCells: [],
        inkColor: "#d97706",
      },
      solution: { expectedArea: 6, requireSymmetryMirror: false },
      hints: baseHints,
      explanationKm: "ផ្ទៃក្រឡាស្មើ ៦ ប្រឡោះ។",
    };

    expect(
      gradeStep(step, {
        type: "geometry-draw",
        paintedCells: ["0,0", "0,1", "0,2", "1,0", "1,1", "1,2"],
      }).isCorrect
    ).toBe(true);

    expect(
      gradeStep(step, {
        type: "geometry-draw",
        paintedCells: ["0,0", "0,1", "0,2"],
      }).isCorrect
    ).toBe(false);
  });
});
