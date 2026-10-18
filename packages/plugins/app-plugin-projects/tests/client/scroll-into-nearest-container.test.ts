import { afterEach, describe, expect, it, vi } from 'vitest';

import { scrollIntoNearestContainer } from '../../client/lib/scroll-into-nearest-container.js';

afterEach(() => document.body.replaceChildren());

function fixture(top = 450, bottom = 490) {
  const shell = document.createElement('div');
  shell.style.overflowY = 'hidden';
  const container = document.createElement('div');
  container.style.overflowY = 'auto';
  const wrapper = document.createElement('div');
  wrapper.style.overflow = 'hidden';
  const target = document.createElement('div');
  wrapper.append(target);
  container.append(wrapper);
  shell.append(container);
  document.body.append(shell);
  const outerScroll = vi.fn();
  shell.scrollTo = outerScroll;
  wrapper.scrollTo = outerScroll;
  const scroll = vi.fn();
  container.scrollTo = scroll;
  container.scrollTop = 200;
  container.scrollLeft = 30;
  Object.defineProperties(container, {
    clientTop: { value: 2 },
    clientHeight: { value: 300 },
  });
  vi.spyOn(container, 'getBoundingClientRect').mockReturnValue({
    top: 98,
  } as DOMRect);
  vi.spyOn(target, 'getBoundingClientRect').mockReturnValue({
    top,
    bottom,
  } as DOMRect);
  return { container, target, scroll, outerScroll };
}

describe('scoped task positioning', () => {
  it.each([
    ['start', 550],
    ['center', 420],
    ['nearest', 290],
  ] as const)('aligns %s using only the content scroller', (block, top) => {
    const { target, scroll, outerScroll, container } = fixture();
    expect(scrollIntoNearestContainer(target, block)).toBe(true);
    expect(scroll).toHaveBeenCalledExactlyOnceWith({ top });
    expect(outerScroll).not.toHaveBeenCalled();
    expect(container.scrollLeft).toBe(30);
  });

  it.each([
    [50, 90, 150],
    [120, 160, 200],
    [50, 450, null],
  ])('keeps nearest alignment minimal for %s..%s', (top, bottom, expected) => {
    const { target, scroll } = fixture(top, bottom);
    scrollIntoNearestContainer(target, 'nearest');
    if (expected === null) expect(scroll).not.toHaveBeenCalled();
    else expect(scroll).toHaveBeenCalledExactlyOnceWith({ top: expected });
  });

  it('does not fall back to scrolling hidden shells or the document', () => {
    const { container, target, scroll, outerScroll } = fixture();
    container.style.overflowY = 'hidden';
    expect(scrollIntoNearestContainer(target, 'center')).toBe(false);
    expect(scroll).not.toHaveBeenCalled();
    expect(outerScroll).not.toHaveBeenCalled();
  });
});
