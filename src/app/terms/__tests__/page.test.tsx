import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/components/layout/TopBar', () => ({ TopBar: () => null }));

import TermsPage from '../page';

const SECTION_IDS = [
  'overview',
  'user-accounts',
  'intellectual-property',
  'user-conduct',
  'limitations',
  'indemnification',
  'modifications',
  'termination',
  'governing-law',
  'contact',
];

type ObserverCallback = (entries: Array<Partial<IntersectionObserverEntry>>) => void;

describe('TermsPage table of contents', () => {
  let callback: ObserverCallback;
  let observe: ReturnType<typeof vi.fn>;
  let disconnect: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    observe = vi.fn();
    disconnect = vi.fn();
    vi.stubGlobal(
      'IntersectionObserver',
      vi.fn(function (cb: ObserverCallback) {
        callback = cb;
        return { observe, disconnect, unobserve: vi.fn(), takeRecords: vi.fn() };
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('observes every section id', () => {
    render(<TermsPage />);

    const observedIds = observe.mock.calls.map(([element]) => (element as HTMLElement).id);
    expect(observedIds).toEqual(SECTION_IDS);
  });

  it('highlights the overview link by default', () => {
    render(<TermsPage />);

    expect(screen.getByRole('link', { name: 'Overview' }).className).toContain('font-semibold');
  });

  it('updates the active link when a section intersects', () => {
    render(<TermsPage />);
    const target = document.getElementById('user-accounts') as HTMLElement;

    act(() => callback([{ isIntersecting: true, target }]));

    expect(screen.getByRole('link', { name: 'User Accounts' }).className).toContain(
      'bg-[#EEEDFE]',
    );
    expect(screen.getByRole('link', { name: 'Overview' }).className).not.toContain(
      'bg-[#EEEDFE]',
    );
  });

  it('ignores entries that are not intersecting', () => {
    render(<TermsPage />);
    const target = document.getElementById('termination') as HTMLElement;

    act(() => callback([{ isIntersecting: false, target }]));

    expect(screen.getByRole('link', { name: 'Termination' }).className).not.toContain(
      'bg-[#EEEDFE]',
    );
  });

  it('disconnects the observer on unmount', () => {
    const { unmount } = render(<TermsPage />);
    expect(disconnect).not.toHaveBeenCalled();

    unmount();
    expect(disconnect).toHaveBeenCalledTimes(1);
  });
});
