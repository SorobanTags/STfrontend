import { render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

let captured: ((metric: unknown) => unknown) | undefined;
vi.mock('next/web-vitals', () => ({
  useReportWebVitals: (cb: (metric: unknown) => unknown) => {
    captured = cb;
  },
}));

import { WebVitalsReporter } from './WebVitalsReporter';

describe('WebVitalsReporter (#94)', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('renders nothing and survives a rejecting transport', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    delete (navigator as unknown as { sendBeacon?: unknown }).sendBeacon;
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('analytics down')));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const { container } = render(<WebVitalsReporter />);
    expect(container.innerHTML).toBe('');
    expect(captured).toBeTypeOf('function');
    await expect(captured!({ name: 'LCP', value: 1000, rating: 'good' })).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalled();
  });
});
