import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { PricingTiers } from './PricingTiers';

describe('PricingTiers', () => {
  it('exposes the tier grid as a labelled region', () => {
    render(<PricingTiers />);

    expect(
      screen.getByRole('region', { name: /team pricing tiers/i })
    ).toBeInTheDocument();
  });

  it('includes the tier name in each CTA accessible name', () => {
    render(<PricingTiers />);

    expect(
      screen.getByRole('button', { name: /Starter Team/ })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Pro Team/ })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Enterprise/ })
    ).toBeInTheDocument();
  });

  it('announces the popular badge via aria-describedby', () => {
    render(<PricingTiers />);

    const badge = screen.getByText('Most Popular');
    expect(badge).toHaveAttribute('id');

    const popularCard = badge.closest('[aria-describedby]');
    expect(popularCard).not.toBeNull();
    expect(popularCard).toHaveAttribute('aria-describedby', badge.id);
  });

  it('calls onSelectTier with the tier name when a CTA is clicked', async () => {
    const user = userEvent.setup();
    const onSelectTier = vi.fn();
    render(<PricingTiers onSelectTier={onSelectTier} />);

    await user.click(screen.getByRole('button', { name: /Starter Team/ }));

    expect(onSelectTier).toHaveBeenCalledWith('Starter Team');
  });
});
