import { expect, test } from '@playwright/test';

// #127: the notifications feed against e2e/mock-api-server.mjs, which seeds
// 3 unread notifications and 1 read one.
const MOCK_API = 'http://127.0.0.1:3000';

test.describe('Notifications', () => {
  test.beforeEach(async ({ page, request }) => {
    await request.post(`${MOCK_API}/__test__/notifications/reset`);
    await page.addInitScript(() => {
      window.localStorage.setItem('sorobanlard_token', 'notifications-e2e-token');
      window.localStorage.setItem('sorobanlard_address', 'GTESTSTUDENT');
      window.localStorage.setItem('cookie-consent', 'accepted');
    });
  });

  test('loads the feed, marks one read, then marks all read', async ({ page }) => {
    await page.goto('/notifications');

    const list = page.getByRole('list', { name: 'Notifications' });
    await expect(list.getByRole('listitem')).toHaveCount(4);
    await expect(page.getByText('3 unread')).toBeVisible();

    // Mark one read: the counter decrements and the item flips to "Read".
    const markOne = page.waitForResponse(
      (r) => r.url().endsWith('/notifications/notif-certificate/read') && r.request().method() === 'PATCH',
    );
    await page.getByRole('button', { name: 'Unread notification: Certificate issued' }).click();
    expect((await markOne).ok()).toBe(true);
    await expect(page.getByText('2 unread')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Read notification: Certificate issued' })).toBeVisible();

    // The read state was saved by the API, not only in the page.
    await page.reload();
    await expect(page.getByText('2 unread')).toBeVisible();

    // Mark all read.
    const markAll = page.waitForResponse((r) => r.url().endsWith('/notifications/read-all'));
    await page.getByRole('button', { name: /mark all read/i }).click();
    expect((await markAll).ok()).toBe(true);
    await expect(page.getByText('All caught up')).toBeVisible();
    await expect(page.getByRole('button', { name: /mark all read/i })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /^Unread notification/ })).toHaveCount(0);
  });

  test('clicking an already-read notification sends nothing', async ({ page }) => {
    await page.goto('/notifications');
    await expect(page.getByText('3 unread')).toBeVisible();

    let patched = false;
    page.on('request', (r) => {
      if (r.method() === 'PATCH') patched = true;
    });
    await page.getByRole('button', { name: 'Read notification: Payment received' }).click();
    await expect(page.getByText('3 unread')).toBeVisible();
    expect(patched).toBe(false);
  });
});
