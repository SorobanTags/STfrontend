import { expect, test } from '@playwright/test';

test.describe('Course details', () => {
  test('shows course information and prompts unauthenticated visitors to sign in', async ({
    page,
  }) => {
    await page.goto('/courses/react-fundamentals', { waitUntil: 'commit' });

    await expect(
      page.getByRole('heading', {
        name: 'React Fundamentals for Beginners',
        exact: true,
      }),
    ).toBeVisible();
    await expect(page.getByText(/Sarah Chen/)).toBeVisible();
    await expect(page.getByText(/\$49\.99/)).toBeVisible();
    await expect(page.getByText(/Web Development/)).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'Sign in to enroll' }),
    ).toHaveAttribute('href', '/auth/login');
  });
});

test.describe('Course listing', () => {
  test('loads and displays available courses', async ({ page }) => {
    await page.route('**/*', async (route) => {
      const { pathname } = new URL(route.request().url());
      const corsHeaders = {
        'access-control-allow-origin': '*',
        'access-control-allow-methods': 'GET, OPTIONS',
        'access-control-allow-headers': 'Content-Type',
      };

      if (
        (pathname === '/api/v1/courses/categories' ||
          pathname === '/api/v1/courses') &&
        route.request().method() === 'OPTIONS'
      ) {
        await route.fulfill({ status: 204, headers: corsHeaders });
        return;
      }

      if (pathname === '/api/v1/courses/categories') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          headers: corsHeaders,
          body: JSON.stringify({
            success: true,
            data: [{ name: 'Web Development', count: 1 }],
          }),
        });
        return;
      }

      if (pathname !== '/api/v1/courses') {
        await route.continue();
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: corsHeaders,
        body: JSON.stringify({
          success: true,
          data: {
            data: [{
              id: 'course-react-fundamentals',
              title: 'React Fundamentals for Beginners',
              slug: 'react-fundamentals',
              description: 'Learn the fundamentals of building interfaces with React.',
              category: 'Web Development',
              level: 'BEGINNER',
              language: 'English',
              thumbnailUrl: null,
              price: 49.99,
              status: 'ACTIVE',
              totalLessons: 12,
              totalDuration: 3600,
              totalEnrollments: 100,
              createdAt: '2026-01-01T00:00:00.000Z',
              instructor: { name: 'Sarah Chen', stellarAddress: 'GTESTINSTRUCTOR' },
            }],
            meta: { total: 1, page: 1, limit: 12, totalPages: 1 },
          },
        }),
      });
    });
    await page.goto('/courses', { waitUntil: 'domcontentloaded' });

    await expect(
      page.getByRole('heading', { name: 'Browse Courses', exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText('React Fundamentals for Beginners', { exact: true }),
    ).toBeVisible();
  });
});

test.describe('Checkout', () => {
  test('shows an empty-cart message and links back to course browsing', async ({
    page,
  }) => {
    await page.goto('/checkout', { waitUntil: 'domcontentloaded' });

    await expect(
      page.getByRole('heading', { name: "There's nothing to pay for" }),
    ).toBeVisible();
    await expect(page.locator('a[href="/courses"]')).toBeVisible();
  });
});

test.describe('Authentication', () => {
  test('redirects unauthenticated visitors from their courses to login', async ({
    page,
  }) => {
    await page.goto('/dashboard/my-courses', { waitUntil: 'domcontentloaded' });

    await expect(page).toHaveURL(/\/login\?callbackUrl=/);
  });
});
