# Implementation plans: issues #18–#21

Planning notes only, based on the issue descriptions provided. No source changes are included.
Each issue should be implemented and reviewed separately unless maintainers prefer otherwise.

| Issue | Area | Type |
|---|---|---|
| #18 | Quiz timer auto-submit and question randomization | Component tests |
| #19 | Stable terms-page last-updated date | Hydration / deterministic rendering |
| #20 | Teams quote-request form validation and submission | Component tests |
| #21 | Quiz shuffle helper contracts | Unit tests |

Suggested order: #21, #18, #20, then #19. The test-only issues can be handled independently;
#19 includes a small production change to make the rendered date deterministic.

---

## #21: Vitest coverage for quiz shuffle helpers

### Scope

Extend `src/lib/quiz.test.ts` to cover the documented contracts of `shuffleQuestions` and
`resolveQuizOrder`.

### Test plan

- Verify shuffling returns a new array containing the same elements and does not mutate the input.
- Supply a deterministic `random` stub and assert the exact resulting order.
- Verify `resolveQuizOrder` returns the original array reference when randomization is disabled.
- Verify arrays of length zero and one are returned unchanged.

### Verification

Run `npm run test`.

---

## #20: Teams quote-request form validation and submission tests

### Scope

Extend `src/app/teams/__tests__/page.test.tsx` to cover validation and the simulated asynchronous
submission flow in `src/app/teams/page.tsx`.

### Test plan

- Render the page inside `ToastProvider`, so `useToastContext` is available.
- Submit an empty company name and assert the required-field error.
- Submit an invalid work email and assert the email validation error.
- For valid values, assert the submitting state, advance fake timers by the 600 ms delay, and
  assert the submitted state and success toast.
- Locate inputs by label and the submit control by role.

### Verification

Run `npx vitest run src/app/teams/__tests__/page.test.tsx`.

---

## #18: Quiz timer auto-submit and randomization tests

### Scope

Extend `src/components/courses/Quiz.test.tsx` for the timeout and `randomizeQuestions` behavior
described in the issue.

### Test plan

- Use fake timers to advance past `timeLimitSeconds` and assert that the result summary appears.
- Cover an answer submitted before timeout and assert timeout does not count it a second time.
- Mock `shuffleQuestions` to return a known order; enable randomization and assert the rendered
  question order matches it.
- Assert the order remains stable during the attempt rather than being reshuffled on rerender.

### Verification

Run `npx vitest run src/components/courses/Quiz.test.tsx`.

---

## #19: Deterministic terms-page last-updated date

### Scope

Replace the render-time clock-dependent date in `src/app/terms/page.tsx` with a fixed,
deterministic value, and add `src/app/terms/__tests__/page.test.tsx`.

### Test plan

- Assert the rendered “Last updated” text matches the chosen fixed date.
- Render under different system-clock values and assert the displayed text is identical.

### Verification

Run `npx vitest run src/app/terms/__tests__/page.test.tsx` and `npm run lint`.

---

## Shared notes

- Use existing Vitest and React Testing Library conventions in the target test files.
- Keep each issue’s changes limited to the named component/helper and its directly related tests.
- Run the focused test command first; run the broader suite where the issue’s acceptance criteria
  require it.
