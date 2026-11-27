import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HelpPage from '../page';

vi.mock('@/components/layout/TopBar', () => ({
  TopBar: () => <header data-testid="mock-topbar">TopBar</header>,
}));

describe('HelpPage FAQ Component Tests (Issue #4)', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    expect(consoleErrorSpy).not.toHaveBeenCalled();
    vi.restoreAllMocks();
  });

  it('renders help center page title, description, and contact link', () => {
    render(<HelpPage />);

    expect(
      screen.getByRole('heading', { name: /Common questions, answered clearly\./i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Whether you are a student, instructor, or new to the platform/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /Can't find what you need\? Contact us/i })
    ).toHaveAttribute('href', '/contact');
  });

  it('renders all four FAQ questions from helpItems', () => {
    render(<HelpPage />);

    expect(
      screen.getByRole('button', { name: /How do I enroll in a course\?/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /How do I receive my certificate\?/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Can I switch between free and Pro\?/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /What if I need support\?/i })
    ).toBeInTheDocument();
  });

  it('renders the first FAQ item open by default with its answer visible', () => {
    render(<HelpPage />);

    const firstQuestionBtn = screen.getByRole('button', {
      name: /How do I enroll in a course\?/i,
    });
    expect(firstQuestionBtn).toHaveAttribute('aria-expanded', 'true');
    expect(
      screen.getByText(
        /Open any course detail page, select Enroll, and follow the guided checkout to start learning\./i
      )
    ).toBeInTheDocument();
  });

  it('reveals corresponding answer text when clicking an accordion question', async () => {
    const user = userEvent.setup();
    render(<HelpPage />);

    const certificateBtn = screen.getByRole('button', {
      name: /How do I receive my certificate\?/i,
    });
    expect(certificateBtn).toHaveAttribute('aria-expanded', 'false');

    await user.click(certificateBtn);

    expect(certificateBtn).toHaveAttribute('aria-expanded', 'true');
    expect(
      screen.getByText(
        /Complete the course requirements and the certificate will appear in your dashboard once it is verified\./i
      )
    ).toBeInTheDocument();
  });

  it('reveals answers for all other questions upon interaction', async () => {
    const user = userEvent.setup();
    render(<HelpPage />);

    const switchPlanBtn = screen.getByRole('button', {
      name: /Can I switch between free and Pro\?/i,
    });
    await user.click(switchPlanBtn);
    expect(switchPlanBtn).toHaveAttribute('aria-expanded', 'true');
    expect(
      screen.getByText(
        /Yes\. You can upgrade or downgrade whenever you need, and your learning history stays with your account\./i
      )
    ).toBeInTheDocument();

    const supportBtn = screen.getByRole('button', {
      name: /What if I need support\?/i,
    });
    await user.click(supportBtn);
    expect(supportBtn).toHaveAttribute('aria-expanded', 'true');
    expect(
      screen.getByText(
        /You can reach our support team through the help center and our priority support is included on Pro\./i
      )
    ).toBeInTheDocument();
  });

  it('collapses an open FAQ item when clicked again', async () => {
    const user = userEvent.setup();
    render(<HelpPage />);

    const firstQuestionBtn = screen.getByRole('button', {
      name: /How do I enroll in a course\?/i,
    });
    expect(firstQuestionBtn).toHaveAttribute('aria-expanded', 'true');

    await user.click(firstQuestionBtn);
    expect(firstQuestionBtn).toHaveAttribute('aria-expanded', 'false');
  });

  it('filters FAQ questions using the search input', async () => {
    const user = userEvent.setup();
    render(<HelpPage />);

    const searchInput = screen.getByRole('searchbox', { name: /Search FAQs/i });
    await user.type(searchInput, 'certificate');

    expect(
      screen.getByRole('button', { name: /How do I receive my certificate\?/i })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /How do I enroll in a course\?/i })
    ).not.toBeInTheDocument();
  });
});
