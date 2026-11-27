import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./CourseBrowseClient', () => ({ default: () => null }));
vi.mock('@/lib/api/services', () => ({ coursesApi: { list: vi.fn() } }));

import { coursesApi } from '@/lib/api/services';
import { absoluteUrl } from '@/lib/seo';
import { generateMetadata } from './page';
import { COURSES_PAGE_SIZE } from './constants';

type Link = { rel: string; url: string };

function links(metadata: Awaited<ReturnType<typeof generateMetadata>>) {
  const other = (metadata.icons as { other?: Link | Link[] } | undefined)?.other;
  const list = other ? (Array.isArray(other) ? other : [other]) : [];
  return Object.fromEntries(list.map((l) => [l.rel, l.url]));
}

function catalogue(total: number) {
  vi.mocked(coursesApi.list).mockResolvedValue({
    data: [],
    meta: { total, page: 1, limit: COURSES_PAGE_SIZE, totalPages: Math.ceil(total / COURSES_PAGE_SIZE) },
  } as never);
}

describe('/courses generateMetadata (#95)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('page 1 of 3: canonical page 1, next only', async () => {
    catalogue(COURSES_PAGE_SIZE * 3);
    const md = await generateMetadata({ searchParams: {} });
    expect(md.alternates?.canonical).toBe(absoluteUrl('/courses'));
    expect(links(md)).toEqual({ next: absoluteUrl('/courses?page=2') });
    expect(coursesApi.list).toHaveBeenCalledWith({ page: 1, limit: COURSES_PAGE_SIZE });
  });

  it('page 2 of 3: prev to the bare path, next to page 3', async () => {
    catalogue(COURSES_PAGE_SIZE * 3);
    const md = await generateMetadata({ searchParams: { page: '2' } });
    expect(links(md)).toEqual({ prev: absoluteUrl('/courses'), next: absoluteUrl('/courses?page=3') });
  });

  it('the last page has no next link', async () => {
    catalogue(COURSES_PAGE_SIZE * 2 + 1); // 3 pages
    const md = await generateMetadata({ searchParams: { page: '3' } });
    expect(links(md)).toEqual({ prev: absoluteUrl('/courses?page=2') });
  });

  it('a single page has neither link', async () => {
    catalogue(5);
    const md = await generateMetadata({ searchParams: {} });
    expect(links(md)).toEqual({});
  });

  it('a page past the end points back to the real last page, never beyond', async () => {
    catalogue(COURSES_PAGE_SIZE * 2);
    const md = await generateMetadata({ searchParams: { page: '9' } });
    expect(links(md)).toEqual({ prev: absoluteUrl('/courses') });
  });

  it('without the catalogue, treats the requested page as the last known one', async () => {
    vi.mocked(coursesApi.list).mockRejectedValue(new Error('offline'));
    const md = await generateMetadata({ searchParams: { page: '2' } });
    expect(links(md)).toEqual({ prev: absoluteUrl('/courses') });
  });

  it('keeps the favicon the layout would otherwise provide', async () => {
    catalogue(COURSES_PAGE_SIZE * 3);
    const md = await generateMetadata({ searchParams: {} });
    expect((md.icons as { icon?: string }).icon).toBe('/favicon.svg');
  });

  describe('page parameter edge cases (#91)', () => {
    it('page 2 has its own canonical and a prev link', async () => {
      catalogue(COURSES_PAGE_SIZE * 3);
      const md = await generateMetadata({ searchParams: { page: '2' } });
      expect(md.alternates?.canonical).toBe(absoluteUrl('/courses?page=2'));
      expect(links(md).prev).toBe(absoluteUrl('/courses'));
    });

    it.each(['abc', '0', '-3'])('page %p falls back to page 1, identical to no param', async (page) => {
      catalogue(COURSES_PAGE_SIZE * 3);
      const baseline = await generateMetadata({ searchParams: {} });
      const md = await generateMetadata({ searchParams: { page } });
      expect(md.alternates?.canonical).toBe(absoluteUrl('/courses'));
      expect(md).toEqual(baseline);
    });
  });
});
