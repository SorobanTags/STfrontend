import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const REFERENCE_DATE = new Date('2025-06-15T12:00:00.000Z');

function isoDate(offsetDays: number): string {
  const date = new Date(REFERENCE_DATE);
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

const validEmail = 'recipient@example.com';

describe('giftSchema', () => {
  let giftSchema: typeof import('./gift').giftSchema;

  beforeEach(async () => {
    vi.useFakeTimers();
    vi.setSystemTime(REFERENCE_DATE);
    // Import after freezing the clock so the module-level "today" is stable.
    ({ giftSchema } = await import('./gift'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.resetModules();
  });

  describe('deliveryDate', () => {
    it('rejects a delivery date in the past', () => {
      const result = giftSchema.safeParse({
        recipientEmail: validEmail,
        deliveryDate: isoDate(-1),
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          'Delivery date must be today or in the future.'
        );
      }
    });

    it('accepts a delivery date of today', () => {
      const result = giftSchema.safeParse({
        recipientEmail: validEmail,
        deliveryDate: isoDate(0),
      });

      expect(result.success).toBe(true);
    });

    it('accepts a delivery date in the future', () => {
      const result = giftSchema.safeParse({
        recipientEmail: validEmail,
        deliveryDate: isoDate(1),
      });

      expect(result.success).toBe(true);
    });

    it('rejects an empty delivery date', () => {
      const result = giftSchema.safeParse({
        recipientEmail: validEmail,
        deliveryDate: '',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Delivery date is required.');
      }
    });
  });

  describe('message', () => {
    it('accepts an empty-string message', () => {
      const result = giftSchema.safeParse({
        recipientEmail: validEmail,
        message: '',
        deliveryDate: isoDate(1),
      });

      expect(result.success).toBe(true);
    });

    it('accepts a message of exactly 500 characters', () => {
      const result = giftSchema.safeParse({
        recipientEmail: validEmail,
        message: 'a'.repeat(500),
        deliveryDate: isoDate(1),
      });

      expect(result.success).toBe(true);
    });

    it('rejects a message longer than 500 characters', () => {
      const result = giftSchema.safeParse({
        recipientEmail: validEmail,
        message: 'a'.repeat(501),
        deliveryDate: isoDate(1),
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          'Message cannot exceed 500 characters.'
        );
      }
    });
  });

  describe('recipientEmail', () => {
    it('rejects an invalid recipient email', () => {
      const result = giftSchema.safeParse({
        recipientEmail: 'not-an-email',
        deliveryDate: isoDate(1),
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Enter a valid email address.');
      }
    });

    it('rejects an empty recipient email', () => {
      const result = giftSchema.safeParse({
        recipientEmail: '',
        deliveryDate: isoDate(1),
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Recipient email is required.');
      }
    });
  });
});
