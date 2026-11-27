import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { Course } from '@/types';

const getCourseForMetadata = vi.fn();

vi.mock('@/lib/api/server', () => ({
  getCourseForMetadata: (id: string) => getCourseForMetadata(id),
}));

const course: Course = {
  id: 'course-42',
  instructorAddress: 'GABC',
  title: 'Advanced Tailoring',
  description: 'Master bespoke tailoring techniques.',
  category: 'tailoring',
  level: 'intermediate',
  language: 'en',
  thumbnailUrl: null,
  previewVideoUrl: null,
  price: 0,
  platformFeePercent: 0,
  status: 'ACTIVE',
  totalLessons: 12,
  totalDuration: 3600,
  totalEnrollments: 0,
  totalRevenue: 0,
  txHash: null,
  approvedAt: null,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  instructor: { name: 'Ada Tailor', stellarAddress: 'GABC', avatarUrl: null },
  modules: [],
  _count: { enrollments: 0 },
};

describe('/courses layout metadata', () => {
  it('canonical is /courses', async () => {
    const { metadata } = await import('../layout');
    expect(metadata.alternates?.canonical).toMatch(/\/courses$/);
  });
});

describe('/courses/[id] layout generateMetadata', () => {
  beforeEach(() => {
    getCourseForMetadata.mockReset();
  });

  it('canonical includes the course id', async () => {
    getCourseForMetadata.mockResolvedValue(course);
    const { generateMetadata } = await import('../[id]/layout');

    const metadata = await generateMetadata({ params: { id: 'course-42' } });

    expect(getCourseForMetadata).toHaveBeenCalledWith('course-42');
    expect(String(metadata.alternates?.canonical)).toContain('/courses/course-42');
    expect(metadata.title).toBe(course.title);
  });

  it('falls back to the requested id when the course is missing', async () => {
    getCourseForMetadata.mockResolvedValue(null);
    const { generateMetadata } = await import('../[id]/layout');

    const metadata = await generateMetadata({ params: { id: 'missing-course' } });

    expect(String(metadata.alternates?.canonical)).toContain('/courses/missing-course');
    expect(metadata.title).toBe('Course');
  });
});
