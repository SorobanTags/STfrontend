import { describe, it, expect, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useMobileDrawerFocusTrap } from './use-focus-trap';

describe('useMobileDrawerFocusTrap', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  function setup() {
    const trigger = document.createElement('button');
    const container = document.createElement('div');
    document.body.append(trigger, container);
    return {
      trigger,
      props: {
        containerRef: { current: container },
        triggerRef: { current: trigger },
        onClose: () => {},
      },
    };
  }

  it('does not focus the trigger on initial mount', () => {
    const { trigger, props } = setup();
    renderHook(() => useMobileDrawerFocusTrap({ isOpen: false, ...props }));
    expect(document.activeElement).not.toBe(trigger);
  });

  it('focuses the trigger after an open -> close cycle', () => {
    const { trigger, props } = setup();
    const { rerender } = renderHook(
      ({ isOpen }) => useMobileDrawerFocusTrap({ isOpen, ...props }),
      { initialProps: { isOpen: true } },
    );
    expect(document.activeElement).not.toBe(trigger);
    rerender({ isOpen: false });
    expect(document.activeElement).toBe(trigger);
  });
});
