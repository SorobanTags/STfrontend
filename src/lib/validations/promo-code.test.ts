import { describe, expect, it } from 'vitest';
import { promoCodeSchema } from './promo-code';

const futureDate = () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

const validPayload = () => ({
  code: 'save20',
  discountType: 'PERCENTAGE' as const,
  discountValue: 20,
  expiryDate: futureDate(),
  maxUses: 50,
});

function messageFor(payload: Record<string, unknown>, field: string) {
  const result = promoCodeSchema.safeParse(payload);
  expect(result.success).toBe(false);
  return result.success ? undefined : result.error.issues.find((i) => i.path[0] === field)?.message;
}

describe('promoCodeSchema', () => {
  it('parses a valid payload and upper-cases the code', () => {
    const result = promoCodeSchema.safeParse(validPayload());
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.code).toBe('SAVE20');
  });

  it.each(['code', 'discountType', 'discountValue', 'expiryDate', 'maxUses'])(
    'reports an issue for a missing %s',
    (field) => {
      const payload: Record<string, unknown> = { ...validPayload() };
      delete payload[field];

      const result = promoCodeSchema.safeParse(payload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((issue) => issue.path[0] === field)).toBe(true);
      }
    },
  );

  it('rejects a negative discount value', () => {
    expect(messageFor({ ...validPayload(), discountValue: -5 }, 'discountValue')).toBe(
      'Discount value must be greater than 0.',
    );
  });

  it('rejects a discount value over 100', () => {
    expect(messageFor({ ...validPayload(), discountValue: 101 }, 'discountValue')).toBe(
      'Percentage discounts cannot exceed 100%.',
    );
  });

  it('rejects an unknown discount type', () => {
    expect(messageFor({ ...validPayload(), discountType: 'BOGUS' }, 'discountType')).toBe(
      'Select either percentage or fixed discount.',
    );
  });

  it('rejects codes outside the 3 to 20 character range', () => {
    expect(messageFor({ ...validPayload(), code: '' }, 'code')).toBe('Code is required.');
    expect(messageFor({ ...validPayload(), code: 'ab' }, 'code')).toBe(
      'Code must be at least 3 characters.',
    );
    expect(messageFor({ ...validPayload(), code: 'A'.repeat(21) }, 'code')).toBe(
      'Code must be at most 20 characters.',
    );
  });

  it('rejects an empty or past expiry date', () => {
    expect(messageFor({ ...validPayload(), expiryDate: '' }, 'expiryDate')).toBe(
      'Expiry date is required.',
    );
    expect(
      messageFor({ ...validPayload(), expiryDate: '2000-01-01T00:00:00.000Z' }, 'expiryDate'),
    ).toBe('Expiry date must be in the future.');
  });

  it('rejects a malformed expiry date', () => {
    expect(messageFor({ ...validPayload(), expiryDate: 'not-a-date' }, 'expiryDate')).toBe(
      'Expiry date must be in the future.',
    );
  });

  it('rejects non-integer or non-positive max uses', () => {
    expect(messageFor({ ...validPayload(), maxUses: 1.5 }, 'maxUses')).toBe(
      'Max uses must be a whole number.',
    );
    expect(messageFor({ ...validPayload(), maxUses: 0 }, 'maxUses')).toBe(
      'Max uses must be at least 1.',
    );
  });
});
