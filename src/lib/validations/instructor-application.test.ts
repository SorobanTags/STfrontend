import { describe, expect, it } from 'vitest';
import { instructorApplicationSchema } from './instructor-application';

const validPayload = {
  name: 'Ada Okafor',
  email: 'ada@example.com',
  expertiseArea: 'Tailoring',
  portfolioUrl: 'https://example.com/portfolio',
  bio: 'Ten years of professional tailoring experience.',
};

describe('instructorApplicationSchema', () => {
  it('parses a valid payload', () => {
    const result = instructorApplicationSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toEqual(validPayload);
  });

  it.each(Object.keys(validPayload))('reports an issue for a missing %s', (field) => {
    const payload: Record<string, unknown> = { ...validPayload };
    delete payload[field];

    const result = instructorApplicationSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path[0] === field)).toBe(true);
    }
  });

  it.each([
    ['name', 'A', 'Name is required'],
    ['email', 'not-an-email', 'Invalid email address'],
    ['expertiseArea', 'x', 'Expertise area is required'],
    ['portfolioUrl', 'not a url', 'Please enter a valid URL'],
    ['bio', 'too short', 'Bio must be at least 10 characters'],
  ])('rejects an invalid %s with the documented message', (field, value, message) => {
    const result = instructorApplicationSchema.safeParse({ ...validPayload, [field]: value });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === field);
      expect(issue?.message).toBe(message);
    }
  });
});
