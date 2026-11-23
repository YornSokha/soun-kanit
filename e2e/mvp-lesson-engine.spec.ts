import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

async function expectNoWcag22Violations(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(results.violations).toEqual([]);
}

async function expectAllManipulativeTargetsAtLeast56px(page: Page) {
  const targets = page.locator(".manipulative-target");
  const count = await targets.count();
  expect(count).toBeGreaterThan(0);

  for (let i = 0; i < count; i++) {
    const el = targets.nth(i);
    if (!(await el.isVisible())) continue;
    const box = await el.boundingBox();
    expect(box, `Target index ${i} should have a bounding box`).not.toBeNull();
    expect(
      box!.width,
      `Target index ${i} width (${box!.width}) must be >= 56px`
    ).toBeGreaterThanOrEqual(56);
    expect(
      box!.height,
      `Target index ${i} height (${box!.height}) must be >= 56px`
    ).toBeGreaterThanOrEqual(56);
  }
}

test.describe("Konleuh Kanit Milestone 1 E2E (360x800 Mobile)", () => {
  test("Khmer typography, onboarding -> learning path -> Lesson 7 tap-to-place, numeral toggle, 3-tier hints, touch targets, and WCAG 2.2 AA", async ({
    page,
  }) => {
    // 1. Landing page + Khmer typography & WCAG 2.2 AA check
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("lang", "km");

    const typoMetrics = await page.evaluate(() => {
      const style = window.getComputedStyle(document.documentElement);
      const fontSize = parseFloat(style.fontSize);
      const lineHeight = parseFloat(style.lineHeight);
      const letterSpacing = style.letterSpacing;
      return { ratio: lineHeight / fontSize, letterSpacing };
    });
    expect(typoMetrics.ratio).toBeGreaterThanOrEqual(1.65);
    expect(["0px", "normal"]).toContain(typoMetrics.letterSpacing);

    await expectNoWcag22Violations(page);

    // 2. Navigate to guest onboarding
    await page.getByTestId("cta-start-onboarding").click();
    await expect(page).toHaveURL(/\/onboarding$/);
    await expectNoWcag22Violations(page);

    await page.getByTestId("nickname-input").fill("ដារ៉ា");
    await page.getByTestId("avatar-mango").click();
    await page.getByTestId("age-7").click();
    await page.getByTestId("onboarding-submit-btn").click();

    // 3. Learning Path Dashboard
    await expect(page).toHaveURL(/\/learn$/);
    await expect(page.getByRole("heading", { name: "ដារ៉ា" })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "គ្រឹះគណិតវិទ្យាថ្នាក់ដំបូង" })
    ).toBeVisible();
    await expectNoWcag22Violations(page);

    // 4. Open Lesson 7 (Making 10 & Teens)
    await page.getByTestId("lesson-card-l07-making-ten").click();
    await expect(page).toHaveURL(/\/learn\/l07-making-ten$/);

    // Verify default Khmer numerals and >= 56x56 touch targets
    await expect(page.getByTestId("step-prompt")).toContainText("៨");
    await expect(page.getByTestId("counting-in-frame-badge")).toContainText("៨");
    await expectAllManipulativeTargetsAtLeast56px(page);
    await expectNoWcag22Violations(page);

    // 5. Wrong answer triggers non-punitive feedback & 3-tier hint progression
    await page.getByTestId("check-answer-btn").click();
    await expect(page.getByTestId("feedback-panel")).toBeVisible();
    await expect(page.getByTestId("feedback-panel")).toContainText("ជិតត្រូវហើយ");
    await expectNoWcag22Violations(page);

    // Reveal 3 tiers of hints sequentially
    await page.getByTestId("hint-btn").click();
    await expect(page.getByTestId("hint-tier-1")).toBeVisible();
    await page.getByTestId("hint-btn").click();
    await expect(page.getByTestId("hint-tier-2")).toBeVisible();
    await page.getByTestId("hint-btn").click();
    await expect(page.getByTestId("hint-tier-3")).toBeVisible();
    await expectNoWcag22Violations(page);

    // 6. Tap-to-place first mango (zero dragging): 8 -> 9 in frame
    await page.getByTestId("outside-token-0").click();
    await page.getByTestId("frame-slot-8").click();
    await expect(page.getByTestId("counting-in-frame-badge")).toContainText("៩");

    // 7. Mid-lesson numeral toggle (១២៣ -> 123) preserves active step state (9 in frame!)
    await page.locator('[data-testid="numeral-toggle"]:visible').click();
    await expect(page.getByTestId("step-prompt")).toContainText("8");
    await expect(page.getByTestId("counting-in-frame-badge")).toContainText("9");
    await expect(page.getByTestId("counting-outside-badge")).toContainText("4");

    // Toggle back to Khmer numerals (123 -> ១២៣) and verify state still preserved
    await page.locator('[data-testid="numeral-toggle"]:visible').click();
    await expect(page.getByTestId("counting-in-frame-badge")).toContainText("៩");

    // 8. Tap-to-place second mango: 9 -> 10 in frame (3 outside, total 13)
    await page.getByTestId("outside-token-0").click();
    await page.getByTestId("frame-slot-9").click();
    await expect(page.getByTestId("counting-in-frame-badge")).toContainText("១០");

    await page.getByTestId("check-answer-btn").click();
    await expect(page.getByTestId("step-explanation")).toBeVisible();
    await expectNoWcag22Violations(page);
    await page.getByTestId("continue-btn").click();

    // 9. Step 2: Number Line (9 + 6 via 10 = 15) — tap-to-place only!
    await expect(page.getByTestId("step-counter")).toContainText("២ / ៣");
    await expectAllManipulativeTargetsAtLeast56px(page);
    await expectNoWcag22Violations(page);

    await page.getByTestId("tick-10").click();
    await expect(page.getByTestId("number-line-value-badge")).toContainText("១០");
    await page.getByTestId("tick-15").click();
    await expect(page.getByTestId("number-line-value-badge")).toContainText("១៥");

    await page.getByTestId("check-answer-btn").click();
    await expect(page.getByTestId("step-explanation")).toBeVisible();
    await page.getByTestId("continue-btn").click();

    // 10. Step 3: Scenario Choice (7 + 5 = 7 + 3 + 2 = 12)
    await expect(page.getByTestId("step-counter")).toContainText("៣ / ៣");
    await expectAllManipulativeTargetsAtLeast56px(page);
    await expectNoWcag22Violations(page);

    await page.getByTestId("choice-option-opt-a").click();
    await page.getByTestId("check-answer-btn").click();
    await expect(page.getByTestId("step-explanation")).toBeVisible();
    await page.getByTestId("continue-btn").click();

    // 11. Calm completion summary
    await expect(page.getByTestId("lesson-summary")).toBeVisible();
    await expect(page.getByTestId("summary-mastery-tier")).toBeVisible();
    await expectNoWcag22Violations(page);
  });

  test("Offline mode completes lesson steps and persists mastery to IndexedDB", async ({
    page,
    context,
  }) => {
    // Load Lesson 7 while online
    await page.goto("/learn/l07-making-ten");
    await expect(page.getByTestId("step-prompt")).toBeVisible();

    // Switch browser context offline mid-lesson
    await context.setOffline(true);

    // Complete Step 1 offline via tap-to-place
    await page.getByTestId("outside-token-0").click();
    await page.getByTestId("frame-slot-8").click();
    await page.getByTestId("outside-token-0").click();
    await page.getByTestId("frame-slot-9").click();
    await page.getByTestId("check-answer-btn").click();
    await expect(page.getByTestId("continue-btn")).toBeVisible();
    await page.getByTestId("continue-btn").click();

    // Complete Step 2 offline (9 -> 10 -> 15)
    await page.getByTestId("tick-10").click();
    await page.getByTestId("tick-15").click();
    await page.getByTestId("check-answer-btn").click();
    await expect(page.getByTestId("continue-btn")).toBeVisible();
    await page.getByTestId("continue-btn").click();

    // Complete Step 3 offline
    await page.getByTestId("choice-option-opt-a").click();
    await page.getByTestId("check-answer-btn").click();
    await expect(page.getByTestId("continue-btn")).toBeVisible();
    await page.getByTestId("continue-btn").click();

    // Summary shows up offline
    await expect(page.getByTestId("lesson-summary")).toBeVisible();

    // Verify IndexedDB actually contains saved progress & outbox entry
    const idbCheck = await page.evaluate(async () => {
      return new Promise<{ progressCount: number; outboxCount: number; savedLessonId: string | null }>(
        (resolve, reject) => {
          const req = window.indexedDB.open("konleuh-kanit-db", 1);
          req.onerror = () => reject(req.error);
          req.onsuccess = () => {
            const db = req.result;
            const tx = db.transaction(["progress", "syncOutbox"], "readonly");
            const pReq = tx.objectStore("progress").getAll();
            const oReq = tx.objectStore("syncOutbox").getAll();
            tx.oncomplete = () => {
              const pList = pReq.result as Array<{ lessonId: string; masteryTier: string }>;
              const oList = oReq.result as unknown[];
              const l7 = pList.find((item) => item.lessonId === "l07-making-ten");
              resolve({
                progressCount: pList.length,
                outboxCount: oList.length,
                savedLessonId: l7?.lessonId ?? null,
              });
            };
          };
        }
      );
    });

    expect(idbCheck.progressCount).toBeGreaterThanOrEqual(1);
    expect(idbCheck.savedLessonId).toBe("l07-making-ten");
    expect(idbCheck.outboxCount).toBeGreaterThanOrEqual(1);

    // Restore online status cleanly
    await context.setOffline(false);
  });

  test("Milestone 2: 10-lesson path, 4 new SVG primitives (L3, L9, L10), >=56px targets, mastery badges, and WCAG 2.2 AA", async ({
    page,
  }) => {
    // 1. Verify all 10 lessons & mastery badges on /learn
    await page.goto("/learn");
    await expect(page.getByTestId("mastery-badges-section")).toBeVisible();
    const lessonIds = [
      "l01-counting-1-5",
      "l02-zero-and-ten-frame",
      "l03-comparing-numbers",
      "l04-number-line-0-10",
      "l05-addition-to-10",
      "l06-subtraction-within-10",
      "l07-making-ten",
      "l08-tens-and-ones-99",
      "l09-patterns-and-shapes",
      "l10-riel-money-and-halves",
    ];
    for (const id of lessonIds) {
      await expect(page.getByTestId(`lesson-card-${id}`)).toBeVisible();
    }
    await expectNoWcag22Violations(page);

    // 2. Lesson 3 (comparison-balance: >, <, balance 6=6)
    await page.goto("/learn/l03-comparing-numbers");
    await expectAllManipulativeTargetsAtLeast56px(page);
    await expectNoWcag22Violations(page);
    await page.getByTestId("compare-op-gt").click();
    await page.getByTestId("check-answer-btn").click();
    await page.getByTestId("continue-btn").click();

    await expectAllManipulativeTargetsAtLeast56px(page);
    await page.getByTestId("compare-op-lt").click();
    await page.getByTestId("check-answer-btn").click();
    await page.getByTestId("continue-btn").click();

    await expectAllManipulativeTargetsAtLeast56px(page);
    await page.getByTestId("balance-add-2").click();
    await expect(page.getByTestId("balance-right-total")).toContainText("៦");
    await page.getByTestId("check-answer-btn").click();
    await page.getByTestId("continue-btn").click();
    await expect(page.getByTestId("lesson-summary")).toBeVisible();

    // 3. Lesson 9 (pattern-sequence krama + fraction-bar-shape 2D + array-groups + skip counting)
    await page.goto("/learn/l09-patterns-and-shapes");
    await expectAllManipulativeTargetsAtLeast56px(page);
    await expectNoWcag22Violations(page);
    // Tap-to-place krama pattern: red -> slot 0, blue -> slot 1
    await page.getByTestId("pattern-tile-red").click();
    await page.getByTestId("pattern-slot-0").click();
    await page.getByTestId("pattern-tile-blue").click();
    await page.getByTestId("pattern-slot-1").click();
    await page.getByTestId("check-answer-btn").click();
    await page.getByTestId("continue-btn").click();

    // Step 2: 2D shape identify (triangle)
    await expectAllManipulativeTargetsAtLeast56px(page);
    await expectNoWcag22Violations(page);
    await page.getByTestId("shape-option-shape-tri").click();
    await page.getByTestId("check-answer-btn").click();
    await page.getByTestId("continue-btn").click();

    // Step 3: array-groups (2 x 3 = 6, starts at 1 x 2)
    await expectAllManipulativeTargetsAtLeast56px(page);
    await expectNoWcag22Violations(page);
    await page.getByTestId("array-rows-inc").click();
    await page.getByTestId("array-cols-inc").click();
    await expect(page.getByTestId("array-product-badge")).toContainText("៦");
    await page.getByTestId("check-answer-btn").click();
    await page.getByTestId("continue-btn").click();

    // Step 4: skip counting 2, 4, 6, 8
    await expectAllManipulativeTargetsAtLeast56px(page);
    await page.getByTestId("pattern-tile-8").click();
    await page.getByTestId("pattern-slot-0").click();
    await page.getByTestId("check-answer-btn").click();
    await page.getByTestId("continue-btn").click();
    await expect(page.getByTestId("lesson-summary")).toBeVisible();

    // 4. Lesson 10 (banknote-builder + fraction-bar-shape 1/2 and 2/4 = 1/2)
    await page.goto("/learn/l10-riel-money-and-halves");
    await expectAllManipulativeTargetsAtLeast56px(page);
    await expectNoWcag22Violations(page);
    await page.getByTestId("banknote-500").click();
    await page.getByTestId("banknote-500").click();
    await page.getByTestId("check-answer-btn").click();
    await page.getByTestId("continue-btn").click();

    await page.getByTestId("choice-option-opt-500").click();
    await page.getByTestId("check-answer-btn").click();
    await page.getByTestId("continue-btn").click();

    // Step 3: Shade 1/2
    await expectAllManipulativeTargetsAtLeast56px(page);
    await expectNoWcag22Violations(page);
    await page.getByTestId("fraction-part-0").click();
    await page.getByTestId("check-answer-btn").click();
    await page.getByTestId("continue-btn").click();

    // Step 4: Shade 2/4 (= 1/2)
    await expectAllManipulativeTargetsAtLeast56px(page);
    await expectNoWcag22Violations(page);
    await page.getByTestId("fraction-part-0").click();
    await page.getByTestId("fraction-part-1").click();
    await page.getByTestId("check-answer-btn").click();
    await page.getByTestId("continue-btn").click();
    await expect(page.getByTestId("lesson-summary")).toBeVisible();

    // 5. Return to /learn and verify earned mastery badges unlocked!
    await page.goto("/learn");
    await expect(page.getByTestId("badge-first-step")).toHaveAttribute(
      "data-earned",
      "true"
    );
    await expect(page.getByTestId("badge-pattern-explorer")).toHaveAttribute(
      "data-earned",
      "true"
    );
    await expect(page.getByTestId("badge-riel-fraction-pro")).toHaveAttribute(
      "data-earned",
      "true"
    );
    await expectNoWcag22Violations(page);
  });

  test("Milestone 3: Khmer audio read-aloud toggle, /daily visual puzzle, and /review Leitner due queue (WCAG 2.2 AA)", async ({
    page,
  }) => {
    // 1. Audio read-aloud button & persistent toggle in LessonPlayer
    await page.goto("/learn/l01-counting-1-5");
    const readBtn = page.getByTestId("audio-read-btn");
    const audioToggle = page.locator('[data-testid="audio-toggle"]:visible');
    await expect(readBtn).toBeVisible();
    await expect(audioToggle).toHaveAttribute("aria-pressed", "true");
    await readBtn.click();
    await expectNoWcag22Violations(page);

    // Toggle audio off and verify read button disables & persists across reload
    await audioToggle.click();
    await expect(audioToggle).toHaveAttribute("aria-pressed", "false");
    await expect(readBtn).toBeDisabled();
    await page.reload();
    await expect(
      page.locator('[data-testid="audio-toggle"]:visible')
    ).toHaveAttribute("aria-pressed", "false");
    // Re-enable audio
    await page.locator('[data-testid="audio-toggle"]:visible').click();
    await expect(
      page.locator('[data-testid="audio-toggle"]:visible')
    ).toHaveAttribute("aria-pressed", "true");

    // 2. Daily Visual Puzzle (/daily) renders decoupled puzzle with WCAG 2.2 AA & >=56px targets
    await page.goto("/daily");
    await expect(page.getByTestId("daily-prompt")).toBeVisible();
    await expect(page.getByTestId("audio-read-btn")).toBeVisible();
    await expectAllManipulativeTargetsAtLeast56px(page);
    await expectNoWcag22Violations(page);

    // Reveal a hint calmly on /daily
    await page.getByTestId("daily-hint-btn").click();
    await expect(page.getByTestId("daily-hint-drawer")).toBeVisible();

    // 3. Automated Leitner due-review queue (/review) surfaces overdue lessons from IndexedDB
    await page.goto("/learn");
    await expect(page.getByTestId("daily-puzzle-card")).toBeVisible();
    await expect(page.getByTestId("review-queue-card")).toBeVisible();

    // Seed a guest profile + overdue lesson in IndexedDB
    await page.evaluate(async () => {
      const profileId = "review-test-student";
      window.localStorage.setItem("konleuh-kanit:active-profile-id", profileId);
      await new Promise<void>((resolve, reject) => {
        const req = window.indexedDB.open("konleuh-kanit-db", 1);
        req.onerror = () => reject(req.error);
        req.onsuccess = () => {
          const db = req.result;
          const tx = db.transaction(["profiles", "progress"], "readwrite");
          tx.objectStore("profiles").put({
            id: profileId,
            displayName: "សុខា",
            avatarId: "lotus",
            ageYears: 7,
            gradeLevel: 1,
            numeralPreference: "km",
            audioEnabled: true,
            weeklyGoalDays: 3,
            activeDates: ["2026-11-23"],
            totalXp: 40,
            createdAt: "2026-11-20T00:00:00.000Z",
            updatedAt: "2026-11-23T00:00:00.000Z",
          });
          tx.objectStore("progress").put({
            id: `${profileId}:l07-making-ten`,
            studentId: profileId,
            lessonId: "l07-making-ten",
            masteryTier: "familiar",
            leitnerBox: 2,
            nextReviewAt: "2020-01-01T00:00:00.000Z",
            accuracyPct: 85,
            hintsUsed: 1,
            attemptsCount: 1,
            completedStepIds: ["l07-s1-concrete", "l07-s2-iconic-line", "l07-s3-symbolic-explain"],
            completedAt: "2019-12-30T00:00:00.000Z",
            updatedAt: "2019-12-30T00:00:00.000Z",
          });
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        };
      });
    });

    await page.goto("/review");
    await expect(
      page.getByTestId("due-review-item-l07-making-ten")
    ).toBeVisible();
    await expectNoWcag22Violations(page);
  });

  test("Milestone 4: Unrestricted Grades 3-5 Geometry & Decimals paths and PIN/math-gated /parent dashboard (WCAG 2.2 AA)", async ({
    page,
  }) => {
    // 1. Switch paths freely on /learn
    await page.goto("/learn");
    await page.getByTestId("path-tab-geometry-foundations").click();
    await expect(
      page.getByTestId("lesson-card-g02-grid-area-arrays")
    ).toBeVisible();
    await page.getByTestId("path-tab-fractions-and-decimals").click();
    await expect(
      page.getByTestId("lesson-card-f03-comparing-decimals")
    ).toBeVisible();
    await expectNoWcag22Violations(page);

    // 2. Open Grade 5 Decimals lesson (0.5 > 0.35 worked-error-check)
    await page.getByTestId("lesson-card-f03-comparing-decimals").click();
    await expect(page).toHaveURL(/\/learn\/f03-comparing-decimals$/);
    await expectAllManipulativeTargetsAtLeast56px(page);
    await expectNoWcag22Violations(page);

    // 3. Unlock Parent Progress Dashboard with Khmer numerals "៥៦" (7 x 8 = 56)
    await page.goto("/parent");
    await expectNoWcag22Violations(page);
    await page.getByTestId("parent-gate-input").fill("៥៦");
    await page.getByTestId("parent-unlock-btn").click();
    await expect(page.getByTestId("parent-dashboard-content")).toBeVisible();
    await expectNoWcag22Violations(page);
  });

  test("Milestone 5: Authenticated Khmer Admin Content Studio with live validation, ZWSP sanitizer, preview, and publish (WCAG 2.2 AA)", async ({
    page,
  }) => {
    await page.goto("/admin");
    await expectNoWcag22Violations(page);

    // 1. Authenticate with default local studio passcode
    await page.getByTestId("admin-passcode-input").fill("konleuh-admin");
    await page.getByTestId("admin-login-btn").click();
    await expect(page.getByTestId("admin-studio-workspace")).toBeVisible();
    await expect(page.getByTestId("admin-validation-status")).toContainText(
      "Schema ត្រឹមត្រូវ"
    );
    await expect(page.getByTestId("admin-live-preview")).toBeVisible();
    await expectNoWcag22Violations(page);

    // 2. Inject stray U+200B into JSON and verify audit + one-tap sanitizer
    const editor = page.getByTestId("admin-json-editor");
    const original = await editor.inputValue();
    await editor.fill(original.replace('"titleKm": "', '"titleKm": "\u200B'));
    await expect(page.getByTestId("admin-strip-zwsp-btn")).toBeVisible();
    await page.getByTestId("admin-strip-zwsp-btn").click();
    await expect(page.getByTestId("admin-zwsp-status")).toContainText("០");

    // 3. Publish validated lesson via Server Action
    await page.getByTestId("admin-publish-btn").click();
    await expect(page.getByTestId("admin-publish-result")).toBeVisible();
    await expectNoWcag22Violations(page);
  });

  test("Milestone 6: Living Khmer Garden (/garden) and Market Stall + Krama Weaver (/play) at 360x800 (WCAG 2.2 AA)", async ({
    page,
  }) => {
    // 1. Living Khmer Garden (/garden)
    await page.goto("/learn");
    await page.getByTestId("garden-card").click();
    await expect(page).toHaveURL(/\/garden$/);
    await expectAllManipulativeTargetsAtLeast56px(page);
    await expectNoWcag22Violations(page);

    await page.getByTestId("garden-count-mango-btn").click();
    await expect(page.getByTestId("garden-status-message")).toContainText("១");
    await page.getByTestId("garden-hop-frog-btn").click();
    await page.getByTestId("garden-bloom-lotus-btn").click();
    await expectNoWcag22Violations(page);

    // 2. Interactive Play Studio (/play) — Cambodian Market Stall
    await page.goto("/play");
    await expect(page.getByTestId("market-stall-panel")).toBeVisible();
    await expectAllManipulativeTargetsAtLeast56px(page);
    await expectNoWcag22Violations(page);

    // Order 1 asks for 2 mangoes totaling 1,000៛
    await page.getByTestId("market-fruit-inc").click();
    await page.getByTestId("market-fruit-inc").click();
    await page.getByTestId("market-note-500").click();
    await page.getByTestId("market-note-500").click();
    await page.getByTestId("market-serve-btn").click();
    await expect(page.getByTestId("market-feedback")).toContainText("អរគុណ");
    await expect(page.getByTestId("market-next-btn")).toBeVisible();

    // 3. Switch to Krama Pattern Weaver & weave an AB pattern
    await page.getByTestId("play-tab-krama").click();
    await expect(page.getByTestId("krama-weaver-panel")).toBeVisible();
    await expectAllManipulativeTargetsAtLeast56px(page);
    await page.getByTestId("krama-preset-ab").click();
    await page.getByTestId("krama-check-btn").click();
    await expect(page.getByTestId("krama-result-panel")).toContainText("AB");
    await expectNoWcag22Violations(page);

    // 4. Switch to Frog Pond Target Jump (3 -> 10 via +5, +2)
    await page.getByTestId("play-tab-frog").click();
    await expect(page.getByTestId("frog-jump-panel")).toBeVisible();
    await expectAllManipulativeTargetsAtLeast56px(page);
    await page.getByTestId("frog-jump-p5").click();
    await page.getByTestId("frog-jump-p2").click();
    await expect(page.getByTestId("frog-win-banner")).toBeVisible();
    await expectNoWcag22Violations(page);

    // 5. Switch to Mystery Balance Scale (? + 3 = 8 -> stone 5)
    await page.getByTestId("play-tab-scale").click();
    await expect(page.getByTestId("mystery-scale-panel")).toBeVisible();
    await expectAllManipulativeTargetsAtLeast56px(page);
    await page.getByTestId("scale-stone-5").click();
    await expect(page.getByTestId("scale-win-banner")).toBeVisible();
    await expectNoWcag22Violations(page);

    // 6. Verify 4th path (Multiplication, Division & Algebra) on /learn
    await page.goto("/learn");
    await page.getByTestId("path-tab-multiplication-and-algebra").click();
    await expect(
      page.getByTestId("lesson-card-m03-balance-scale-algebra")
    ).toBeVisible();
    await expectNoWcag22Violations(page);
  });
});
