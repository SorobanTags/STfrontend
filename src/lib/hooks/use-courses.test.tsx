import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import {
  useCourses,
  useCourseCategories,
  usePendingCourses,
} from './use-courses';
import { coursesApi } from '@/lib/api/services';
import type { Category, Course, PaginatedResponse } from '@/types';

vi.mock('@/lib/api/services', () => ({
  coursesApi: {
    list: vi.fn(),
    getCategories: vi.fn(),
    getPending: vi.fn(),
  },
}));

const mockedCoursesApi = vi.mocked(coursesApi);

const makeCourse = (id: string): Course =>
  ({
    id,
    title: `Course ${id}`,
    description: 'Description',
    category: 'Development',
    level: 'BEGINNER',
    price: 0,
    instructorId: 'instructor-1',
    createdAt: '2024-01-01T00:00:00Z',
  }) as unknown as Course;

const makePage = (courses: Course[]): PaginatedResponse<Course> => ({
  data: courses,
  meta: {
    total: courses.length,
    page: 1,
    limit: 10,
    totalPages: 1,
  },
});

const createWrapper = (queryClient: QueryClient) => {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  Wrapper.displayName = 'QueryClientWrapper';
  return Wrapper;
};

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
    },
  });

describe('use-courses hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useCourses', () => {
    it('calls coursesApi.list with the given options', async () => {
      const page = makePage([makeCourse('1')]);
      mockedCoursesApi.list.mockResolvedValue(page);
      const queryClient = createQueryClient();
      const options = { category: 'Development', page: 1, limit: 10 };

      const { result } = renderHook(() => useCourses(options), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockedCoursesApi.list).toHaveBeenCalledTimes(1);
      expect(mockedCoursesApi.list).toHaveBeenCalledWith(options);
      expect(result.current.data).toEqual(page);
    });

    it('uses the ["courses", options] cache key and shares it for equal options', async () => {
      mockedCoursesApi.list.mockResolvedValue(makePage([makeCourse('1')]));
      const queryClient = createQueryClient();
      const wrapper = createWrapper(queryClient);

      const first = renderHook(
        () => useCourses({ category: 'Development', page: 1 }),
        { wrapper },
      );
      await waitFor(() => expect(first.result.current.isSuccess).toBe(true));

      const second = renderHook(
        () => useCourses({ category: 'Development', page: 1 }),
        { wrapper },
      );
      await waitFor(() => expect(second.result.current.isSuccess).toBe(true));

      expect(mockedCoursesApi.list).toHaveBeenCalledTimes(1);
      expect(
        queryClient.getQueryData(['courses', { category: 'Development', page: 1 }]),
      ).toBeDefined();
    });

    it('configures a 2 minute staleTime', async () => {
      mockedCoursesApi.list.mockResolvedValue(makePage([]));
      const queryClient = createQueryClient();

      const { result } = renderHook(() => useCourses(), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      const query = queryClient.getQueryCache().find({ queryKey: ['courses', undefined] });
      expect(query?.options.staleTime).toBe(1000 * 60 * 2);
    });
  });

  describe('useCourseCategories', () => {
    it('calls coursesApi.getCategories', async () => {
      const categories: Category[] = [{ name: 'Development', count: 3 }];
      mockedCoursesApi.getCategories.mockResolvedValue(categories);
      const queryClient = createQueryClient();

      const { result } = renderHook(() => useCourseCategories(), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockedCoursesApi.getCategories).toHaveBeenCalledTimes(1);
      expect(result.current.data).toEqual(categories);
      expect(
        queryClient.getQueryData(['courses', 'categories']),
      ).toEqual(categories);
    });
  });

  describe('usePendingCourses', () => {
    it('calls coursesApi.getPending', async () => {
      const page = makePage([makeCourse('2')]);
      mockedCoursesApi.getPending.mockResolvedValue(page);
      const queryClient = createQueryClient();

      const { result } = renderHook(() => usePendingCourses(), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockedCoursesApi.getPending).toHaveBeenCalledTimes(1);
      expect(result.current.data).toEqual(page);
      expect(queryClient.getQueryData(['courses', 'pending'])).toEqual(page);
    });
  });
});
