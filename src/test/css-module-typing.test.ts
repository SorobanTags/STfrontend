import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import styles from '../app/signup/signup.module.css';

const root = path.resolve(__dirname, '../..');

// Patterns that cover src/styles/globals.d.ts.
const SHIM_PATTERNS = [
  'src/styles/globals.d.ts',
  'src/styles/*.d.ts',
  'src/styles/**/*.d.ts',
  'src/**/*.d.ts',
  'src/**/*.ts',
  'src/**/*',
];

describe('CSS module typing shim', () => {
  it('resolves the signup CSS module import to an object', () => {
    expect(styles).toBeDefined();
    expect(typeof styles).toBe('object');
    for (const [key, value] of Object.entries(styles as Record<string, unknown>)) {
      expect(typeof key).toBe('string');
      expect(typeof value).toBe('string');
    }
  });

  it('declares css, scss and sass modules in globals.d.ts', () => {
    const shim = readFileSync(path.join(root, 'src/styles/globals.d.ts'), 'utf8');
    for (const ext of ['css', 'scss', 'sass']) {
      expect(shim).toContain(`declare module '*.${ext}'`);
    }
  });

  it('includes the globals.d.ts shim in tsconfig.json', () => {
    const tsconfig = JSON.parse(readFileSync(path.join(root, 'tsconfig.json'), 'utf8'));
    const include: string[] = tsconfig.include ?? [];
    expect(include.some((entry) => SHIM_PATTERNS.includes(entry))).toBe(true);

    const exclude: string[] = tsconfig.exclude ?? [];
    expect(exclude).not.toContain('src/styles');
    expect(exclude.some((entry) => SHIM_PATTERNS.includes(entry) && entry.endsWith('.d.ts'))).toBe(false);
  });
});
