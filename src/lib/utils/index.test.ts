import { describe, expect, it } from 'vitest';
import {
  courseStatusBadge,
  courseTotalMins,
  formatDuration,
  formatUsdc,
  generateCourseId,
  levelChip,
  shortAddress,
  stroopsToUsdc,
  usdcToStroops,
} from '@/lib/utils';
import type { CourseStatus } from '@/types';

describe('usdcToStroops', () => {
  it('converts decimal amounts to stroops', () => {
    expect(usdcToStroops('1.5')).toBe(15_000_000n);
    expect(usdcToStroops(2)).toBe(20_000_000n);
    expect(usdcToStroops('0')).toBe(0n);
  });

  it('pads short fractions and truncates beyond 7 digits', () => {
    expect(usdcToStroops('0.0000001')).toBe(1n);
    expect(usdcToStroops('1.12345678')).toBe(11_234_567n);
  });
});

describe('stroopsToUsdc', () => {
  it('accepts bigint and string inputs', () => {
    expect(stroopsToUsdc(15_000_000n)).toBe('1.50');
    expect(stroopsToUsdc('15000000')).toBe('1.50');
    expect(stroopsToUsdc(0n)).toBe('0.00');
  });

  it('pads the remainder so small fractions are kept', () => {
    expect(stroopsToUsdc(1_000_000n)).toBe('0.10');
    expect(stroopsToUsdc(500_000n)).toBe('0.05');
  });

  it('round-trips with usdcToStroops', () => {
    for (const x of ['0.00', '1.00', '1.50', '12.34', '0.05', '1000.99']) {
      expect(stroopsToUsdc(usdcToStroops(x))).toBe(x);
    }
  });
});

describe('formatUsdc', () => {
  it('formats numbers and strings with two decimals', () => {
    expect(formatUsdc(5)).toBe('$5.00');
    expect(formatUsdc('12.345')).toBe('$12.35');
  });
});

describe('formatDuration', () => {
  it('formats durations under one hour as m:ss', () => {
    expect(formatDuration(0)).toBe('0:00');
    expect(formatDuration(65)).toBe('1:05');
    expect(formatDuration(3599)).toBe('59:59');
  });

  it('formats durations of one hour or more as h:mm:ss', () => {
    expect(formatDuration(3600)).toBe('1:00:00');
    expect(formatDuration(3661)).toBe('1:01:01');
  });
});

describe('courseTotalMins', () => {
  it('rounds up to the next minute', () => {
    expect(courseTotalMins(0)).toBe(0);
    expect(courseTotalMins(60)).toBe(1);
    expect(courseTotalMins(61)).toBe(2);
  });
});

describe('shortAddress', () => {
  const addr = 'GABCDEFGHIJKLMNOPQRSTUVWXYZ';

  it('keeps the head and tail of the address', () => {
    expect(shortAddress(addr)).toBe('GABCD...WXYZ');
    expect(shortAddress(addr, 2)).toBe('GAB...YZ');
  });

  it('returns an empty string for empty input', () => {
    expect(shortAddress('')).toBe('');
  });
});

describe('generateCourseId', () => {
  it('builds an ID from the category and a random suffix', () => {
    expect(generateCourseId('Web Dev')).toMatch(/^COURSE-WEB-DEV-[A-Z0-9]{4}$/);
  });

  it('truncates long categories to 8 characters', () => {
    expect(generateCourseId('blockchain development')).toMatch(/^COURSE-BLOCKCHA-[A-Z0-9]{4}$/);
  });
});

describe('courseStatusBadge', () => {
  it('maps each status to its badge class', () => {
    expect(courseStatusBadge('DRAFT')).toBe('badge-draft');
    expect(courseStatusBadge('ACTIVE')).toBe('badge-active');
  });

  it('falls back to the generic badge for unknown statuses', () => {
    expect(courseStatusBadge('UNKNOWN' as CourseStatus)).toBe('badge');
  });
});

describe('levelChip', () => {
  it('maps known levels to chip classes', () => {
    expect(levelChip('Beginner')).toBe('chip-beginner');
    expect(levelChip('Intermediate')).toBe('chip-intermediate');
    expect(levelChip('Advanced')).toBe('chip-advanced');
  });

  it('falls back to the generic badge for unknown levels', () => {
    expect(levelChip('Expert')).toBe('badge');
  });
});
