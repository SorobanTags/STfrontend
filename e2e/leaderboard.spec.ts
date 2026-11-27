import { test, expect } from '@playwright/test';

test.describe('Leaderboard page', () => {
  test('renders tablist with three tabs and This Week selected', async ({ page }) => {
    await page.goto('/leaderboard');

    await expect(page.getByRole('tablist')).toBeVisible();

    const thisWeek = page.getByRole('tab', { name: 'This Week' });
    const thisMonth = page.getByRole('tab', { name: 'This Month' });
    const allTime = page.getByRole('tab', { name: 'All Time' });

    await expect(thisWeek).toBeVisible();
    await expect(thisMonth).toBeVisible();
    await expect(allTime).toBeVisible();

    await expect(thisWeek).toHaveAttribute('aria-selected', 'true');
    await expect(thisMonth).toHaveAttribute('aria-selected', 'false');
    await expect(allTime).toHaveAttribute('aria-selected', 'false');
  });

  test('switching tabs updates aria-selected and requests the new period', async ({ page }) => {
    await page.goto('/leaderboard');

    const thisWeek = page.getByRole('tab', { name: 'This Week' });
    const thisMonth = page.getByRole('tab', { name: 'This Month' });

    await expect(thisWeek).toHaveAttribute('aria-selected', 'true');

    const monthRequest = page.waitForRequest(
      (req) => req.url().includes('/api/leaderboard') && req.url().includes('period=month'),
    );

    await thisMonth.click();

    await monthRequest;

    await expect(thisMonth).toHaveAttribute('aria-selected', 'true');
    await expect(thisWeek).toHaveAttribute('aria-selected', 'false');
  });

  test('shows loading spinner during fetch', async ({ page }) => {
    let releaseRequest: () => void = () => {};
    const requestGate = new Promise<void>((resolve) => {
      releaseRequest = resolve;
    });

    await page.route('**/api/leaderboard**', async (route) => {
      await requestGate;
      await route.continue();
    });

    await page.goto('/leaderboard');

    await expect(page.getByLabel('Loading leaderboard')).toBeVisible();

    releaseRequest();

    await expect(page.getByLabel('Loading leaderboard')).toBeHidden();
  });

  test('error state shows Retry and retry re-requests the same period', async ({ page }) => {
    let leaderboardCalls = 0;
    const requestedUrls: string[] = [];

    await page.route('**/api/leaderboard**', async (route) => {
      leaderboardCalls += 1;
      requestedUrls.push(route.request().url());

      if (leaderboardCalls === 1) {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal Server Error' }),
        });
        return;
      }

      await route.continue();
    });

    await page.goto('/leaderboard');

    const retryButton = page.getByRole('button', { name: 'Retry' });
    await expect(retryButton).toBeVisible();

    const retryRequest = page.waitForRequest(
      (req) => req.url().includes('/api/leaderboard') && req.url().includes('period=week'),
    );

    await retryButton.click();

    await retryRequest;

    await expect(page.getByRole('table')).toBeVisible();
    await expect(retryButton).toBeHidden();

    expect(leaderboardCalls).toBeGreaterThanOrEqual(2);
    expect(requestedUrls[0]).toContain('period=week');
    expect(requestedUrls[1]).toContain('period=week');
  });
});
