import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CheckoutErrorBoundary } from './CheckoutErrorBoundary';

function ThrowingChild({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('checkout exploded');
  }
  return <div>checkout content</div>;
}

describe('CheckoutErrorBoundary', () => {
  it('renders children when no error is thrown', () => {
    render(
      <CheckoutErrorBoundary>
        <ThrowingChild shouldThrow={false} />
      </CheckoutErrorBoundary>,
    );

    expect(screen.getByText('checkout content')).toBeInTheDocument();
  });

  it('renders the fallback UI when a child throws', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <CheckoutErrorBoundary>
        <ThrowingChild shouldThrow />
      </CheckoutErrorBoundary>,
    );

    expect(screen.queryByText('checkout content')).not.toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();

    consoleError.mockRestore();
  });

  it('recovers and re-renders children when the retry action is used', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const user = userEvent.setup();

    render(
      <CheckoutErrorBoundary>
        <ThrowingChild shouldThrow />
      </CheckoutErrorBoundary>,
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /try again|retry|reset/i }));

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    consoleError.mockRestore();
  });
});
