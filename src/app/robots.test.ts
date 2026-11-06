import { describe, expect, it } from 'vitest';
import robots from './robots';

describe('robots metadata route', () => {
  it('allows the public site routes and disallows private application routes', () => {
    const metadata = robots();
    const rule = metadata.rules[0];

    expect(rule).toMatchObject({
      userAgent: '*',
      allow: expect.arrayContaining([
        '/',
        '/courses',
        '/courses/*',
        '/categories/*',
        '/about',
        '/teach',
        '/teams',
      ]),
      disallow: expect.arrayContaining([
        '/dashboard',
        '/dashboard/*',
        '/checkout',
        '/checkout/*',
        '/api',
        '/api/*',
        '/auth',
        '/auth/*',
        '/_next/',
      ]),
    });
  });

  it('advertises the absolute sitemap URL', () => {
    expect(robots().sitemap).toBe('https://sorobanlard.com/sitemap.xml');
  });
});
