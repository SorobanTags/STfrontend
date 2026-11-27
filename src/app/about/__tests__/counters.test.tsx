import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AboutPage from '../page';

vi.mock('next/link', () => ({
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}));

vi.mock('@/components/layout/TopBar', () => ({
  TopBar: () => <div data-testid="topbar" />,
}));

// Targets defined in src/app/about/page.tsx
const COUNTER_TARGETS = [
  { label: 'Active Learners', value: 10000 },
  { label: 'Quality Courses', value: 500 },
  { label: 'Expert Instructors', value: 200 },
];

describe('AboutPage counters', () => {
  const originalIntersectionObserver = globalThis.IntersectionObserver;
  const originalRequestAnimationFrame = globalThis.requestAnimationFrame;

  beforeEach(() => {
    // Local IntersectionObserver mock: fires as intersecting immediately.
    class MockIntersectionObserver {
      private callback: IntersectionObserverCallback;
      constructor(callback: IntersectionObserverCallback) {
        this.callback = callback;
      }
      observe(target: Element) {
        this.callback(
          [{ isIntersecting: true, target } as unknown as IntersectionObserverEntry],
          this as unknown as IntersectionObserver
        );
      }
      unobserve() {}
      disconnect() {}
      takeRecords() {
        return [];
      }
    }
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);

    // Run animation frames synchronously so the counter reaches its target.
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      cb(performance.now() + 5000);
      return 0;
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    globalThis.IntersectionObserver = originalIntersectionObserver;
    globalThis.requestAnimationFrame = originalRequestAnimationFrame;
  });

  it('renders each AnimatedCounter at its target value after intersection', async () => {
    render(<AboutPage />);

    for (const { label, value } of COUNTER_TARGETS) {
      const statLabel = screen.getByText(label);
      const counter = statLabel.parentElement?.querySelector('span');
      expect(counter).not.toBeNull();
      await waitFor(() => {
        expect(counter).toHaveTextContent(`${value.toLocaleString()}+`);
      });
    }
  });
});
