import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { QuickStats, type Stats } from './QuickStats';

describe('QuickStats', () => {
  it('renders an empty-state message when stats is empty', () => {
    render(<QuickStats stats={[]} />);
    expect(screen.getByText('No statistics available yet.')).toBeInTheDocument();
  });

  it('renders an empty-state message when stats prop is omitted', () => {
    render(<QuickStats />);
    expect(screen.getByText('No statistics available yet.')).toBeInTheDocument();
  });

  it('renders stats with duplicate labels and different ids without duplicate key warnings', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error');
    const duplicateLabelStats: Stats[] = [
      { id: 'courses-enrolled', label: 'Courses', value: 5 },
      { id: 'courses-completed', label: 'Courses', value: 2 },
    ];

    render(<QuickStats stats={duplicateLabelStats} />);

    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(consoleErrorSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('Each child in a list should have a unique "key" prop'),
    );
    consoleErrorSpy.mockRestore();
  });

  it('adapts grid column classes based on the number of stats', () => {
    const oneStat: Stats[] = [{ id: '1', label: 'Courses', value: 1 }];
    const { container: container1, unmount: unmount1 } = render(<QuickStats stats={oneStat} />);
    expect(container1.firstChild).toHaveClass('grid-cols-1');
    unmount1();

    const twoStats: Stats[] = [
      { id: '1', label: 'Courses', value: 1 },
      { id: '2', label: 'Hours', value: 2 },
    ];
    const { container: container2, unmount: unmount2 } = render(<QuickStats stats={twoStats} />);
    expect(container2.firstChild).toHaveClass('grid-cols-1', 'sm:grid-cols-2');
    unmount2();

    const threeStats: Stats[] = [
      { id: '1', label: 'Courses', value: 1 },
      { id: '2', label: 'Hours', value: 2 },
      { id: '3', label: 'Certificates', value: 3 },
    ];
    const { container: container3 } = render(<QuickStats stats={threeStats} />);
    expect(container3.firstChild).toHaveClass('grid-cols-1', 'sm:grid-cols-3');
  });
});
