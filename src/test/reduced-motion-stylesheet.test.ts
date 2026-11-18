// @vitest-environment node
/**
 * Reduced-motion stylesheet import chain and media query tests (Issue #54)
 *
 * Verifies that:
 * 1. src/styles/reduced-motion.css exists and contains at least one prefers-reduced-motion media query.
 * 2. src/styles/reduced-motion.css is reachable from the global stylesheet import chain
 *    used by src/app/layout.tsx (either imported directly or via @import in globals.css).
 */

import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';

describe('Reduced-motion stylesheet import chain (Issue #54)', () => {
  const rootDir = path.resolve(__dirname, '../../');
  const reducedMotionPath = path.resolve(rootDir, 'src/styles/reduced-motion.css');
  const globalsPath = path.resolve(rootDir, 'src/styles/globals.css');
  const layoutPath = path.resolve(rootDir, 'src/app/layout.tsx');

  it('asserts that reduced-motion.css contains at least one prefers-reduced-motion media query', () => {
    expect(existsSync(reducedMotionPath)).toBe(true);
    const content = readFileSync(reducedMotionPath, 'utf8');
    expect(content).toMatch(/@media[^{]*\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)/i);
  });

  it('asserts that reduced-motion.css is imported in the global stylesheet chain used by layout.tsx', () => {
    expect(existsSync(layoutPath)).toBe(true);
    const layoutContent = readFileSync(layoutPath, 'utf8');

    // layout.tsx imports globals.css or directly imports reduced-motion.css
    const layoutLines = layoutContent.split('\n').filter((l) => !l.trim().startsWith('//'));
    const importsGlobals = layoutLines.some((l) => /import\s+['"][^'"]*globals\.css['"]/.test(l));
    const importsReducedMotionDirect = layoutLines.some((l) => /import\s+['"][^'"]*reduced-motion\.css['"]/.test(l));

    expect(
      importsGlobals || importsReducedMotionDirect,
      'layout.tsx must import globals.css or reduced-motion.css',
    ).toBe(true);

    if (importsGlobals && !importsReducedMotionDirect) {
      expect(existsSync(globalsPath)).toBe(true);
      const globalsContent = readFileSync(globalsPath, 'utf8');
      const activeImports = globalsContent
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => !l.startsWith('/*') && !l.startsWith('*') && !l.startsWith('//'));
      const hasActiveImport = activeImports.some((l) =>
        /@import\s+['"][^'"]*reduced-motion\.css['"]/.test(l),
      );
      expect(hasActiveImport, 'globals.css must actively @import reduced-motion.css').toBe(true);
    }
  });
});
