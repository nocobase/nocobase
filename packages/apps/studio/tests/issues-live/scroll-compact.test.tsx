/** The pinned summary folds to its bar once the page is scrolled down, and opens again back at the top. */
import { act, cleanup, render, screen } from '@testing-library/react';
import { useRef, type ReactElement } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import { useScrollCompact } from '../../client/issues/live/use-scroll-compact.js';

function Probe({
  enabled = true,
}: {
  readonly enabled?: boolean;
}): ReactElement {
  const ref = useRef<HTMLDivElement>(null);
  const { scrolled, epoch } = useScrollCompact(ref, enabled);
  return (
    <div data-testid='scroller' style={{ overflowY: 'auto' }}>
      <div ref={ref}>
        <output>{`${scrolled}:${epoch}`}</output>
      </div>
    </div>
  );
}

function scrollTo(element: HTMLElement, top: number, height = 3000): void {
  Object.defineProperty(element, 'scrollTop', {
    configurable: true,
    value: top,
  });
  Object.defineProperty(element, 'scrollHeight', {
    configurable: true,
    value: height,
  });
  Object.defineProperty(element, 'clientHeight', {
    configurable: true,
    value: 800,
  });
  act(() => {
    element.dispatchEvent(new Event('scroll'));
  });
}

afterEach(cleanup);

describe('folding the summary while the page scrolls', () => {
  it('folds past the threshold, opens back at the top, and counts each fold', () => {
    render(<Probe />);
    const scroller = screen.getByTestId('scroller');
    const state = () => screen.getByRole('status').textContent;
    expect(state()).toBe('false:0');
    scrollTo(scroller, 40);
    expect(state()).toBe('false:0');
    scrollTo(scroller, 300);
    expect(state()).toBe('true:1');
    scrollTo(scroller, 50);
    expect(state()).toBe('true:1');
    scrollTo(scroller, 0);
    expect(state()).toBe('false:1');
    scrollTo(scroller, 400);
    expect(state()).toBe('true:2');
  });

  it('keeps a short page as it is, so folding cannot bounce it', () => {
    render(<Probe />);
    const scroller = screen.getByTestId('scroller');
    scrollTo(scroller, 300, 1100);
    expect(screen.getByRole('status').textContent).toBe('false:0');
  });
});
