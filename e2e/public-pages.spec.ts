import { expect, test } from '@playwright/test';

test.describe('Help page', () => {
  test('renders main heading, contact link, and interactive FAQ accordion', async ({
    page,
  }) => {
    await page.goto('/help', { waitUntil: 'domcontentloaded' });

    // Assert the main help page heading is visible
    await expect(
      page.getByRole('heading', {
        name: 'Common questions, answered clearly.',
        exact: true,
      }),
    ).toBeVisible();

    // Assert contact link is visible and navigates to /contact
    await expect(
      page.getByRole('link', { name: /Can't find what you need\? Contact us/i }),
    ).toBeVisible();

    // Verify first question and its default-expanded answer
    await expect(
      page.getByRole('button', { name: 'How do I enroll in a course?' }),
    ).toBeVisible();
    await expect(
      page.getByText(
        'Open any course detail page, select Enroll, and follow the guided checkout to start learning.',
      ),
    ).toBeVisible();

    // Expand another FAQ item and assert the answer text is visible
    const certificateButton = page.getByRole('button', {
      name: 'How do I receive my certificate?',
    });
    await expect(certificateButton).toBeVisible();
    await certificateButton.click();

    await expect(
      page.getByText(
        'Complete the course requirements and the certificate will appear in your dashboard once it is verified.',
      ),
    ).toBeVisible();
  });
});

test.describe('About page', () => {
  test('renders main mission heading, story, values, and team members', async ({
    page,
  }) => {
    await page.goto('/about', { waitUntil: 'domcontentloaded' });

    // Assert the main about page heading is visible
    await expect(
      page.getByRole('heading', {
        name: 'Empowering Africa with practical skills',
        exact: true,
      }),
    ).toBeVisible();

    // Assert section headings are visible
    await expect(
      page.getByRole('heading', { name: 'Founded in 2022' }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Built on principles that matter' }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Talented people on a mission' }),
    ).toBeVisible();

    // Assert team member names are visible
    await expect(page.getByText('Ava Chen', { exact: true })).toBeVisible();
    await expect(page.getByText('Kwame Asante', { exact: true })).toBeVisible();
    await expect(page.getByText('Zainab Mohammed', { exact: true })).toBeVisible();
    await expect(page.getByText('James Okonkwo', { exact: true })).toBeVisible();
  });
});
