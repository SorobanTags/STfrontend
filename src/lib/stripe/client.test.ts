import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { loadStripe } = vi.hoisted(() => ({ loadStripe: vi.fn() }));

vi.mock('@stripe/stripe-js', () => ({ loadStripe }));

const stripeInstance = { id: 'stripe-instance' };

/** The module reads the key at import time, so each case re-imports it fresh. */
const importClient = async () => {
  vi.resetModules();
  return import('./client');
};

describe('stripe client', () => {
  beforeEach(() => {
    loadStripe.mockReset();
    loadStripe.mockResolvedValue(stripeInstance);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('reports unconfigured and resolves null when the key is empty', async () => {
    vi.stubEnv('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', '');
    const { getStripe, isStripeConfigured } = await importClient();

    expect(isStripeConfigured()).toBe(false);
    await expect(getStripe()).resolves.toBeNull();
    expect(loadStripe).not.toHaveBeenCalled();
  });

  it('reports configured and resolves the Stripe instance when a key is set', async () => {
    vi.stubEnv('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', 'pk_test_123');
    const { getStripe, isStripeConfigured } = await importClient();

    expect(isStripeConfigured()).toBe(true);
    await expect(getStripe()).resolves.toBe(stripeInstance);
    expect(loadStripe).toHaveBeenCalledWith('pk_test_123');
  });

  it('memoises loadStripe across calls', async () => {
    vi.stubEnv('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', 'pk_test_123');
    const { getStripe } = await importClient();

    const first = getStripe();
    const second = getStripe();

    expect(first).toBe(second);
    await expect(first).resolves.toBe(stripeInstance);
    expect(loadStripe).toHaveBeenCalledTimes(1);
  });
});
