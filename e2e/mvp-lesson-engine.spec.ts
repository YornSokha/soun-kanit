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
});
