import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi, afterEach } from 'vitest';
import AboutPage from '../page';

// TopBar pulls in auth/notification stores that are irrelevant to these assertions
vi.mock('@/components/layout/TopBar', () => ({
  TopBar: () => <div data-testid="topbar" />,
}));

// jsdom has no IntersectionObserver — same stub used in AnimatedCounter.test.tsx
// @ts-expect-error - jsdom has no IntersectionObserver
global.IntersectionObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const TEAM_MEMBERS = [
  'Ava Chen',
  'Kwame Asante',
  'Zainab Mohammed',
  'James Okonkwo',
  'Amara Diallo',
  'Chioma Ugwu',
];

describe('AboutPage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the hero heading', () => {
    render(<AboutPage />);

    expect(
      screen.getByRole('heading', { name: /Empowering Africa with practical skills/i })
    ).toBeInTheDocument();
  });

  it('renders the Our Story heading', () => {
    render(<AboutPage />);

    expect(screen.getByText('Our Story')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Founded in 2022/i })).toBeInTheDocument();
  });

  it('renders all six team member names', () => {
    render(<AboutPage />);

    for (const name of TEAM_MEMBERS) {
      expect(screen.getByRole('heading', { name })).toBeInTheDocument();
    }
  });
});
