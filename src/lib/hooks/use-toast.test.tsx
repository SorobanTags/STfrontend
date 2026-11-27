import type { ReactNode } from 'react';
import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ToastProvider } from '@/components/ui/ToastProvider';
import { useToast } from './use-toast';

function wrapper({ children }: { children: ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>;
}

describe('useToast', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns the toast context with usable toast functions inside a ToastProvider', () => {
    const { result } = renderHook(() => useToast(), { wrapper });

    expect(result.current.toasts).toEqual([]);
    for (const fn of ['push', 'dismiss', 'success', 'error', 'warning', 'info'] as const) {
      expect(result.current[fn]).toBeTypeOf('function');
    }

    act(() => {
      result.current.success({ title: 'Saved' });
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0]).toMatchObject({ title: 'Saved', variant: 'success', role: 'status' });
  });

  it('throws when used outside a ToastProvider', () => {
    // React logs the uncaught render error; silence it to keep the test output clean.
    vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => renderHook(() => useToast())).toThrow('useToastContext must be used inside ToastProvider');
  });
});
