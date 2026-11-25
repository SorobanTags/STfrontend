import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ProfilePage from '../page';
import { usersApi } from '@/lib/api/services';
import { useAuthStore } from '@/lib/hooks/use-auth-store';

const mockPush = vi.fn();
const mockReplace = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
}));

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('@/lib/api/services', () => ({
  usersApi: {
    getMe: vi.fn(),
    updateMe: vi.fn(),
  },
  uploadsApi: {
    uploadAvatar: vi.fn(),
  },
}));

const baseUser = {
  id: 'user-1',
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  bio: 'Mathematician',
  role: 'STUDENT',
  avatarUrl: null,
};

describe('ProfilePage', () => {
  const getMeMock = vi.mocked(usersApi.getMe);
  const updateMeMock = vi.mocked(usersApi.updateMe);

  beforeEach(() => {
    mockPush.mockReset();
    mockReplace.mockReset();
    getMeMock.mockReset();
    updateMeMock.mockReset();
    useAuthStore.setState({ user: null, token: null, address: null, isConnected: false });
  });

  it('loads the profile and prefills the form', async () => {
    getMeMock.mockResolvedValue(baseUser as any);

    render(<ProfilePage />);

    expect(await screen.findByDisplayValue('Ada Lovelace')).toBeInTheDocument();
    expect(screen.getByDisplayValue('ada@example.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Mathematician')).toBeInTheDocument();
    expect(getMeMock).toHaveBeenCalledTimes(1);
  });

  it('saves the profile and updates the auth store on success', async () => {
    const user = userEvent.setup();
    getMeMock.mockResolvedValue(baseUser as any);
    updateMeMock.mockResolvedValue({
      ...baseUser,
      name: 'Ada King',
      email: 'ada.king@example.com',
    } as any);

    render(<ProfilePage />);

    const nameInput = await screen.findByDisplayValue('Ada Lovelace');
    const emailInput = screen.getByDisplayValue('ada@example.com');

    await user.clear(nameInput);
    await user.type(nameInput, 'Ada King');
    await user.clear(emailInput);
    await user.type(emailInput, 'ada.king@example.com');
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(updateMeMock).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Ada King', email: 'ada.king@example.com' })
      );
    });

    expect(useAuthStore.getState().user).toMatchObject({
      name: 'Ada King',
      email: 'ada.king@example.com',
    });
    expect(await screen.findByText('Saved')).toBeInTheDocument();
  });

  it('renders the error banner when getMe rejects', async () => {
    getMeMock.mockRejectedValue(new Error('Failed to load profile'));

    render(<ProfilePage />);

    expect(await screen.findByText('Failed to load profile')).toBeInTheDocument();
  });

  it('renders the error banner when updateMe rejects', async () => {
    const user = userEvent.setup();
    getMeMock.mockResolvedValue(baseUser as any);
    updateMeMock.mockRejectedValue(new Error('Failed to save profile'));

    render(<ProfilePage />);

    await screen.findByDisplayValue('Ada Lovelace');
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    expect(await screen.findByText('Failed to save profile')).toBeInTheDocument();
  });
});
