import { describe, expect, it } from 'vitest';
import { absoluteUrl, buildMetadata, buildPaginatedMetadata } from '@/lib/seo';

describe('absoluteUrl', () => {
  it('adds a leading slash when missing', () => {
    expect(absoluteUrl('courses')).toBe(absoluteUrl('/courses'));
  });
});

describe('buildMetadata', () => {
  it('sets the canonical to the absolute URL of the path', () => {
    const metadata = buildMetadata({ path: '/courses' });

    expect(metadata.alternates?.canonical).toBe(absoluteUrl('/courses'));
    expect(metadata.openGraph?.url).toBe(absoluteUrl('/courses'));
  });

  it('does not emit robots by default', () => {
    expect(buildMetadata({ path: '/courses' })).not.toHaveProperty('robots');
  });

  it('emits noindex, follow when noIndex is true', () => {
    const metadata = buildMetadata({ path: '/courses', noIndex: true });

    expect(metadata.robots).toEqual({ index: false, follow: true });
  });

  it('spells out the full social title when a title is provided', () => {
    const metadata = buildMetadata({ path: '/pricing', title: 'Pricing' });

    expect(metadata.title).toBe('Pricing');
    expect(metadata.openGraph?.title).toBe('Pricing | SorobanLard');
  });
});

describe('buildPaginatedMetadata', () => {
  it.each([1, 2, 3, 5])('points the canonical at the base path on page %i', (currentPage) => {
    const metadata = buildPaginatedMetadata({ basePath: '/courses', currentPage, totalPages: 5 });

    expect(metadata.alternates?.canonical).toBe(absoluteUrl('/courses'));
    expect(metadata.openGraph?.url).toBe(absoluteUrl('/courses'));
  });
});
