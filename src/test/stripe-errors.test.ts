import { describe, expect, it } from 'vitest';
import { FALLBACK_MESSAGE, friendlyStripeError } from '@/lib/stripe/errors';
import { PaymentDeclinedError, simulatePaymentConfirmation } from '@/lib/stripe/simulate';
import type {
  CardDeclinedError,
  StripeDeclineCode,
  StripeErrorCode,
  StripeErrorType,
  TypedStripeError,
} from '@/lib/stripe/types';

describe('friendlyStripeError', () => {
  it('prefers the decline code over the generic card_declined message', () => {
    const message = friendlyStripeError({
      code: 'card_declined',
      decline_code: 'lost_card',
      message: 'Your card was declined.',
    });

    expect(message).toMatch(/reported lost/i);
  });

  it('falls back to the error code when there is no decline code', () => {
    expect(friendlyStripeError({ code: 'incorrect_cvc' })).toMatch(/security code/i);
  });

  it('hides infrastructure failures behind a neutral message', () => {
    const message = friendlyStripeError({
      type: 'authentication_error',
      message: 'Invalid API Key provided: sk_test_***',
    });

    expect(message).toMatch(/temporarily unavailable/i);
    expect(message).not.toMatch(/API Key/i);
  });

  it('never returns an empty string for unknown failures', () => {
    expect(friendlyStripeError(new Error('boom'))).toMatch(/couldn't process your payment/i);
    expect(friendlyStripeError(undefined)).toMatch(/couldn't process your payment/i);
  });
});

describe('simulatePaymentConfirmation', () => {
  it('resolves for a card that is not a declined test card', async () => {
    await expect(
      simulatePaymentConfirmation({ id: 'pm_1', card: { last4: '4242' } } as never),
    ).resolves.toBeUndefined();
  });

  it('rejects Stripe test cards with the matching decline code', async () => {
    const error = await simulatePaymentConfirmation({
      id: 'pm_2',
      card: { last4: '9995' },
    } as never).catch((thrown) => thrown);

    expect(error).toBeInstanceOf(PaymentDeclinedError);
    expect(error.code).toBe('card_declined');
    expect(error.decline_code).toBe('insufficient_funds');
    expect(friendlyStripeError(error)).toMatch(/enough funds/i);
  });
});

// ── Discriminated union type tests ───────────────────────────────────────────
//
// These tests verify that the discriminated union types work correctly at
// runtime and that TypeScript can narrow them at compile time.

describe('TypedStripeError discriminated unions', () => {
  it('accepts a well-typed decline code on a card_declined error', () => {
    const error: TypedStripeError = {
      code: 'card_declined',
      decline_code: 'insufficient_funds',
    };

    // Type narrowing: after checking `code` the compiler knows `decline_code`
    // is a StripeDeclineCode, not an arbitrary string.
    expect(error.code).toBe('card_declined');
    expect(error.decline_code).toBe('insufficient_funds');
    expect(friendlyStripeError(error)).toMatch(/enough funds/i);
  });

  it('accepts a well-typed error code without a decline code', () => {
    const error: TypedStripeError = { code: 'expired_card' };

    expect(friendlyStripeError(error)).toMatch(/expired/i);
  });

  it('CardDeclinedError union narrows correctly for the with-code branch', () => {
    const error: CardDeclinedError = {
      code: 'card_declined',
      decline_code: 'stolen_card',
    };

    if (error.decline_code) {
      // TypeScript knows decline_code is StripeDeclineCode here.
      const dc: StripeDeclineCode = error.decline_code;
      expect(dc).toBe('stolen_card');
    }

    expect(friendlyStripeError(error)).toMatch(/stolen/i);
  });

  it('PaymentDeclinedError carries typed code and decline_code fields', () => {
    const err = new PaymentDeclinedError('card_declined', 'lost_card');

    // Verify TypeScript type compatibility — these assignments would fail to
    // compile if the types were plain strings.
    const code: StripeErrorCode = err.code;
    const dc: StripeDeclineCode | undefined = err.decline_code;

    expect(code).toBe('card_declined');
    expect(dc).toBe('lost_card');
    expect(err).toBeInstanceOf(PaymentDeclinedError);
    expect(friendlyStripeError(err)).toMatch(/reported lost/i);
  });

  it('PaymentDeclinedError works without a decline code', () => {
    const err = new PaymentDeclinedError('processing_error');

    const code: StripeErrorCode = err.code;
    const dc: StripeDeclineCode | undefined = err.decline_code;

    expect(code).toBe('processing_error');
    expect(dc).toBeUndefined();
    expect(friendlyStripeError(err)).toMatch(/wait a moment/i);
  });

  it('friendlyStripeError returns the fallback for a completely unknown object', () => {
    expect(friendlyStripeError({ something: 'weird' })).toMatch(/couldn't process your payment/i);
  });

  it('friendlyStripeError passes through validation_error messages verbatim', () => {
    const error: TypedStripeError = {
      type: 'validation_error',
      message: 'Your postal code is incomplete.',
    };

    expect(friendlyStripeError(error)).toBe('Your postal code is incomplete.');
  });
});

// ── Message-table coverage ───────────────────────────────────────────────────
//
// The literal unions in types.ts and the message tables in errors.ts must stay
// in sync. The arrays below are checked against the unions at compile time, so
// adding a code to a union without listing it here fails type-checking, and
// the loops fail at runtime if a listed code has no message.

/** `true` only when every member of `Union` appears in `Listed`. */
type CoversUnion<Union, Listed> = [Exclude<Union, Listed>] extends [never] ? true : false;

const declineCodes = [
  'insufficient_funds',
  'lost_card',
  'stolen_card',
  'expired_card',
  'incorrect_cvc',
  'card_velocity_exceeded',
  'currency_not_supported',
  'do_not_honor',
  'transaction_not_allowed',
  'fraudulent',
  'generic_decline',
  'authentication_required',
  'card_not_supported',
  'incorrect_number',
  'invalid_account',
  'pickup_card',
  'processing_error',
  'try_again_later',
  'withdrawal_count_limit_exceeded',
] as const satisfies readonly StripeDeclineCode[];

const errorCodes = [
  'card_declined',
  'expired_card',
  'incorrect_cvc',
  'invalid_cvc',
  'incorrect_number',
  'invalid_number',
  'invalid_expiry_month',
  'invalid_expiry_year',
  'incomplete_number',
  'incomplete_expiry',
  'incomplete_cvc',
  'processing_error',
  'authentication_required',
  'rate_limit',
  'api_key_expired',
  'card_decline_rate_limit_exceeded',
  'payment_intent_authentication_failure',
] as const satisfies readonly StripeErrorCode[];

const infrastructureErrorTypes = [
  'api_connection_error',
  'api_error',
  'authentication_error',
  'idempotency_error',
  'invalid_request_error',
] as const satisfies readonly StripeErrorType[];

const allDeclineCodesListed: CoversUnion<StripeDeclineCode, (typeof declineCodes)[number]> = true;
const allErrorCodesListed: CoversUnion<StripeErrorCode, (typeof errorCodes)[number]> = true;

const NEUTRAL_INFRASTRUCTURE_MESSAGE =
  'Card payments are temporarily unavailable. Please try again in a moment or contact support.';

describe('Stripe message tables', () => {
  it('lists every StripeDeclineCode and StripeErrorCode', () => {
    expect(allDeclineCodesListed).toBe(true);
    expect(allErrorCodesListed).toBe(true);
  });

  it.each(declineCodes)('maps decline code %s to a non-empty message', (declineCode) => {
    const message = friendlyStripeError({ code: 'card_declined', decline_code: declineCode });

    expect(message.trim()).not.toBe('');
    expect(message).not.toBe(FALLBACK_MESSAGE);
  });

  it.each(errorCodes)('maps error code %s to a non-empty message', (code) => {
    const message = friendlyStripeError({ code });

    expect(message.trim()).not.toBe('');
    expect(message).not.toBe(FALLBACK_MESSAGE);
  });

  it('returns the Stripe-supplied message verbatim for validation_error', () => {
    expect(friendlyStripeError({ type: 'validation_error', message: 'x' })).toBe('x');
  });

  it.each(infrastructureErrorTypes)(
    'returns the neutral fallback for infrastructure error type %s',
    (type) => {
      const message = friendlyStripeError({ type, message: 'No such API key: sk_test_123' });

      expect(message).toBe(NEUTRAL_INFRASTRUCTURE_MESSAGE);
      expect(message).not.toContain('sk_test_123');
    },
  );
});
