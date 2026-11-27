import { createRef } from 'react';
import { createRef } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import NotesPanel, { loadNotes, storageKey, type Note } from './NotesPanel';

const videoRef = createRef<HTMLVideoElement>();

function renderPanel() {
  return render(<NotesPanel courseId="c1" lectureId="l1" videoRef={videoRef} />);
}

function stored(courseId: string, lectureId: string): Note[] {
  return JSON.parse(localStorage.getItem(storageKey(courseId, lectureId)) ?? '[]');
}

function addNote(text: string) {
  fireEvent.change(screen.getByPlaceholderText(/Write a note/), { target: { value: text } });
  fireEvent.click(screen.getByRole('button', { name: /Save note/ }));
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

describe('NotesPanel persistence (#96)', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it('warns and renders empty when the stored value is corrupt', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    localStorage.setItem(storageKey('c1', 'l1'), 'not json');

    expect(() => render(<NotesPanel courseId="c1" lectureId="l1" videoRef={videoRef} />)).not.toThrow();

    expect(screen.getByText(/No notes yet/)).toBeInTheDocument();
    expect(warn).toHaveBeenCalled();
    expect(String(warn.mock.calls[0][0])).toContain(storageKey('c1', 'l1'));
  });

  it('warns on a stored value that is valid JSON but not a list', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    localStorage.setItem(storageKey('c1', 'l1'), '{"a":1}');
    expect(loadNotes('c1', 'l1')).toEqual([]);
    expect(warn).toHaveBeenCalled();
  });

  it('keeps a saved note under the original lecture after switching lectures', () => {
    const { rerender } = render(<NotesPanel courseId="c1" lectureId="A" videoRef={videoRef} />);
    addNote('note on lecture A');

    rerender(<NotesPanel courseId="c1" lectureId="B" videoRef={videoRef} />);

    expect(stored('c1', 'A').map((n) => n.text)).toEqual(['note on lecture A']);
    expect(localStorage.getItem(storageKey('c1', 'B'))).toBeNull();
    expect(screen.getByText(/No notes yet/)).toBeInTheDocument();
  });

  it('writes to the lecture the note was created in when props change before the write', () => {
    const { rerender } = render(<NotesPanel courseId="c1" lectureId="A" videoRef={videoRef} />);
    localStorage.setItem(storageKey('c1', 'B'), JSON.stringify([{ id: 'b1', timestamp: 0, text: 'B note', createdAt: '' }]));

    // Save and switch lecture in one batch: the state update lands after the
    // props have already changed to lecture B.
    act(() => {
      addNote('typed on A');
      rerender(<NotesPanel courseId="c1" lectureId="B" videoRef={videoRef} />);
    });

    expect(stored('c1', 'A').map((n) => n.text)).toEqual(['typed on A']);
    expect(stored('c1', 'B').map((n) => n.text)).toEqual(['B note']);
    expect(screen.getByText('B note')).toBeInTheDocument();
    expect(screen.queryByText('typed on A')).toBeNull();
  });

  it('loads each lecture its own notes on switch', () => {
    localStorage.setItem(storageKey('c1', 'B'), JSON.stringify([{ id: 'b1', timestamp: 5, text: 'B note', createdAt: '' }]));
    const { rerender } = render(<NotesPanel courseId="c1" lectureId="A" videoRef={videoRef} />);
    addNote('A note');
    rerender(<NotesPanel courseId="c1" lectureId="B" videoRef={videoRef} />);
    expect(screen.getByText('B note')).toBeInTheDocument();
    rerender(<NotesPanel courseId="c1" lectureId="A" videoRef={videoRef} />);
    expect(screen.getByText('A note')).toBeInTheDocument();
  });
});
  });
});
