import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useCountdown } from './use-countdown';

// Simulates a backgrounded tab: wall-clock time passes but the browser fires
// no interval callbacks, then the tab becomes visible again.
function hideTabFor(ms: number) {
  vi.setSystemTime(Date.now() + ms);
  document.dispatchEvent(new Event('visibilitychange'));
}

describe('useCountdown', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('counts down one second per second', () => {
    const { result } = renderHook(() => useCountdown({ seconds: 10 }));
    expect(result.current.secondsLeft).toBe(10);

    act(() => {
      vi.advanceTimersByTime(3_000);
    });
    expect(result.current.secondsLeft).toBe(7);
  });

  it('keeps the wall-clock deadline when interval ticks are throttled in a background tab', () => {
    const { result } = renderHook(() => useCountdown({ seconds: 60 }));

    act(() => {
      vi.advanceTimersByTime(1_000);
    });
    expect(result.current.secondsLeft).toBe(59);

    // 40s pass with no ticks. A tick-counting timer would still show 59.
    act(() => {
      hideTabFor(40_000);
    });
    expect(result.current.secondsLeft).toBe(19);
  });

  it('expires once when the deadline passes while the tab is hidden', () => {
    const onExpire = vi.fn();
    const { result } = renderHook(() => useCountdown({ seconds: 5, onExpire }));

    act(() => {
      hideTabFor(30_000);
    });

    expect(result.current.secondsLeft).toBe(0);
    expect(result.current.isExpired).toBe(true);
    expect(onExpire).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(5_000);
    });
    expect(onExpire).toHaveBeenCalledTimes(1);
  });

  it('pauses while disabled and resumes with the same time left', () => {
    const { result, rerender } = renderHook(
      ({ enabled }) => useCountdown({ seconds: 20, enabled }),
      { initialProps: { enabled: true } },
    );

    act(() => {
      vi.advanceTimersByTime(5_000);
    });
    expect(result.current.secondsLeft).toBe(15);

    rerender({ enabled: false });
    act(() => {
      vi.advanceTimersByTime(30_000);
    });
    expect(result.current.secondsLeft).toBe(15);

    rerender({ enabled: true });
    act(() => {
      vi.advanceTimersByTime(5_000);
    });
    expect(result.current.secondsLeft).toBe(10);
  });

  it('restart sets a fresh deadline', () => {
    const { result } = renderHook(() => useCountdown({ seconds: 10 }));

    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(result.current.isExpired).toBe(true);

    act(() => {
      result.current.restart();
    });
    expect(result.current.secondsLeft).toBe(10);

    act(() => {
      vi.advanceTimersByTime(4_000);
    });
    expect(result.current.secondsLeft).toBe(6);
  });

  it.each([null, 0, -5])('is inactive when seconds is %s', (seconds) => {
    const onExpire = vi.fn();
    const { result } = renderHook(() => useCountdown({ seconds, onExpire }));

    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(result.current.isActive).toBe(false);
    expect(result.current.secondsLeft).toBe(0);
    expect(result.current.isExpired).toBe(false);
    expect(onExpire).not.toHaveBeenCalled();
  });

  it('expires after the full duration and calls onExpire exactly once', () => {
    const onExpire = vi.fn();
    const { result } = renderHook(() => useCountdown({ seconds: 5, onExpire }));

    act(() => {
      vi.advanceTimersByTime(4_000);
    });
    expect(result.current.isExpired).toBe(false);
    expect(onExpire).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1_000);
    });
    expect(result.current.isExpired).toBe(true);
    expect(onExpire).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(onExpire).toHaveBeenCalledTimes(1);
  });

  it('flips isWarning at the warningSeconds boundary and clears it on expiry', () => {
    const { result } = renderHook(() => useCountdown({ seconds: 10, warningSeconds: 3 }));

    act(() => {
      vi.advanceTimersByTime(6_000);
    });
    expect(result.current.secondsLeft).toBe(4);
    expect(result.current.isWarning).toBe(false);

    act(() => {
      vi.advanceTimersByTime(1_000);
    });
    expect(result.current.secondsLeft).toBe(3);
    expect(result.current.isWarning).toBe(true);

    act(() => {
      vi.advanceTimersByTime(3_000);
    });
    expect(result.current.isWarning).toBe(false);
  });

  it('does not report warning while paused', () => {
    const { result, rerender } = renderHook(
      ({ enabled }) => useCountdown({ seconds: 10, warningSeconds: 10, enabled }),
      { initialProps: { enabled: true } },
    );
    expect(result.current.isWarning).toBe(true);
    rerender({ enabled: false });
    expect(result.current.isWarning).toBe(false);
  });

  it('does not call onExpire while paused', () => {
    const onExpire = vi.fn();
    renderHook(() => useCountdown({ seconds: 3, onExpire, enabled: false }));

    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(onExpire).not.toHaveBeenCalled();
  });

  it('restart re-arms onExpire so it can fire again', () => {
    const onExpire = vi.fn();
    const { result } = renderHook(() => useCountdown({ seconds: 2, onExpire }));

    act(() => {
      vi.advanceTimersByTime(2_000);
    });
    expect(onExpire).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.restart();
    });
    expect(result.current.isExpired).toBe(false);

    act(() => {
      vi.advanceTimersByTime(2_000);
    });
    expect(onExpire).toHaveBeenCalledTimes(2);
  });

  it('clamps to zero and never goes negative when the target is in the past', () => {
    const { result } = renderHook(() => useCountdown({ seconds: 5 }));

    act(() => {
      hideTabFor(60_000);
    });
    expect(result.current.secondsLeft).toBe(0);

    act(() => {
      vi.advanceTimersByTime(30_000);
    });
    expect(result.current.secondsLeft).toBe(0);
    expect(result.current.isExpired).toBe(true);
  });

  it('clears its interval when unmounted', () => {
    const { unmount } = renderHook(() => useCountdown({ seconds: 30 }));
    expect(vi.getTimerCount()).toBeGreaterThan(0);

    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('recomputes the remaining time when the target changes', () => {
    const { result, rerender } = renderHook(
      ({ seconds }) => useCountdown({ seconds }),
      { initialProps: { seconds: 10 } },
    );

    act(() => {
      vi.advanceTimersByTime(4_000);
    });
    expect(result.current.secondsLeft).toBe(6);

    rerender({ seconds: 20 });
    expect(result.current.secondsLeft).toBe(20);

    act(() => {
      vi.advanceTimersByTime(5_000);
    });
    expect(result.current.secondsLeft).toBe(15);
  });
});
