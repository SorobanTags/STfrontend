import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QnaSection } from '../QnaSection';
const q = (id: string, title: string) => ({ id, title, body: 'b', authorName: 'A', authorAvatarUrl: null,
  createdAt: '2026-01-01T00:00:00Z', upvotes: 1, viewerUpvoted: false, replies: [] });
const search = () => screen.getByLabelText('Search Q&A');
const upvote = async (onUpvote: () => Promise<void>) => {
  render(<QnaSection questions={[q('1', 'One')]} onUpvote={onUpvote} />);
  fireEvent.click(screen.getByRole('button', { name: /upvote this question/i }));
  await vi.waitFor(() => expect(onUpvote).toHaveBeenCalled());
};
describe('QnaSection', () => {
  it('keeps the upvote on success', async () => {
    await upvote(vi.fn().mockResolvedValue(undefined));
    expect(screen.getByRole('button', { name: /remove upvote/i })).toHaveTextContent('2');
  });
  it('reverts the upvote on rejection', async () => {
    await upvote(vi.fn().mockRejectedValue(new Error('x')));
    expect(await screen.findByRole('button', { name: /upvote this question/i })).toHaveTextContent('1');
  });
  it('resets questions and search only when lessonId changes', () => {
    const { rerender } = render(<QnaSection lessonId="a" questions={[q('1', 'Alpha')]} />);
    fireEvent.change(search(), { target: { value: 'Alp' } });
    rerender(<QnaSection lessonId="a" questions={[q('1', 'Alpha')]} />);
    expect(search()).toHaveValue('Alp');
    rerender(<QnaSection lessonId="b" questions={[q('2', 'Beta')]} />);
    expect(screen.getByText('Beta')).toBeInTheDocument();
    expect(search()).toHaveValue('');
  });
});
