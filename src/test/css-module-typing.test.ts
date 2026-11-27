import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import signupStyles from '@/app/signup/signup.module.css';

const repoRoot = path.resolve(__dirname, '../..');

describe('CSS module typing shim', () => {
  it('resolves a CSS module import to an object', () => {
    expect(signupStyles).toBeTypeOf('object');
    expect(signupStyles).not.toBeNull();
    expect(Array.isArray(signupStyles)).toBe(false);
  });

  it('exposes the class names declared in the stylesheet', () => {
    expect(signupStyles).toHaveProperty('container');
    expect(typeof signupStyles.container).toBe('string');
  });

  it('includes the src/styles/globals.d.ts shim in tsconfig.json', () => {
    const tsconfig = JSON.parse(readFileSync(path.join(repoRoot, 'tsconfig.json'), 'utf8')) as {
      include?: string[];
    };
    const include = tsconfig.include ?? [];

    expect(include).toContain('src/**/*.ts');
    expect(include.some((pattern) => pattern.includes('src/**/*.ts'))).toBe(true);

    const shimPath = path.join(repoRoot, 'src/styles/globals.d.ts');
    expect(readFileSync(shimPath, 'utf8')).toContain("declare module '*.css'");
  });
});
