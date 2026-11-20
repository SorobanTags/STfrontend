import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock('@/components/notifications/NotificationDropdown', () => ({
  NotificationDropdown: () => null,
}));

vi.mock('@/lib/api/services', () => ({
  coursesApi: {
    getCategories: vi.fn(),
    list: vi.fn(),
  },
}));

import { Header } from './Header';
import { coursesApi } from '@/lib/api/services';
import { CATEGORY_META } from '@/components/category/CategoryHero';

describe('Header category mega-menu', () => {
  const unhandled = vi.fn();

  beforeEach(() => {
    vi.mocked(coursesApi.list).mockResolvedValue({ data: [] } as never);
    process.on('unhandledRejection', unhandled);
  });

  afterEach(() => {
    process.off('unhandledRejection', unhandled);
    vi.restoreAllMocks();
    unhandled.mockClear();
  });

  it('keeps the static categories and logs once when getCategories rejects', async () => {
    const failure = new Error('backend down');
    vi.mocked(coursesApi.getCategories).mockRejectedValue(failure);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    render(<Header />);
    await waitFor(() => expect(warn).toHaveBeenCalledTimes(1));
    expect(warn.mock.calls[0]).toContain(failure);

    fireEvent.click(screen.getAllByRole('button', { name: /categories/i })[0]);

    const [firstSlug] = Object.keys(CATEGORY_META);
    const options = document.querySelectorAll('[data-category-option]');
    expect(options.length).toBeGreaterThan(0);
    expect(screen.getAllByText(CATEGORY_META[firstSlug].name).length).toBeGreaterThan(0);

    // Let any stray rejection surface before asserting.
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(unhandled).not.toHaveBeenCalled();
  });
});
