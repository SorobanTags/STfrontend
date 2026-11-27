import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TeachPage from '../page';
import { ToastProvider } from '@/components/ui/ToastProvider';

vi.mock('@/components/layout/Header', () => ({
  Header: () => <div data-testid="mock-header">Header</div>,
}));

const fillForm = () => {
  fireEvent.change(screen.getByLabelText(/Full Name/i), {
    target: { value: 'Amina Bello' },
  });
  fireEvent.change(screen.getByLabelText(/Email Address/i), {
    target: { value: 'amina@example.com' },
  });
  fireEvent.change(
    screen.getByLabelText(/What would you like to teach\?/i),
    {
      target: {
        value:
          'I have 10 years of professional tailoring experience and want to mentor youth across Africa.',
      },
    }
  );
};

describe('Teach Landing Page (Issue #191)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders hero title and start teaching CTA', () => {
    render(
      <ToastProvider>
        <TeachPage />
      </ToastProvider>
    );

    expect(
      screen.getByRole('heading', { name: /Share Your Knowledge, Earn Income/i })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Start Teaching/i })).toBeInTheDocument();
  });

  it('renders 3-step process', () => {
    render(
      <ToastProvider>
        <TeachPage />
      </ToastProvider>
    );

    expect(screen.getByText('Plan Your Curriculum')).toBeInTheDocument();
    expect(screen.getByText('Record & Upload Video Lessons')).toBeInTheDocument();
    expect(screen.getByText('Publish & Earn Income')).toBeInTheDocument();
  });
});

describe('Teach application form validation (Issue #51)', () => {
  afterEach(() => {
    if (vi.isFakeTimers()) {
      act(() => {
        vi.runOnlyPendingTimers();
      });
      vi.useRealTimers();
    }
    vi.restoreAllMocks();
  });

  it('requires a full name', async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <TeachPage />
      </ToastProvider>
    );

    await user.type(screen.getByLabelText('Email Address'), 'amina@example.com');
    await user.type(
      screen.getByLabelText('What would you like to teach?'),
      'I want to teach practical tailoring skills.'
    );
    await user.click(screen.getByRole('button', { name: 'Submit Application' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Full name is required.');
  });

  it('rejects an invalid email address', async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <TeachPage />
      </ToastProvider>
    );

    await user.type(screen.getByLabelText('Full Name'), 'Amina Bello');
    await user.type(screen.getByLabelText('Email Address'), 'not-an-email');
    await user.type(
      screen.getByLabelText('What would you like to teach?'),
      'I want to teach practical tailoring skills.'
    );
    await user.click(screen.getByRole('button', { name: 'Submit Application' }));

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Please enter a valid email address.'
    );
  });

  it('requires at least 20 characters of motivation', async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <TeachPage />
      </ToastProvider>
    );

    await user.type(screen.getByLabelText('Full Name'), 'Amina Bello');
    await user.type(screen.getByLabelText('Email Address'), 'amina@example.com');
    await user.type(
      screen.getByLabelText('What would you like to teach?'),
      'I teach sewing dail'
    );
    await user.click(screen.getByRole('button', { name: 'Submit Application' }));

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Please tell us a bit more about what you want to teach (min 20 characters).'
    );
  });

  it('shows the success toast and submitted state after a valid submission', async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <TeachPage />
      </ToastProvider>
    );

    await user.type(screen.getByLabelText('Full Name'), 'Amina Bello');
    await user.type(screen.getByLabelText('Email Address'), 'amina@example.com');
    await user.type(
      screen.getByLabelText('What would you like to teach?'),
      'I teach sewing daily'
    );

    vi.useFakeTimers();
    fireEvent.click(screen.getByRole('button', { name: 'Submit Application' }));
    act(() => {
      vi.advanceTimersByTime(600);
    });

    expect(screen.getByRole('status')).toHaveTextContent('Application received!');
    expect(
      screen.getByRole('heading', { name: 'Application Received' })
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Submit Application' })).not.toBeInTheDocument();
  });
});

describe('Teach Landing Page submission timer (Issue #49)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('disables the submit button while submitting', () => {
    render(
      <ToastProvider>
        <TeachPage />
      </ToastProvider>
    );

    fillForm();
    const submitBtn = screen.getByRole('button', { name: /Submit Application/i });
    fireEvent.click(submitBtn);

    expect(submitBtn).toBeDisabled();
  });

  it('produces exactly one success toast for two rapid submits', () => {
    render(
      <ToastProvider>
        <TeachPage />
      </ToastProvider>
    );

    fillForm();
    const submitBtn = screen.getByRole('button', { name: /Submit Application/i });

    fireEvent.click(submitBtn);
    fireEvent.click(submitBtn);

    act(() => {
      vi.advanceTimersByTime(600);
    });

    expect(
      screen.getAllByText(/Application received!/i)
    ).toHaveLength(1);
  });

  it('clears the pending timer on unmount without state-update warnings', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const { unmount } = render(
      <ToastProvider>
        <TeachPage />
      </ToastProvider>
    );

    fillForm();
    fireEvent.click(screen.getByRole('button', { name: /Submit Application/i }));

    unmount();

    act(() => {
      vi.advanceTimersByTime(600);
    });

    const stateUpdateWarning = [...consoleErrorSpy.mock.calls, ...consoleWarnSpy.mock.calls]
      .flat()
      .some((arg) =>
        typeof arg === 'string' && /unmounted component|state update/i.test(arg)
      );

    expect(stateUpdateWarning).toBe(false);
  });
});
