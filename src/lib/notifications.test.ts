import { describe, expect, it } from 'vitest';
import {
  TYPE_COLORS,
  getNotificationTypeColor,
  getNotificationTypeLabel,
} from './notifications';

describe('getNotificationTypeColor', () => {
  it('returns the mapped colour for known types', () => {
    expect(getNotificationTypeColor('COURSE_APPROVED')).toBe(TYPE_COLORS.COURSE_APPROVED);
    expect(getNotificationTypeColor('ASSIGNMENT_SUBMITTED')).toBe('bg-blue-50 text-blue-700');
  });

  it('returns the announcement colour for COURSE_ANNOUNCEMENT', () => {
    expect(getNotificationTypeColor('COURSE_ANNOUNCEMENT')).toBe('bg-blue-50 text-blue-700');
  });

  it('falls back for unknown types', () => {
    expect(getNotificationTypeColor('SOMETHING_NEW')).toBe('bg-ink-100 text-ink-600');
    expect(getNotificationTypeColor('')).toBe('bg-ink-100 text-ink-600');
  });
});

describe('getNotificationTypeLabel', () => {
  it('humanises known types', () => {
    expect(getNotificationTypeLabel('COURSE_APPROVED')).toBe('course approved');
    expect(getNotificationTypeLabel('PAYMENT_RECEIVED')).toBe('payment received');
  });

  it('special-cases COURSE_ANNOUNCEMENT', () => {
    expect(getNotificationTypeLabel('COURSE_ANNOUNCEMENT')).toBe('announcement');
  });

  it('humanises unknown types', () => {
    expect(getNotificationTypeLabel('SOMETHING_NEW')).toBe('something new');
    expect(getNotificationTypeLabel('SINGLE')).toBe('single');
  });
});
