import { describe, expect, it } from 'vitest';

import { metadata as signupMetadata } from './layout';
import { metadata as authSignupMetadata } from '../auth/signup/layout';

describe('signup route metadata', () => {
  it('keeps the canonical on /signup', () => {
    expect(signupMetadata.alternates?.canonical).toMatch(/\/signup$/);
  });

  it('gives /auth/signup its own canonical', () => {
    expect(authSignupMetadata.alternates?.canonical).toMatch(/\/auth\/signup$/);
  });
});
