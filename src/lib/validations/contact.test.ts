import { describe, expect, it } from "vitest";
import { contactFormSchema } from "./contact";

const validPayload = {
  name: "Ada Lovelace",
  email: "ada@example.com",
  subject: "General" as const,
  message: "I would like to know more about the courses.",
};

describe("contactFormSchema", () => {
  it("parses a valid payload successfully", () => {
    const result = contactFormSchema.safeParse(validPayload);

    expect(result.success).toBe(true);
  });

  it.each(["name", "email", "subject", "message"] as const)(
    "reports a missing %s field",
    (field) => {
      const payload: Record<string, unknown> = { ...validPayload };
      delete payload[field];

      const result = contactFormSchema.safeParse(payload);

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error.issues.some((issue) => issue.path[0] === field)).toBe(
        true,
      );
    },
  );

  it("rejects an out-of-enum subject value", () => {
    const result = contactFormSchema.safeParse({
      ...validPayload,
      subject: "Spam",
    });

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues.some((issue) => issue.path[0] === "subject")).toBe(
      true,
    );
  });
});
