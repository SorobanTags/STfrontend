import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import Footer from './Footer1';
const submit = (email: string) => {
  fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: email } });
  fireEvent.click(screen.getByRole('button', { name: /subscribe/i }));
};
describe('Footer1 newsletter', () => {
  it('shows required and format errors', () => {
    render(<Footer />);
    submit('');
    expect(screen.getByRole('alert')).toHaveTextContent('Email address is required.');
    submit('nope');
    expect(screen.getByRole('alert')).toHaveTextContent('Please enter a valid email address.');
  });
  it.each([[0.9, 'status', /subscribing/i], [0.01, 'alert', /went wrong/i]])('random=%s -> %s', async (r, role, text) => {
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValueOnce(r);
    render(<Footer />);
    submit('a@b.co');
    await act(async () => { await vi.advanceTimersByTimeAsync(1000); });
    expect(screen.getByRole(role)).toHaveTextContent(text);
    vi.useRealTimers();
  });
});
