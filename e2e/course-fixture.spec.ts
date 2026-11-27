import { courseFixture as test, expect, mockCourses, mockPromoCodes } from './fixtures/course';

const course = mockCourses.reactFundamentals;
const promo = mockPromoCodes.WELCOME20;

test.describe('course fixture helpers', () => {
  test.beforeEach(async ({ page }) => {
    // Same route-mocking pattern as e2e/visual/homepage.spec.ts.
    await page.route('**/api/v1/courses**', async (route) => {
      const allCourses = Object.values(mockCourses);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { courses: allCourses, total: allCourses.length, limit: 10, page: 1 },
        }),
      });
    });
  });

  test('navigateToCourse lands on /courses/<slug>', async ({ page, navigateToCourse }) => {
    await navigateToCourse(course.slug);

    expect(new URL(page.url()).pathname).toBe(`/courses/${course.slug}`);
  });

  test('applyPromoCode fills the promo input and clicks Apply when the input is visible', async ({
    page,
    applyPromoCode,
  }) => {
    await page.setContent(`
      <form onsubmit="event.preventDefault()">
        <input type="text" placeholder="Enter promo code" />
        <button type="button" onclick="document.body.dataset.applied = 'true'">Apply</button>
      </form>
    `);

    await applyPromoCode(promo.code);

    await expect(page.getByPlaceholder(/promo code/i)).toHaveValue(promo.code);
    await expect(page.locator('body')).toHaveAttribute('data-applied', 'true');
  });

  test('applyPromoCode resolves without throwing when the promo input is absent', async ({
    page,
    navigateToCourse,
    applyPromoCode,
  }) => {
    await navigateToCourse(course.slug);
    await expect(page.getByPlaceholder(/promo code/i)).toHaveCount(0);

    await expect(applyPromoCode(promo.code)).resolves.toBeUndefined();
    expect(new URL(page.url()).pathname).toBe(`/courses/${course.slug}`);
  });
});
