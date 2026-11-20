import { describe, expect, it, vi } from 'vitest';

vi.mock('../SearchPageClient', () => ({ default: () => null }));

import { generateMetadata } from '../page';

describe('search page generateMetadata', () => {
  it('uses the query-specific title when q is set', async () => {
    const metadata = await generateMetadata({ searchParams: { q: 'tailoring', page: '2' } });

    expect(metadata.title).toBe('Search: tailoring');
    expect(metadata.description).toContain('Search results for "tailoring"');
  });

  it('uses the default title when q is absent', async () => {
    const metadata = await generateMetadata({ searchParams: {} });

    expect(metadata.title).toBe('Search Courses');
    expect(metadata.description).toContain('Search for courses across all categories');
  });

  it('keeps the canonical on /search for page 2 (canonical always points to page 1)', async () => {
    const page1 = await generateMetadata({ searchParams: { q: 'tailoring' } });
    const page2 = await generateMetadata({ searchParams: { q: 'tailoring', page: '2' } });

    expect(page2.alternates?.canonical).toMatch(/\/search$/);
    expect(page2.alternates?.canonical).not.toContain('page=');
    expect(page2.alternates?.canonical).toBe(page1.alternates?.canonical);
  });

  it('does not throw on a malformed page param', async () => {
    const metadata = await generateMetadata({ searchParams: { q: 'baking', page: 'abc' } });

    expect(metadata.title).toBe('Search: baking');
    expect(metadata.alternates?.canonical).toMatch(/\/search$/);
  });
});
