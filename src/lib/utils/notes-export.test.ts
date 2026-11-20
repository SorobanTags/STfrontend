import { describe, it, expect } from 'vitest';
import { notesFilename, notesToMarkdown, type ExportableNote } from './notes-export';

const note = (timestamp: number, text: string): ExportableNote => ({
  timestamp,
  text,
  createdAt: '2026-01-01T00:00:00.000Z',
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
