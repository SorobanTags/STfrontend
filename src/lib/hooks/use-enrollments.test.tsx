import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/api/services', () => ({
  enrollmentsApi: { create: vi.fn(), getMy: vi.fn() },
  usersApi: { getInstructorStats: vi.fn(), updateMe: vi.fn(), getMe: vi.fn() },
}));

import { enrollmentsApi, usersApi } from '@/lib/api/services';
import {
  INSTRUCTOR_STATS_QUERY_KEY,
  useCreateEnrollment,
  useInstructorStats,
  useUpdateUser,
} from './use-enrollments';

function setup() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { queryClient, wrapper };
}

describe('instructor stats invalidation (#121)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('keys useInstructorStats by the shared constant', async () => {
    vi.mocked(usersApi.getInstructorStats).mockResolvedValue({ totalStudents: 1 } as never);
    const { queryClient, wrapper } = setup();
    const { result } = renderHook(() => useInstructorStats(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(queryClient.getQueryData([...INSTRUCTOR_STATS_QUERY_KEY])).toEqual({ totalStudents: 1 });
  });

  it('refetches the stats after a successful enrollment', async () => {
    vi.mocked(usersApi.getInstructorStats)
      .mockResolvedValueOnce({ totalStudents: 1 } as never)
      .mockResolvedValueOnce({ totalStudents: 2 } as never);
    vi.mocked(enrollmentsApi.create).mockResolvedValue({ courseId: 'c1' } as never);
    const { wrapper } = setup();

    const { result } = renderHook(() => ({ stats: useInstructorStats(), enroll: useCreateEnrollment() }), {
      wrapper,
    });
    await waitFor(() => expect(result.current.stats.data).toEqual({ totalStudents: 1 }));

    await act(() => result.current.enroll.mutateAsync({ courseId: 'c1', txHash: 'tx', amountPaid: 10 }));

    // Still well inside the 2-minute staleTime, so only the invalidation refetches.
    await waitFor(() => expect(result.current.stats.data).toEqual({ totalStudents: 2 }));
    expect(usersApi.getInstructorStats).toHaveBeenCalledTimes(2);
  });

  it('does not refetch the stats when the enrollment fails', async () => {
    vi.mocked(usersApi.getInstructorStats).mockResolvedValue({ totalStudents: 1 } as never);
    vi.mocked(enrollmentsApi.create).mockRejectedValue(new Error('payment not found'));
    const { wrapper } = setup();
    const { result } = renderHook(() => ({ stats: useInstructorStats(), enroll: useCreateEnrollment() }), {
      wrapper,
    });
    await waitFor(() => expect(result.current.stats.isSuccess).toBe(true));

    await act(() => result.current.enroll.mutateAsync({ courseId: 'c1', txHash: 'tx', amountPaid: 10 }).catch(() => {}));
    expect(usersApi.getInstructorStats).toHaveBeenCalledTimes(1);
  });

  it('invalidates the stats explicitly after a profile update', async () => {
    vi.mocked(usersApi.updateMe).mockResolvedValue({} as never);
    const { queryClient, wrapper } = setup();
    const spy = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useUpdateUser(), { wrapper });

    await act(() => result.current.mutateAsync({ name: 'Ada' }));
    expect(spy).toHaveBeenCalledWith({ queryKey: INSTRUCTOR_STATS_QUERY_KEY });
  });
});
