'use client';

import { useState } from 'react';
import { Download, Copy, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useToastContext } from '@/components/ui/ToastProvider';
import { twoFactorApi } from '@/lib/api/services';
import { twoFactorCodeSchema } from '@/lib/validations/two-factor';

type SetupStep = 'inactive' | 'qr-code' | 'verify' | 'backup-codes' | 'error';

export function TwoFactorSetup() {
  const toast = useToastContext();
  const [step, setStep] = useState<SetupStep>('inactive');
  const [isLoading, setIsLoading] = useState(false);
  const [qrCode, setQrCode] = useState<string>('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState<string>('');
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isDisableDialogOpen, setIsDisableDialogOpen] = useState(false);
  const [disableCode, setDisableCode] = useState('');
  const [disableError, setDisableError] = useState<string>('');

  const handleEnable = async () => {
    setIsLoading(true);
    try {
      const result = await twoFactorApi.setupInitiate();
      setQrCode(result.qrCode);
      setStep('qr-code');
    } catch (error: any) {
      toast.error({
        title: 'Error',
        description: error?.response?.data?.message || 'Failed to initiate 2FA setup',
      });
      setStep('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeChange = (value: string) => {
    // Restrict input to numeric characters only, capped at 6 digits.
    const digitsOnly = value.replace(/\D/g, '').slice(0, 6);
    setCode(digitsOnly);
    if (codeError) setCodeError('');
  };

  const handleDisableCodeChange = (value: string) => {
    // Restrict input to numeric characters only, capped at 6 digits.
    const digitsOnly = value.replace(/\D/g, '').slice(0, 6);
    setDisableCode(digitsOnly);
    if (disableError) setDisableError('');
  };

  const handleVerifyCode = async () => {
    setCodeError('');

    // Validate code format
    try {
      twoFactorCodeSchema.parse({ code });
    } catch (err: any) {
      setCodeError(err.errors?.[0]?.message || 'Invalid code format');
      return;
    }

    setIsLoading(true);
    try {
      const result = await twoFactorApi.setupVerify(code);
      setBackupCodes(result.backupCodes);
      setStep('backup-codes');
      toast.success({
        title: 'Two-Factor Authentication Enabled',
        description: 'Your account is now more secure.',
      });
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Invalid code. Please try again.';
      setCodeError(message);
      toast.error({
        title: 'Verification Failed',
        description: message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openDisableDialog = () => {
    setDisableCode('');
    setDisableError('');
    setIsDisableDialogOpen(true);
  };

  const closeDisableDialog = () => {
    if (isLoading) return;
    setIsDisableDialogOpen(false);
    setDisableCode('');
    setDisableError('');
  };

  const handleDisable = async () => {
    setDisableError('');

    // Validate code format before hitting the API
    try {
      twoFactorCodeSchema.parse({ code: disableCode });
    } catch (err: any) {
      setDisableError(err.errors?.[0]?.message || 'Invalid code format');
      return;
    }

    setIsLoading(true);
    try {
      await twoFactorApi.disable(disableCode);
      setIsDisableDialogOpen(false);
      setDisableCode('');
      setStep('inactive');
      setBackupCodes([]);
      setCode('');
      toast.success({
        title: 'Two-Factor Authentication Disabled',
        description: 'Your account is now accessible with password only.',
      });
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Invalid code. Please try again.';
      setDisableError(message);
      toast.error({
        title: 'Error',
        description: message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const downloadBackupCodes = () => {
    const content = backupCodes.join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sorobanlard-backup-codes.txt';
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success({
      title: 'Downloaded',
      description: 'Backup codes saved to your device.',
    });
  };

  const copyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'));
    setCopied(true);
    toast.success({
      title: 'Copied',
      description: 'Backup codes copied to clipboard.',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const disableDialog = isDisableDialogOpen ? (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="disable-2fa-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    >
      <div className="w-full max-w-md space-y-4 rounded-[16px] bg-white p-6 shadow-xl">
        <h3 id="disable-2fa-title" className="font-semibold text-[#26215C]">
          Disable Two-Factor Authentication
        </h3>
        <p className="text-sm text-[#5A5578]">
          Enter your 6-digit 2FA code to disable two-factor authentication.
        </p>
        <div className="space-y-3">
          <label htmlFor="disable-2fa-code" className="block text-sm font-medium text-[#26215C]">
            6-digit code
          </label>
          <input
            id="disable-2fa-code"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="000000"
            value={disableCode}
            onChange={(e) => handleDisableCodeChange(e.target.value)}
            aria-invalid={disableError ? true : undefined}
            aria-describedby={disableError ? 'disable-2fa-code-error' : undefined}
            className={`w-full rounded-xl border px-4 py-3 text-center text-2xl font-semibold tracking-widest outline-none transition ${
              disableError
                ? 'border-red-400 bg-red-50/40'
                : 'border-[#D3D0F2] focus:border-[#7F77DD]'
            }`}
            disabled={isLoading}
          />
          {disableError && (
            <p
              id="disable-2fa-code-error"
              role="alert"
              className="flex items-center gap-1 text-xs text-red-600"
            >
              <AlertCircle className="h-3 w-3" />
              {disableError}
            </p>
          )}
        </div>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={closeDisableDialog}
            disabled={isLoading}
            className="rounded-xl border border-[#D3D0F2] px-4 py-2 text-sm font-semibold text-[#26215C] transition hover:bg-[#EEEDFE] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDisable}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#7F77DD] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#3C3489] disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Disabling...
              </>
            ) : (
              'Disable'
            )}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  if (step === 'inactive') {
    return (
      <div className="space-y-4">
        <p className="text-sm text-[#5A5578]">
          Add an extra layer of security to your account. Once enabled, you&apos;ll need your authenticator app in addition to your password to sign in.
        </p>
        <button
          onClick={handleEnable}
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#7F77DD] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#3C3489] disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Setting up...
            </>
          ) : (
            'Enable Two-Factor Authentication'
          )}
        </button>
      </div>
    );
  }

  if (step === 'qr-code') {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="font-semibold text-[#26215C]">Step 1: Scan QR Code</h3>
          <p className="mt-2 text-sm text-[#5A5578]">
            Use an authenticator app like Google Authenticator, Authy, or Microsoft Authenticator to scan this QR code.
          </p>
        </div>

        <div className="flex justify-center p-6 bg-[#EEEDFE] rounded-[16px]">
          {qrCode && (
            <img
              src={qrCode}
              alt="2FA QR Code"
              className="h-64 w-64 rounded-lg"
            />
          )}
        </div>

        <div>
          <h3 className="font-semibold text-[#26215C]">Step 2: Enter Verification Code</h3>
          <p className="mt-2 text-sm text-[#5A5578]">
            After scanning, enter the 6-digit code from your authenticator app.
          </p>

          <div className="mt-4 space-y-3">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="000000"
              value={code}
              onChange={(e) => handleCodeChange(e.target.value)}
              aria-invalid={codeError ? true : undefined}
              aria-describedby={codeError ? 'two-factor-code-error' : undefined}
              className={`w-full rounded-xl border px-4 py-3 text-center text-2xl font-semibold tracking-widest outline-none transition ${
                codeError
                  ? 'border-red-400 bg-red-50/40'
                  : 'border-[#D3D0F2] focus:border-[#7F77DD]'
              }`}
              disabled={isLoading}
            />
            {codeError && (
              <p
                id="two-factor-code-error"
                role="alert"
                className="flex items-center gap-1 text-xs text-red-600"
              >
                <AlertCircle className="h-3 w-3" />
                {codeError}
              </p>
            )}
          </div>

          <button
            onClick={handleVerifyCode}
            disabled={isLoading || code.length !== 6}
            className="mt-4 w-full rounded-xl bg-[#7F77DD] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#3C3489] disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="inline h-4 w-4 animate-spin mr-2" />
                Verifying...
              </>
            ) : (
              'Verify and Enable'
            )}
          </button>
        </div>
      </div>
    );
  }

  if (step === 'backup-codes') {
    return (
      <div className="space-y-6">
        <div className="flex items-start gap-3 rounded-[16px] bg-emerald-50 p-4 border border-emerald-200">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-emerald-900">Two-Factor Authentication Enabled</p>
            <p className="mt-1 text-sm text-emerald-700">
              Your account is now protected. Save your backup codes in a safe place.
            </p>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-[#26215C]">Backup Codes</h3>
            <button
              onClick={() => setShowBackupCodes((prev) => !prev)}
              className="inline-flex items-center gap-1 text-sm font-medium text-[#7F77DD] hover:text-[#3C3489]"
            >
              {showBackupCodes ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showBackupCodes ? 'Hide' : 'Show'}
            </button>
          </div>
          <p className="mt-2 text-sm text-[#5A5578]">
            Each backup code can be used once if you lose access to your authenticator app.
          </p>

          <div className="mt-4 grid grid-cols-2 gap-2 rounded-[16px] bg-[#EEEDFE] p-4">
            {backupCodes.map((backupCode, index) => (
              <code
                key={index}
                className="rounded-lg bg-white px-3 py-2 text-center text-sm font-mono text-[#26215C]"
              >
                {showBackupCodes ? backupCode : '••••••••'}
              </code>
            ))}
          </div>

          <div className="mt-4 flex gap-3">
            <button
              onClick={downloadBackupCodes}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#D3D0F2] px-4 py-2 text-sm font-semibold text-[#26215C] transition hover:bg-[#EEEDFE]"
            >
              <Download className="h-4 w-4" />
              Download
            </button>
            <button
              onClick={copyBackupCodes}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#D3D0F2] px-4 py-2 text-sm font-semibold text-[#26215C] transition hover:bg-[#EEEDFE]"
            >
              <Copy className="h-4 w-4" />
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>

        <button
          onClick={openDisableDialog}
          disabled={isLoading}
          className="w-full rounded-xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
        >
          Disable Two-Factor Authentication
        </button>

        {disableDialog}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-[16px] bg-red-50 p-4 border border-red-200">
        <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-red-900">Setup Failed</p>
          <p className="mt-1 text-sm text-red-700">
            We couldn&apos;t start two-factor authentication setup. Please try again.
          </p>
        </div>
      </div>
      <button
        onClick={() => setStep('inactive')}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#7F77DD] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#3C3489]"
      >
        Try Again
      </button>
    </div>
  );
}
