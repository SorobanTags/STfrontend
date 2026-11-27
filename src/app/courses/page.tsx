import type { Metadata } from 'next';
import CourseBrowseClient from './CourseBrowseClient';
import { COURSES_PAGE_SIZE } from './constants';
import { coursesApi } from '@/lib/api/services';
import { buildPaginatedMetadata } from '@/lib/seo';

type PageProps = {
  searchParams: { page?: string };
};

/**
 * The real number of catalogue pages, from the same list endpoint and page
 * size the browse client uses (#95). If the catalogue can't be reached,
 * returns null and the caller treats the requested page as the last known
 * one, so no next link or page beyond it is advertised.
 */
async function fetchTotalPages(): Promise<number | null> {
  try {
    const { meta } = await coursesApi.list({ page: 1, limit: COURSES_PAGE_SIZE });
    const pages = meta.totalPages || Math.ceil(meta.total / COURSES_PAGE_SIZE);
    return Math.max(1, pages || 1);
  } catch {
    return null;
  }
}

export async function generateMetadata({
  searchParams,
}: PageProps): Promise<Metadata> {
  const pageParam = searchParams.page;
  const parsed = pageParam ? Number.parseInt(pageParam, 10) : 1;
  const currentPage = Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
  const totalPages = (await fetchTotalPages()) ?? currentPage;

  return buildPaginatedMetadata({
    title: 'Browse Courses',
    description:
      'Discover skills from expert instructors across Africa and beyond. Learn tailoring, makeup, baking, photography, hairstyling, and more.',
    basePath: '/courses',
    currentPage,
    totalPages,
    canonicalPerPage: true,
  });
}

export default function CoursesPage() {
  return <CourseBrowseClient />;
}
