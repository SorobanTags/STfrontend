import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TwoFactorLogin } from './TwoFactorLogin';

describe('TwoFactorLogin', () => {
  it('strips non-digit characters and caps input length at 6 in standard authenticator mode', () => {
    render(<TwoFactorLogin onVerify={vi.fn()} onCancel={vi.fn()} />);

    const input = screen.getByLabelText('Authenticator Code') as HTMLInputElement;

    fireEvent.change(input, { target: { value: 'abc123xyz456extra' } });

    expect(input.value).toBe('123456');
  });

  it('does not call onVerify when code fails schema validation (e.g. less than 6 digits)', async () => {
    const onVerify = vi.fn();
    render(<TwoFactorLogin onVerify={onVerify} onCancel={vi.fn()} />);

    const input = screen.getByLabelText('Authenticator Code') as HTMLInputElement;

    // Fill only 3 digits
    fireEvent.change(input, { target: { value: '123' } });

    const submitBtn = screen.getByRole('button', { name: 'Verify' });
    fireEvent.click(submitBtn);

    expect(onVerify).not.toHaveBeenCalled();
    expect(await screen.findByText(/Code must be 6 digits/i)).toBeInTheDocument();
  });

  it('renders rejection message when onVerify rejects and re-enables submit button', async () => {
    const onVerify = vi.fn().mockRejectedValue(new Error('Invalid 2FA token provided.'));
    render(<TwoFactorLogin onVerify={onVerify} onCancel={vi.fn()} />);

    const input = screen.getByLabelText('Authenticator Code');
    fireEvent.change(input, { target: { value: '123456' } });

    const submitBtn = screen.getByRole('button', { name: 'Verify' });
    fireEvent.click(submitBtn);

    expect(onVerify).toHaveBeenCalledWith('123456');

    expect(await screen.findByText('Invalid 2FA token provided.')).toBeInTheDocument();

    await waitFor(() => {
      expect(submitBtn).toBeEnabled();
    });
  });

  it('resets input value and accepts alphanumeric text when toggling backup-code mode', () => {
    render(<TwoFactorLogin onVerify={vi.fn()} onCancel={vi.fn()} />);

    const authInput = screen.getByLabelText('Authenticator Code') as HTMLInputElement;
    fireEvent.change(authInput, { target: { value: '123456' } });
    expect(authInput.value).toBe('123456');

    const backupCheckbox = screen.getByRole('checkbox', { name: /Use backup code instead/i });
    fireEvent.click(backupCheckbox);

    // After toggling, the input should now be labeled Backup Code and its value reset
    const backupInput = screen.getByLabelText('Backup Code') as HTMLInputElement;
    expect(backupInput.value).toBe('');

    // Backup mode accepts alphanumeric characters including dashes
    fireEvent.change(backupInput, { target: { value: 'backup-code-123' } });
    expect(backupInput.value).toBe('backup-code-123');

    // Toggling off resets code again
    fireEvent.click(backupCheckbox);
    const revertedInput = screen.getByLabelText('Authenticator Code') as HTMLInputElement;
    expect(revertedInput.value).toBe('');
  });

  it('calls onCancel when Back button is clicked', () => {
    const onCancel = vi.fn();
    render(<TwoFactorLogin onVerify={vi.fn()} onCancel={onCancel} />);

    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('strips non-digit input and caps the code at 6 characters', async () => {
    const user = userEvent.setup();
    render(<TwoFactorLogin onVerify={vi.fn()} onCancel={vi.fn()} />);
    const input = screen.getByLabelText(/authenticator code/i) as HTMLInputElement;

    await user.type(input, 'a1b2c3d4e5f6g7h8');

    expect(input.value).toBe('123456');
  });

  it('does not call onVerify when the code fails schema validation', async () => {
    const user = userEvent.setup();
    const onVerify = vi.fn().mockResolvedValue(undefined);
    render(<TwoFactorLogin onVerify={onVerify} onCancel={vi.fn()} />);

    await user.type(screen.getByLabelText(/authenticator code/i), '123');
    await user.click(screen.getByRole('button', { name: /verify/i }));

    expect(onVerify).not.toHaveBeenCalled();
    expect(screen.getByText(/code must be 6 digits/i)).toBeInTheDocument();
  });

  it('renders the rejection message and re-enables submit when onVerify rejects', async () => {
    const user = userEvent.setup();
    const onVerify = vi.fn().mockRejectedValue(new Error('Invalid code'));
    render(<TwoFactorLogin onVerify={onVerify} onCancel={vi.fn()} />);

    await user.type(screen.getByLabelText(/authenticator code/i), '123456');
    await user.click(screen.getByRole('button', { name: /verify/i }));

    expect(await screen.findByText('Invalid code')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /verify/i })).toBeEnabled();
  });

  it('resets the input value when toggling backup-code mode', async () => {
    const user = userEvent.setup();
    render(<TwoFactorLogin onVerify={vi.fn()} onCancel={vi.fn()} />);

    const input = screen.getByLabelText(/authenticator code/i) as HTMLInputElement;
    await user.type(input, '123456');
    expect(input.value).toBe('123456');

    await user.click(screen.getByLabelText(/use backup code instead/i));

    const backupInput = screen.getByLabelText(/backup code/i) as HTMLInputElement;
    expect(backupInput.value).toBe('');
  });
});
