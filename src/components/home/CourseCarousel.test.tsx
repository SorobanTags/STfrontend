import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Course } from '@/types';

vi.mock('@/lib/hooks/use-reduced-motion', () => ({
  useReducedMotion: vi.fn(),
}));

vi.mock('@/components/courses/CourseCard', () => ({
  CourseCard: ({ course }: { course: Course }) => <div data-testid="course-card">{course.title}</div>,
}));

import { CourseCarousel } from './CourseCarousel';
import { useReducedMotion } from '@/lib/hooks/use-reduced-motion';

const COURSES = Array.from({ length: 5 }, (_, i) => ({
  id: `c-${i + 1}`,
  title: `Course ${i + 1}`,
})) as unknown as Course[];

const CARD_WIDTH = 264;
const GAP = 16;
const STEP = CARD_WIDTH + GAP;
const CLIENT_WIDTH = 800;
const SCROLL_WIDTH = 1600;
const MAX_SCROLL = SCROLL_WIDTH - CLIENT_WIDTH;

let scrollLeft = 0;
let scrollBy: ReturnType<typeof vi.fn>;
let scrollTo: ReturnType<typeof vi.fn>;

function setScrollLeft(value: number) {
  scrollLeft = value;
  const el = screen.getByTestId('carousel-scroller');
  fireEvent.scroll(el);
}

function renderCarousel() {
  return render(
    <CourseCarousel title="Bestsellers" seeAllHref="/courses" courses={COURSES} />,
  );
}

beforeEach(() => {
  scrollLeft = 0;
  scrollBy = vi.fn();
  scrollTo = vi.fn();

  Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
    configurable: true,
    get() {
      return CLIENT_WIDTH;
    },
  });
  Object.defineProperty(HTMLElement.prototype, 'scrollWidth', {
    configurable: true,
    get() {
      return SCROLL_WIDTH;
    },
  });
  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
    configurable: true,
    get() {
      return CARD_WIDTH;
    },
  });
  Object.defineProperty(HTMLElement.prototype, 'scrollLeft', {
    configurable: true,
    get() {
      return scrollLeft;
    },
    set(value: number) {
      scrollLeft = value;
    },
  });
  HTMLElement.prototype.scrollBy = scrollBy as unknown as typeof HTMLElement.prototype.scrollBy;
  HTMLElement.prototype.scrollTo = scrollTo as unknown as typeof HTMLElement.prototype.scrollTo;
});

describe('CourseCarousel scroll state', () => {
  it('disables the prev arrow at scrollLeft === 0 and enables the next arrow', () => {
    renderCarousel();

    expect(screen.getByRole('button', { name: 'Scroll Bestsellers left' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Scroll Bestsellers right' })).toBeEnabled();
  });

  it('disables the next arrow at max scroll and enables the prev arrow', () => {
    renderCarousel();

    act(() => setScrollLeft(MAX_SCROLL));

    expect(screen.getByRole('button', { name: 'Scroll Bestsellers right' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Scroll Bestsellers left' })).toBeEnabled();
  });

  it('clamps the active dot to courses.length - 1', () => {
    renderCarousel();

    act(() => setScrollLeft(STEP * 99));

    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(COURSES.length);
    expect(tabs[COURSES.length - 1]).toHaveAttribute('aria-selected', 'true');
    expect(tabs.filter((tab) => tab.getAttribute('aria-selected') === 'true')).toHaveLength(1);
  });
});

describe('CourseCarousel swipe handling', () => {
  const swipe = (deltaX: number, deltaY = 0) => {
    const scroller = screen.getByTestId('carousel-scroller');
    fireEvent.touchStart(scroller, { touches: [{ clientX: 200, clientY: 200 }] });
    fireEvent.touchEnd(scroller, {
      changedTouches: [{ clientX: 200 + deltaX, clientY: 200 + deltaY }],
    });
  };

  it('does not scroll for a swipe shorter than 40px', () => {
    renderCarousel();

    swipe(-39);

    expect(scrollBy).not.toHaveBeenCalled();
  });

  it('scrolls forward for a leftward swipe of 40px or more', () => {
    renderCarousel();

    swipe(-40);

    expect(scrollBy).toHaveBeenCalledTimes(1);
    expect(scrollBy).toHaveBeenCalledWith({ left: STEP, behavior: 'smooth' });
  });

  it('scrolls backward for a rightward swipe of 40px or more', () => {
    renderCarousel();

    swipe(40);

    expect(scrollBy).toHaveBeenCalledTimes(1);
    expect(scrollBy).toHaveBeenCalledWith({ left: -STEP, behavior: 'smooth' });
  });
});

describe('CourseCarousel reduced motion autoplay', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, value: 500 });
    Object.defineProperty(HTMLElement.prototype, 'scrollWidth', { configurable: true, value: 2000 });
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, value: 200 });
    Element.prototype.scrollBy = vi.fn();
    Element.prototype.scrollTo = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('does not advance carousel on timer when useReducedMotion returns true', () => {
    vi.mocked(useReducedMotion).mockReturnValue({
      prefersReducedMotion: true,
      hasManualOverride: false,
      setManualOverride: vi.fn(),
      clearManualOverride: vi.fn(),
      mounted: true,
    });

    render(
      <CourseCarousel
        title="Featured Courses"
        seeAllHref="/courses"
        courses={COURSES}
        autoplay={true}
        autoplayInterval={4000}
      />,
    );

    const scrollBySpy = vi.spyOn(Element.prototype, 'scrollBy');
    const scrollToSpy = vi.spyOn(Element.prototype, 'scrollTo');
    scrollBySpy.mockClear();
    scrollToSpy.mockClear();

    act(() => {
      vi.advanceTimersByTime(4000);
      vi.advanceTimersByTime(4000);
    });

    expect(scrollBySpy).not.toHaveBeenCalled();
    expect(scrollToSpy).not.toHaveBeenCalled();
  });

  it('advances carousel on timer when useReducedMotion returns false', () => {
    vi.mocked(useReducedMotion).mockReturnValue({
      prefersReducedMotion: false,
      hasManualOverride: false,
      setManualOverride: vi.fn(),
      clearManualOverride: vi.fn(),
      mounted: true,
    });

    render(
      <CourseCarousel
        title="Featured Courses"
        seeAllHref="/courses"
        courses={COURSES}
        autoplay={true}
        autoplayInterval={4000}
      />,
    );

    const scrollBySpy = vi.spyOn(Element.prototype, 'scrollBy');
    scrollBySpy.mockClear();

    act(() => {
      vi.advanceTimersByTime(4000);
    });

    expect(scrollBySpy).toHaveBeenCalledTimes(1);
    expect(scrollBySpy).toHaveBeenCalledWith(
      expect.objectContaining({
        behavior: 'smooth',
      }),
    );
  });

  it('allows manual arrow and dot navigation even when reduced motion is preferred', () => {
    vi.mocked(useReducedMotion).mockReturnValue({
      prefersReducedMotion: true,
      hasManualOverride: false,
      setManualOverride: vi.fn(),
      clearManualOverride: vi.fn(),
      mounted: true,
    });

    render(
      <CourseCarousel
        title="Featured Courses"
        seeAllHref="/courses"
        courses={COURSES}
        autoplay={true}
      />,
    );

    const scrollToSpy = vi.spyOn(Element.prototype, 'scrollTo');

    const dotButtons = screen.getAllByRole('tab');
    expect(dotButtons.length).toBe(COURSES.length);

    fireEvent.click(dotButtons[1]);
    expect(scrollToSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        behavior: 'smooth',
      }),
    );
  });
});
