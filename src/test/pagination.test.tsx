import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { Pagination } from '@/components/ui/Pagination';

const mockPush = vi.fn();
const mockGet = vi.fn((_key: string) => null);
const mockSearchParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/courses',
  useSearchParams: () => {
    const params = new URLSearchParams(mockSearchParams.toString());
    params.get = mockGet;
    return params;
  },
}));

describe('Pagination Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockImplementation((_key: string) => null);
    mockSearchParams.forEach((_value, key) => mockSearchParams.delete(key));
  });

  it('renders page numbers correctly for small total counts', () => {
    render(<Pagination currentPage={1} totalPages={5} updateUrl={false} />);
    expect(screen.getByRole('button', { name: 'Page 1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Page 5' })).toBeInTheDocument();
    expect(screen.queryByText('…')).not.toBeInTheDocument();
  });

  it('shows ellipsis for large page ranges', () => {
    render(<Pagination currentPage={5} totalPages={10} updateUrl={false} />);
    expect(screen.getByRole('button', { name: 'Page 1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Page 5' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Page 10' })).toBeInTheDocument();
    const ellipsisElements = screen.getAllByText('…');
    expect(ellipsisElements.length).toBeGreaterThan(0);
  });

  it('disables Previous button at start boundary', () => {
    render(<Pagination currentPage={1} totalPages={5} updateUrl={false} />);
    const prevButton = screen.getByRole('button', { name: /previous page/i });
    const nextButton = screen.getByRole('button', { name: /next page/i });
    expect(prevButton).toBeDisabled();
    expect(nextButton).not.toBeDisabled();
  });

  it('disables Next button at end boundary', () => {
    render(<Pagination currentPage={5} totalPages={5} updateUrl={false} />);
    const prevButton = screen.getByRole('button', { name: /previous page/i });
    const nextButton = screen.getByRole('button', { name: /next page/i });
    expect(prevButton).not.toBeDisabled();
    expect(nextButton).toBeDisabled();
  });

  it('applies aria-current and #7F77DD background styling to current page', () => {
    render(<Pagination currentPage={3} totalPages={5} updateUrl={false} />);
    const activeBtn = screen.getByRole('button', { name: 'Page 3' });
    expect(activeBtn).toHaveAttribute('aria-current', 'page');
    expect(activeBtn.className).toContain('bg-[#7F77DD]');
  });

  it('calculates totalPages from totalItems and itemsPerPage when totalPages is omitted', () => {
    render(<Pagination currentPage={1} totalItems={45} itemsPerPage={10} updateUrl={false} />);
    expect(screen.getByRole('button', { name: 'Page 5' })).toBeInTheDocument();
  });

  it('triggers onPageChange and updates URL search params when page button is clicked', () => {
    const handlePageChange = vi.fn();
    render(<Pagination currentPage={1} totalPages={5} onPageChange={handlePageChange} paramName="page" />);

    const page2Btn = screen.getByRole('button', { name: 'Page 2' });
    fireEvent.click(page2Btn);

    expect(handlePageChange).toHaveBeenCalledWith(2);
    expect(mockPush).toHaveBeenCalledWith('/courses?page=2', { scroll: false });
  });

  it('does not call router.push when updateUrl is false', () => {
    const handlePageChange = vi.fn();
    render(
      <Pagination currentPage={1} totalPages={5} onPageChange={handlePageChange} updateUrl={false} />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Page 2' }));

    expect(handlePageChange).toHaveBeenCalledWith(2);
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('preserves existing search params in the pushed URL', () => {
    mockSearchParams.set('q', 'react');
    mockGet.mockImplementation((key: string) => mockSearchParams.get(key));

    render(<Pagination currentPage={1} totalPages={5} />);

    fireEvent.click(screen.getByRole('button', { name: 'Page 2' }));

    expect(mockPush).toHaveBeenCalledTimes(1);
    const pushedUrl = mockPush.mock.calls[0][0] as string;
    const pushedParams = new URLSearchParams(pushedUrl.split('?')[1]);
    expect(pushedParams.get('q')).toBe('react');
    expect(pushedParams.get('page')).toBe('2');
  });

  it('uses a custom paramName in the pushed URL', () => {
    render(<Pagination currentPage={1} totalPages={5} paramName="p" />);

    fireEvent.click(screen.getByRole('button', { name: 'Page 2' }));

    expect(mockPush).toHaveBeenCalledWith('/courses?p=2', { scroll: false });
  });

  it('hides itself (renders null) when there is only one page of results (totalPages <= 1)', () => {
    const { container } = render(<Pagination currentPage={1} totalPages={1} updateUrl={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('hides itself (renders null) when totalItems fits on a single page (totalItems <= itemsPerPage)', () => {
    const { container } = render(
      <Pagination currentPage={1} totalItems={7} itemsPerPage={10} updateUrl={false} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('hides itself (renders null) when totalPages is 0 or totalItems is 0', () => {
    const { container: c1 } = render(<Pagination currentPage={1} totalPages={0} updateUrl={false} />);
    expect(c1.firstChild).toBeNull();

    const { container: c2 } = render(
      <Pagination currentPage={1} totalItems={0} itemsPerPage={10} updateUrl={false} />,
    );
    expect(c2.firstChild).toBeNull();
  });
});
