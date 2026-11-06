import type { Metadata } from 'next';
import SearchPageClient from './SearchPageClient';
import { buildPaginatedMetadata } from '@/lib/seo';

type PageProps = {
  searchParams: { page?: string; q?: string };
};

export async function generateMetadata({
  searchParams,
}: PageProps): Promise<Metadata> {
  const pageParam = searchParams.page;
  const currentPage = pageParam ? Number.parseInt(pageParam, 10) : 1;
  const query = searchParams.q || '';
  const title = query ? `Search: ${query}` : 'Search Courses';
  const description = query
    ? `Search results for "${query}". Find courses across tailoring, baking, photography, and more.`
    : 'Search for courses across all categories. Learn practical skills from expert instructors.';

  return buildPaginatedMetadata({
    title,
    description,
    basePath: '/search',
    currentPage,
    totalPages: 20,
  });
}

export default function SearchPage() {
  return <SearchPageClient />;
}
