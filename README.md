# SorobanLard — Frontend Repo

> **Next.js 14 frontend for Africa's practical skills online learning platform**

This is **Repo 3 of 3** in the SorobanLard project:

| Repo | Description |
|------|-------------|
| `sorobanlard-contract` | Soroban smart contract — course payments + certificates |
| `sorobanlard-backend` | NestJS API — content, progress, users |
| `sorobanlard-frontend` ← you are here | Next.js 14 — student and instructor portal |

---

## Pages

| Route | Auth | Description |
|---|---|---|
| `/` | — | Public course marketplace with search and category filters |
| `/auth/login` | — | Freighter wallet connect with student/instructor role selection |
| `/dashboard/courses` | ✓ | Student: enrolled courses. Instructor: redirects to instructor dashboard |
| `/dashboard/courses/:id` | — | Course detail page — overview, curriculum, enroll button |
| `/dashboard/courses/:id/learn` | ✓ | Video player with lesson sidebar, progress tracking, completion |
| `/dashboard/courses/create` | ✓ INSTRUCTOR | Create course form with on-chain registration |
| `/dashboard/instructor` | ✓ INSTRUCTOR | Revenue stats + my courses list |
| `/dashboard/certificates` | ✓ | Student's earned certificates with copy + share links |
| `/certificates/:id` | — | **Public** certificate verification page (no login needed) |
| `/notifications` | ✓ | Notification feed with colour-coded types |

---

## Design System

SorobanLard's foundational token system is documented in:

- `src/styles/tokens.css` (source of truth for CSS variables)
- [`design-system-tokens.md`](design-system-tokens.md) (token layers, adding new tokens, WCAG checks)
- `typography-system.md` (modular type scale and semantic text roles)

**Typography:**
- Display headings: Playfair Display (serif)
- Body: DM Sans
- Code/IDs: JetBrains Mono

---

## Key Features

**Public course marketplace** (`/`) — browse, search, and filter active courses by category and level without signing in. The homepage shows a category pill bar with all eight SorobanLard skill areas.

**Role-aware login** (`/auth/login`) — the login page has a student/instructor toggle. First-time users pick their role here and it is set on their account.

**Course learn page** (`/dashboard/courses/:id/learn`) — full-screen layout with a lesson sidebar (modules expanded/collapsed, completed lessons marked with checkmarks) and a main content area with the video player. Students click "Mark complete" after each lesson. Progress percentage updates live.

**Certificate verification page** (`/certificates/:id`) — a public, shareable page showing a gold certificate with the student's name, course title, instructor, issue date, and blockchain verification status. Uses server-side rendering for fast sharing.

**Instructor course creation** — three-step flow: fill in course details → upload thumbnail → register on Stellar via Freighter → submit for admin review. The form generates a unique `courseId` automatically.

---

## Setup

```bash
cp .env.example .env.local   # fill in contract ID + backend URL
npm install
npm run dev                   # → http://localhost:3001
```

Install [Freighter](https://freighter.app) and switch it to Testnet.

For the contract ID, network, and wallet settings, see [docs/stellar-integration.md](docs/stellar-integration.md).

---

## Testing

### Unit & Component Tests (Vitest)

```bash
npm run test
```

### End-to-End Tests (Playwright)

For the stable CI gate, the repository runs the functional E2E suite on Chromium
only. Cross-browser Playwright runs remain available locally for broader smoke
coverage:

```bash
npm run test:e2e:ci
```

Run the full browser matrix locally:

```bash
npm run test:e2e:full
```

Open the Playwright UI for interactive test authoring and debugging:

```bash
npm run test:e2e:ui
```

### Visual Regression Tests

Visual regression tests use Playwright's `toHaveScreenshot` to catch accidental layout changes on the homepage and course detail page. Baseline screenshots are stored in `e2e/screenshots/`.

#### Run visual tests only

```bash
npx playwright test --project=visual
```

This runs tests tagged with `@visual` across three viewports:
- **Mobile**: 375px × 667px
- **Tablet**: 768px × 1024px
- **Desktop**: 1280px × 800px

#### Update baseline screenshots

After making intentional UI changes, regenerate and commit the new baselines:

```bash
npx playwright test --project=visual --update-snapshots
```

Then commit the updated files in `e2e/screenshots/` to the repository.

> **Note:** The visual project is excluded from the standard E2E CI run until Linux baseline screenshots are committed. Generate baselines on Ubuntu Linux so platform-specific rendering differences do not cause false failures.

#### CI Integration

Functional E2E tests run automatically in GitHub Actions on every push and pull request using the Chromium project. When visual baselines are available, run the visual project separately. Failed E2E runs upload:
- The Playwright HTML report (with side-by-side diffs)
- Test traces for debugging

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for local setup, branch and commit conventions, running
Storybook, and the PR checklist.

---

## Feature Specs (`.kiro/`)

`.kiro/specs/` contains feature design documents written with the [Kiro](https://kiro.dev) spec workflow. Each folder holds the design for one feature:

- `cart-checkout/`
- `notification-system/`
- `responsive-breakpoints/`
- `user-profile-settings/`
- `video-player/` (includes `bugfix.md` and `tasks.md`)

These are reference documents for contributors. The build, tests, and tooling do not read them. Task checklists in `tasks.md` may not match the current code, so verify against `src/` before relying on them. Update a spec when its feature design changes.

---

## Archived Code (`_app_backup/`)

`_app_backup/` holds one archived page, `instructor/dashboard/page.tsx`, with placeholder revenue data. The app does not use it. It sits outside `src/app/`, so Next.js does not route it, and nothing imports it. You can safely ignore it.

`tsconfig.json` still includes every `.tsx` file, so TypeScript checks this page with the rest of the project. Keep it type-correct until someone removes the directory.

---

## License

MIT

## Robots.txt

Next.js generates `/robots.txt` from `src/app/robots.ts` using the App Router Metadata API. Public routes (`/`, `/courses`, `/categories/*`, `/about`, `/teach`, and `/teams`) are allowed; dashboard, checkout, API, authentication, and Next.js internal paths are disallowed. The generated file advertises `https://sorobanlard.com/sitemap.xml`.
