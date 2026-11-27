'use client';

import { useCallback, useState } from 'react';
import { twoFactorCodeSchema } from '@/lib/validations/two-factor';

interface UseTwoFactorCodeOptions {
  allowBackupCode?: boolean;
}

interface UseTwoFactorCodeResult {
  code: string;
  setCode: (value: string) => void;
  error: string;
  validate: () => boolean;
  reset: () => void;
}

const MAX_DIGITS = 6;
const MAX_BACKUP_LENGTH = 20;

export function useTwoFactorCode({
  allowBackupCode = false,
}: UseTwoFactorCodeOptions = {}): UseTwoFactorCodeResult {
  const [code, setCodeState] = useState('');
  const [error, setError] = useState('');

  const setCode = useCallback(
    (value: string) => {
      if (allowBackupCode) {
        setCodeState(value.slice(0, MAX_BACKUP_LENGTH));
      } else {
        setCodeState(value.replace(/\D/g, '').slice(0, MAX_DIGITS));
      }
      setError('');
    },
    [allowBackupCode]
  );

  const validate = useCallback(() => {
    try {
      if (allowBackupCode) {
        if (!code.trim()) {
          throw new Error('Backup code is required.');
        }
      } else {
        twoFactorCodeSchema.parse({ code });
      }
      setError('');
      return true;
    } catch (err: any) {
      setError(err.errors?.[0]?.message || err.message || 'Invalid code format');
      return false;
    }
  }, [allowBackupCode, code]);

  const reset = useCallback(() => {
    setCodeState('');
    setError('');
  }, []);

  return { code, setCode, error, validate, reset };
}
