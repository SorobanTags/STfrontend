import { describe, it, expect } from 'vitest';
import {
  formatTimestamp,
  notesFilename,
  notesToMarkdown,
  type ExportableNote,
} from './notes-export';

const note = (timestamp: number, text: string): ExportableNote => ({
  timestamp,
  text,
  createdAt: '2026-01-01T00:00:00.000Z',
});

describe('formatTimestamp', () => {
  it('floors fractional timestamps', () => {
    expect(formatTimestamp(12.9)).toBe(12);
  });

  it('normalises NaN and non-finite timestamps to zero', () => {
    expect(formatTimestamp(NaN)).toBe(0);
    expect(formatTimestamp(Infinity)).toBe(0);
    expect(formatTimestamp(-Infinity)).toBe(0);
  });

  it('normalises negative timestamps to zero', () => {
    expect(formatTimestamp(-42)).toBe(0);
  });

  it('keeps valid timestamps unchanged', () => {
    expect(formatTimestamp(0)).toBe(0);
    expect(formatTimestamp(3661)).toBe(3661);
  });
});

describe('notesToMarkdown', () => {
  it('keeps commas, double quotes and newlines in note text intact', () => {
    const md = notesToMarkdown([note(5, 'a, b "quoted"\nsecond line')], {});
    expect(md).toContain('a, b "quoted"\nsecond line');
  });

  it('trims surrounding whitespace from note text', () => {
    expect(notesToMarkdown([note(1, '  padded  ')])).toContain('\npadded\n');
  });

  it('produces a well-formed export for an empty notes list', () => {
    const md = notesToMarkdown([]);
    expect(md.startsWith('# Lecture Notes')).toBe(true);
    expect(md).toContain('0 notes');
    expect(md).not.toContain('## [');
  });

  it('uses the singular for exactly one note', () => {
    expect(notesToMarkdown([note(1, 'x')])).toContain('· 1 note_');
  });

  it('orders notes by video timestamp, not input order', () => {
    const md = notesToMarkdown([note(90, 'later'), note(10, 'earlier')]);
    expect(md.indexOf('earlier')).toBeLessThan(md.indexOf('later'));
  });

  it('includes lecture and course titles when provided', () => {
    const md = notesToMarkdown([], { lectureTitle: 'Intro', courseTitle: 'Baking 101' });
    expect(md).toContain('# Notes: Intro');
    expect(md).toContain('**Course:** Baking 101');
  });

  it('renders NaN and negative timestamps as 0:00', () => {
    const md = notesToMarkdown([note(NaN, 'nan note'), note(-30, 'negative note')]);
    expect(md).toContain('## [0:00]');
    expect(md).not.toContain('NaN');
    expect(md).not.toContain('-1:');
  });

  it('does not let an injection attempt in the timestamp field reach the output', () => {
    const md = notesToMarkdown([note('<script>alert(1)</script>' as unknown as number, 'x')]);
    expect(md).not.toContain('<script>');
    expect(md).toContain('## [0:00]');
  });

  it('orders notes ascending after normalising timestamps', () => {
    const md = notesToMarkdown([note(120, 'third'), note(NaN, 'first'), note(60, 'second')]);
    expect(md.indexOf('first')).toBeLessThan(md.indexOf('second'));
    expect(md.indexOf('second')).toBeLessThan(md.indexOf('third'));
  });
});

describe('notesFilename', () => {
  it('slugifies course and lecture titles into the filename', () => {
    expect(
      notesFilename({ courseTitle: 'Baking 101!', lectureTitle: 'Intro & Basics' }, 'fallback', 'md'),
    ).toBe('notes-baking-101-intro-basics.md');
  });

  it('falls back to the given identifier when no titles exist', () => {
    expect(notesFilename({}, 'lesson-42', 'pdf')).toBe('notes-lesson-42.pdf');
  });

  it('truncates very long slugs to 60 characters', () => {
    const name = notesFilename({ courseTitle: 'a'.repeat(200) }, 'x', 'md');
    expect(name).toBe(`notes-${'a'.repeat(60)}.md`);
  });
});
