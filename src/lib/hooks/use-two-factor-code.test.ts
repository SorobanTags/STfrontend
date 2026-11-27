import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTwoFactorCode } from './use-two-factor-code';

describe('useTwoFactorCode', () => {
  it('strips non-digit characters', () => {
    const { result } = renderHook(() => useTwoFactorCode());
    act(() => result.current.setCode('1a2b3c'));
    expect(result.current.code).toBe('123');
  });

  it('caps the code at 6 digits', () => {
    const { result } = renderHook(() => useTwoFactorCode());
    act(() => result.current.setCode('1234567890'));
    expect(result.current.code).toBe('123456');
  });

  it('allows up to 20 characters when backup codes are enabled', () => {
    const { result } = renderHook(() =>
      useTwoFactorCode({ allowBackupCode: true })
    );
    act(() => result.current.setCode('123456789012345678901234'));
    expect(result.current.code).toBe('12345678901234567890');
  });

  it('returns the schema error message for an invalid code', () => {
    const { result } = renderHook(() => useTwoFactorCode());
    act(() => result.current.setCode('12'));
    let valid = true;
    act(() => {
      valid = result.current.validate();
    });
    expect(valid).toBe(false);
    expect(result.current.error).toBeTruthy();
  });

  it('clears the error when the code changes', () => {
    const { result } = renderHook(() => useTwoFactorCode());
    act(() => result.current.setCode('12'));
    act(() => {
      result.current.validate();
    });
    expect(result.current.error).toBeTruthy();
    act(() => result.current.setCode('123456'));
    expect(result.current.error).toBeNull();
  });
});
