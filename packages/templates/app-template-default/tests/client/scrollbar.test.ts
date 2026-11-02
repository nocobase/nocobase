import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { revealScrollbarsWhileScrolling } from '../../client/lib/scrollbar';

describe('revealScrollbarsWhileScrolling', () => {
  beforeAll(() => revealScrollbarsWhileScrolling());
  afterEach(() => vi.useRealTimers());

  function scroll(target: EventTarget) {
    target.dispatchEvent(new Event('scroll'));
  }

  it('marks a scrolling element until it has been still for a moment', () => {
    vi.useFakeTimers();
    const list = document.createElement('div');
    document.body.append(list);
    scroll(list);
    expect(list).toHaveAttribute('data-scrolling');
    vi.advanceTimersByTime(799);
    expect(list).toHaveAttribute('data-scrolling');
    vi.advanceTimersByTime(1);
    expect(list).not.toHaveAttribute('data-scrolling');
    list.remove();
  });

  it('keeps the mark while scrolling goes on', () => {
    vi.useFakeTimers();
    const list = document.createElement('div');
    document.body.append(list);
    scroll(list);
    vi.advanceTimersByTime(600);
    scroll(list);
    vi.advanceTimersByTime(600);
    expect(list).toHaveAttribute('data-scrolling');
    vi.advanceTimersByTime(200);
    expect(list).not.toHaveAttribute('data-scrolling');
    list.remove();
  });

  it('marks the page root when the page itself scrolls', () => {
    vi.useFakeTimers();
    scroll(document);
    expect(
      document.scrollingElement ?? document.documentElement,
    ).toHaveAttribute('data-scrolling');
    vi.advanceTimersByTime(800);
    expect(
      document.scrollingElement ?? document.documentElement,
    ).not.toHaveAttribute('data-scrolling');
  });
});

describe('revealScrollbarsWhileScrolling near an edge', () => {
  function scroller(): HTMLDivElement {
    const element = document.createElement('div');
    element.style.overflowY = 'auto';
    Object.defineProperty(element, 'scrollHeight', { value: 500 });
    Object.defineProperty(element, 'clientHeight', { value: 100 });
    element.getBoundingClientRect = () =>
      ({ left: 0, top: 0, right: 200, bottom: 100 }) as DOMRect;
    document.body.append(element);
    return element;
  }

  function move(target: Element, clientX: number) {
    const event = new MouseEvent('pointermove', {
      bubbles: true,
      clientX,
      clientY: 50,
    });
    Object.defineProperty(event, 'pointerType', { value: 'mouse' });
    target.dispatchEvent(event);
  }

  it('shows the bar while the mouse is near the edge it runs along', () => {
    vi.useFakeTimers();
    const list = scroller();
    move(list, 100);
    vi.advanceTimersByTime(20);
    expect(list).not.toHaveAttribute('data-scrolling');
    move(list, 195);
    vi.advanceTimersByTime(20);
    expect(list).toHaveAttribute('data-scrolling');
    vi.advanceTimersByTime(800);
    expect(list).not.toHaveAttribute('data-scrolling');
    list.remove();
  });
});
