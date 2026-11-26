import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import NotesPanel from './NotesPanel';

const videoRef = createRef<HTMLVideoElement>();

function renderPanel() {
  return render(<NotesPanel courseId="c1" lectureId="l1" videoRef={videoRef} />);
}

describe('NotesPanel export with no notes (#93)', () => {
  beforeEach(() => localStorage.clear());

  it('shows the export trigger disabled and aria-disabled', () => {
    renderPanel();
    const trigger = screen.getByRole('button', { name: /export/i });
    expect(trigger).toBeDisabled();
    expect(trigger).toHaveAttribute('aria-disabled', 'true');
  });

  it('does not open the menu when the disabled trigger is clicked', async () => {
    const user = userEvent.setup();
    renderPanel();
    await user.click(screen.getByRole('button', { name: /export/i }));
    expect(screen.queryByRole('menu')).toBeNull();
    expect(screen.queryByRole('menuitem', { name: /markdown/i })).toBeNull();
    expect(screen.queryByRole('menuitem', { name: /pdf/i })).toBeNull();
  });

  it('enables export once a note is saved, and the menu opens', async () => {
    const user = userEvent.setup();
    renderPanel();
    await user.type(screen.getByPlaceholderText(/write a note/i), 'First note');
    await user.click(screen.getByRole('button', { name: /save note/i }));

    const trigger = screen.getByRole('button', { name: /export/i });
    expect(trigger).toBeEnabled();
    expect(trigger).toHaveAttribute('aria-disabled', 'false');
    await user.click(trigger);
    expect(screen.getByRole('menuitem', { name: /markdown/i })).toBeEnabled();
    expect(screen.getByRole('menuitem', { name: /pdf/i })).toHaveAttribute('aria-disabled', 'false');
  });
});
