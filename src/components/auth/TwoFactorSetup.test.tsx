import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastProvider } from '@/components/ui/ToastProvider';
import { TwoFactorSetup } from './TwoFactorSetup';

vi.mock('@/lib/api/services', () => ({
  twoFactorApi: {
    setup: vi.fn(),
    verify: vi.fn(),
    disable: vi.fn(),
  },
}));

import { twoFactorApi } from '@/lib/api/services';

const mockedApi = vi.mocked(twoFactorApi, true);

function renderSetup() {
  return render(
    <ToastProvider>
      <TwoFactorSetup />
    </ToastProvider>,
  );
}

describe('TwoFactorSetup disable flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows an inline error and does not call disable for a non-6-digit code', async () => {
    const user = userEvent.setup();
    renderSetup();

    await user.click(screen.getByRole('button', { name: /disable/i }));

    const input = await screen.findByLabelText(/6-digit/i);
    await user.type(input, '12ab');
    await user.click(screen.getByRole('button', { name: /confirm/i }));

    expect(await screen.findByText(/6-digit code/i)).toBeInTheDocument();
    expect(mockedApi.disable).not.toHaveBeenCalled();
  });

  it('calls disable once with a valid code and returns to the inactive step', async () => {
    const user = userEvent.setup();
    mockedApi.disable.mockResolvedValueOnce(undefined as never);
    renderSetup();

    await user.click(screen.getByRole('button', { name: /disable/i }));

    const input = await screen.findByLabelText(/6-digit/i);
    await user.type(input, '123456');
    await user.click(screen.getByRole('button', { name: /confirm/i }));

    await waitFor(() => {
      expect(mockedApi.disable).toHaveBeenCalledTimes(1);
    });
    expect(mockedApi.disable).toHaveBeenCalledWith('123456');
    expect(await screen.findByRole('button', { name: /enable/i })).toBeInTheDocument();
  });

  it('makes no API call when the dialog is cancelled', async () => {
    const user = userEvent.setup();
    renderSetup();

    await user.click(screen.getByRole('button', { name: /disable/i }));
    await screen.findByLabelText(/6-digit/i);
    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(mockedApi.disable).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /disable/i })).toBeInTheDocument();
  });
});
