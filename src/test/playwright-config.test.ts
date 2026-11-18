// @vitest-environment node
/**
 * Playwright E2E configuration and script project exclusion tests (Issue #53)
 *
 * Verifies that:
 * 1. playwright.config.ts defines a 'visual' project.
 * 2. package.json 'test:e2e' script omits the 'visual' project from standard runs.
 */

import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';
import playwrightConfig from '../../playwright.config';

describe('Playwright E2E configuration contract (Issue #53)', () => {
  const rootDir = path.resolve(__dirname, '../../');
  const pkgPath = path.resolve(rootDir, 'package.json');

  it('asserts that playwright.config.ts defines a visual project', () => {
    expect(playwrightConfig.projects, 'playwright.config.ts projects must be defined').toBeDefined();
    const projects = playwrightConfig.projects || [];
    const hasVisual = projects.some((p: any) => p.name === 'visual');
    expect(hasVisual, "playwright.config.ts must define a project named 'visual'").toBe(true);
  });

  it('asserts that package.json test:e2e script excludes the visual project', () => {
    expect(existsSync(pkgPath)).toBe(true);
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
    const testE2eScript = pkg.scripts?.['test:e2e'] || '';

    expect(testE2eScript, 'package.json must declare test:e2e script').toBeTruthy();
    expect(
      testE2eScript,
      "test:e2e script must not include '--project=visual'",
    ).not.toMatch(/--project=visual\b/);
  });
});
