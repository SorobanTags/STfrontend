import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'html',
  snapshotDir: './e2e/screenshots',

  use: {
    baseURL: 'http://localhost:3001',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'visual',
      grep: /@visual/,
      use: {
        ...devices['Desktop Chrome'],
      },
    },
    {
      name: 'chromium',
      grepInvert: /@visual/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      grepInvert: /@visual/,
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      grepInvert: /@visual/,
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile-chrome',
      grepInvert: /@visual/,
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari',
      grepInvert: /@visual/,
      use: { ...devices['iPhone 12'] },
    },
  ],

  webServer: [
    {
      command: 'node e2e/mock-api-server.mjs',
      url: 'http://127.0.0.1:3000/health',
      reuseExistingServer: false,
      timeout: 30000,
    },
    {
      command: 'npm run dev -- --port 3001',
      // The home page depends on live SEO data, so use a stable route as the
      // readiness probe for the local E2E server.
      url: 'http://localhost:3001/login',
      reuseExistingServer: false,
      timeout: 120000,
    },
  ],

  timeout: 30000,
  expect: {
    timeout: 5000,
    toHaveScreenshot: {
      maxDiffPixels: 100,
      animations: 'disabled',
      caret: 'hide',
      scale: 'device',
    },
  },
});
