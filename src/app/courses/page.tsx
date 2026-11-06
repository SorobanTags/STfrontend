import type { Metadata } from 'next';
import CourseBrowseClient from './CourseBrowseClient';
import { buildPaginatedMetadata } from '@/lib/seo';

type PageProps = {
  searchParams: { page?: string };
};

export async function generateMetadata({
  searchParams,
}: PageProps): Promise<Metadata> {
  const pageParam = searchParams.page;
  const currentPage = pageParam ? Number.parseInt(pageParam, 10) : 1;

  return buildPaginatedMetadata({
    title: 'Browse Courses',
    description:
      'Discover skills from expert instructors across Africa and beyond. Learn tailoring, makeup, baking, photography, hairstyling, and more.',
    basePath: '/courses',
    currentPage,
    totalPages: 50,
  });
}

export default function CoursesPage() {
  return <CourseBrowseClient />;
}
