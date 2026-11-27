import { beforeEach, describe, expect, it, vi } from 'vitest';

const getCourseForMetadata = vi.fn();

vi.mock('./api/server', () => ({ getCourseForMetadata }));

vi.mock('next/og', () => ({
  ImageResponse: class {
    constructor(
      public element: unknown,
      public options: unknown,
    ) {}
  },
}));

import { renderCourseOgImage, truncate } from './og';

describe('truncate', () => {
  it('returns the value unchanged when it fits', () => {
    expect(truncate('Short title', 80)).toBe('Short title');
    expect(truncate('Exactly ten', 11)).toBe('Exactly ten');
  });

  it('cuts at a word boundary when one is late enough', () => {
    const value = 'Learn advanced tailoring and pattern making for beginners';
    const result = truncate(value, 40);
    expect(result).toBe('Learn advanced tailoring and pattern…');
    expect(result.endsWith('…')).toBe(true);
    expect(result.length).toBeLessThanOrEqual(41);
  });

  it('hard-cuts when no late word boundary exists', () => {
    const value = 'Supercalifragilisticexpialidociousandthensomemoreletters';
    expect(truncate(value, 20)).toBe('Supercalifragilistic…');
  });
});

describe('renderCourseOgImage', () => {
  beforeEach(() => {
    getCourseForMetadata.mockReset();
  });

  it('falls back to the generic card when the course is missing', async () => {
    getCourseForMetadata.mockResolvedValue(null);

    const response = await renderCourseOgImage('missing-course');

    expect(getCourseForMetadata).toHaveBeenCalledWith('missing-course');
    expect(response).toBeInstanceOf(Object);
    expect((response as unknown as { options: unknown }).options).toEqual({
      width: 1200,
      height: 630,
    });
  });
});
