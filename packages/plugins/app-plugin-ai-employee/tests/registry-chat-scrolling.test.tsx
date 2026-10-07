/**
 * @vitest-environment jsdom
 */

import { act, fireEvent, render, screen } from '@testing-library/react';
import { StrictMode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AIChatMessageList } from '../registry/nocobase-ai/components/chat/chat-messages.js';
import type { AIChatMessage } from '../registry/nocobase-ai/providers/types.js';

vi.mock('../registry/nocobase-ai/providers/index.js', () => ({}));
vi.mock('../registry/nocobase-ai/components/chat/chat-empty-state.js', () => ({
  ChatEmptyState: () => <p>Start a conversation</p>,
}));
vi.mock('../registry/nocobase-ai/components/chat/chat-message.js', () => ({
  ChatMessage: ({ message }: { message: AIChatMessage }) => (
    <article>{message.id}</article>
  ),
}));

const message = (id: string): AIChatMessage => ({
  id,
  role: 'assistant',
  parts: [{ type: 'text', text: id }],
});
const original = ['a', 'b', 'c', 'd'].map(message);
let viewportHeight: number;
let headerHeight: number;
let heights: Map<string, number>;
let positions: WeakMap<Element, number>;
let resizeObservers: Set<ResizeObserverMock>;
let reducedMotion: boolean;
const scrollTo = vi.fn(function (this: Element, options: ScrollToOptions) {
  this.scrollTop = options.top ?? 0;
});

class ResizeObserverMock {
  elements = new Set<Element>();
  constructor(private callback: ResizeObserverCallback) {
    resizeObservers.add(this);
  }
  observe(element: Element) {
    this.elements.add(element);
  }
  unobserve(element: Element) {
    this.elements.delete(element);
  }
  disconnect() {
    resizeObservers.delete(this);
  }
  notify() {
    this.callback([], this);
  }
}

function rowHeight(element: Element) {
  return heights.get(element.getAttribute('data-chat-message-id') ?? '') ?? 200;
}

function contentHeight(element: Element) {
  return (
    (element.querySelector('[data-history-header]') ? headerHeight : 0) +
    Array.from(element.querySelectorAll('[data-chat-message-id]')).reduce(
      (height, row) => height + rowHeight(row),
      0,
    )
  );
}

function notifyResize() {
  act(() => {
    for (const observer of resizeObservers) observer.notify();
  });
}

function scroll(viewport: HTMLElement, top: number) {
  viewport.scrollTop = top;
  fireEvent.scroll(viewport);
}

function rowTop(id: string) {
  return screen.getByText(id).parentElement!.getBoundingClientRect().top;
}

beforeEach(() => {
  viewportHeight = 400;
  headerHeight = 60;
  heights = new Map();
  positions = new WeakMap();
  resizeObservers = new Set();
  reducedMotion = false;
  scrollTo.mockClear();
  vi.stubGlobal('ResizeObserver', ResizeObserverMock);
  vi.stubGlobal('matchMedia', () => ({ matches: reducedMotion }));
  vi.spyOn(Element.prototype, 'scrollHeight', 'get').mockImplementation(
    function () {
      return Math.max(viewportHeight, contentHeight(this));
    },
  );
  vi.spyOn(Element.prototype, 'clientHeight', 'get').mockImplementation(
    () => viewportHeight,
  );
  vi.spyOn(Element.prototype, 'scrollTop', 'get').mockImplementation(
    function () {
      return positions.get(this) ?? 0;
    },
  );
  vi.spyOn(Element.prototype, 'scrollTop', 'set').mockImplementation(
    function (value) {
      positions.set(
        this,
        Math.max(0, Math.min(value, this.scrollHeight - this.clientHeight)),
      );
    },
  );
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(
    function () {
      const viewport = this.closest('[role="log"]');
      let top = 0;
      const isRow = this.hasAttribute('data-chat-message-id');
      if (isRow && viewport) {
        top = viewport.querySelector('[data-history-header]')
          ? headerHeight
          : 0;
        for (const row of viewport.querySelectorAll('[data-chat-message-id]')) {
          if (row === this) break;
          top += rowHeight(row);
        }
        top -= viewport.scrollTop;
      }
      return new DOMRect(0, top, 600, isRow ? rowHeight(this) : viewportHeight);
    },
  );
  vi.stubGlobal('scrollTo', scrollTo);
  Object.defineProperty(Element.prototype, 'scrollTo', {
    configurable: true,
    writable: true,
    value: scrollTo,
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('AIChatMessageList scrolling', () => {
  it('opens at the bottom, including history arriving after loading in Strict Mode', () => {
    const { rerender } = render(
      <StrictMode>
        <AIChatMessageList messages={[]} loading />
      </StrictMode>,
    );
    const viewport = screen.getByRole('log', { name: 'Message history' });
    rerender(
      <StrictMode>
        <AIChatMessageList messages={original} />
      </StrictMode>,
    );
    expect(viewport.scrollTop).toBe(400);
    expect(scrollTo).not.toHaveBeenCalled();
    expect(
      [...resizeObservers].some((observer) => observer.elements.size === 2),
    ).toBe(true);
  });

  it('preserves the visible row and pixel offset when earlier messages are prepended', () => {
    const { rerender } = render(<AIChatMessageList messages={original} />);
    const viewport = screen.getByRole('log');
    scroll(viewport, 125);
    const top = rowTop('a');
    rerender(
      <AIChatMessageList messages={[message('earlier'), ...original]} />,
    );
    expect(viewport.scrollTop).toBe(325);
    expect(rowTop('a')).toBe(top);
    notifyResize();
    expect(viewport.scrollTop).toBe(325);
    expect(
      screen.getByRole('button', { name: 'Scroll to bottom' }),
    ).toBeVisible();
  });

  it('prioritizes prepend anchoring over bottom-follow even when the tail also streams', () => {
    const { rerender } = render(
      <AIChatMessageList messages={original} status='streaming' />,
    );
    const viewport = screen.getByRole('log');
    const top = rowTop('c');
    heights.set('d', 350);
    rerender(
      <AIChatMessageList
        messages={[message('earlier'), ...original]}
        status='streaming'
      />,
    );
    expect(viewport.scrollTop).toBe(600);
    expect(rowTop('c')).toBe(top);
    notifyResize();
    expect(viewport.scrollTop).toBe(600);
  });

  it('keeps a previously non-overflowing history anchored when a prepend makes it overflow', () => {
    const { rerender } = render(
      <AIChatMessageList messages={[message('a')]} />,
    );
    const viewport = screen.getByRole('log');
    heights.set('earlier', 500);
    rerender(
      <AIChatMessageList messages={[message('earlier'), message('a')]} />,
    );
    // The browser clamps the anchor correction to the new maximum scrollTop.
    expect(viewport.scrollTop).toBe(300);
    expect(rowTop('a')).toBe(200);
  });

  it('includes header layout changes in the anchor rather than the entire height delta', () => {
    const historyHeader = <button data-history-header>Load earlier</button>;
    const { rerender } = render(
      <AIChatMessageList messages={original} historyHeader={historyHeader} />,
    );
    const viewport = screen.getByRole('log');
    scroll(viewport, 180);
    const top = rowTop('a');
    heights.set('d', 500);
    rerender(
      <AIChatMessageList messages={[message('earlier'), ...original]} />,
    );
    expect(viewport.scrollTop).toBe(320);
    expect(rowTop('a')).toBe(top);
  });

  it('does not follow appended messages or streaming tokens while reading earlier history', () => {
    const { rerender } = render(<AIChatMessageList messages={original} />);
    const viewport = screen.getByRole('log');
    scroll(viewport, 100);
    heights.set('d', 350);
    rerender(
      <AIChatMessageList
        messages={[...original, message('latest')]}
        status='streaming'
      />,
    );
    expect(viewport.scrollTop).toBe(100);
    notifyResize();
    expect(viewport.scrollTop).toBe(100);
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it('follows streaming growth at the bottom and resumes after the reader returns there', () => {
    const { rerender } = render(<AIChatMessageList messages={original} />);
    const viewport = screen.getByRole('log');
    heights.set('d', 350);
    rerender(<AIChatMessageList messages={[...original]} status='streaming' />);
    expect(viewport.scrollTop).toBe(550);
    scroll(viewport, 100);
    heights.set('d', 450);
    notifyResize();
    expect(viewport.scrollTop).toBe(100);
    scroll(viewport, 650);
    heights.set('d', 550);
    notifyResize();
    expect(viewport.scrollTop).toBe(750);
    expect(
      screen.queryByRole('button', { name: 'Scroll to bottom' }),
    ).toBeNull();
  });

  it('does not snap when the reader scrolls into the near-bottom threshold', () => {
    render(<AIChatMessageList messages={original} />);
    const viewport = screen.getByRole('log');
    scroll(viewport, 100);
    scroll(viewport, 370);
    expect(viewport.scrollTop).toBe(370);
    expect(
      screen.queryByRole('button', { name: 'Scroll to bottom' }),
    ).toBeNull();
  });

  it('observes asynchronous content growth and viewport resizes without pulling the reader to the tail', () => {
    render(<AIChatMessageList messages={original} />);
    const viewport = screen.getByRole('log');
    heights.set('d', 300);
    notifyResize();
    expect(viewport.scrollTop).toBe(500);
    scroll(viewport, 250);
    const top = rowTop('b');
    heights.set('a', 300);
    notifyResize();
    expect(viewport.scrollTop).toBe(350);
    expect(rowTop('b')).toBe(top);
    viewportHeight = 300;
    notifyResize();
    expect(viewport.scrollTop).toBe(350);
    scroll(viewport, 700);
    viewportHeight = 250;
    notifyResize();
    expect(viewport.scrollTop).toBe(750);
  });

  it('starts a replacement conversation at the bottom rather than carrying over its old scroll position', () => {
    const { rerender } = render(<AIChatMessageList messages={original} />);
    const viewport = screen.getByRole('log');
    scroll(viewport, 100);
    rerender(<AIChatMessageList messages={['x', 'y', 'z'].map(message)} />);
    expect(viewport.scrollTop).toBe(200);
  });

  it('places the header in the named keyboard-focusable scroll region', () => {
    render(
      <AIChatMessageList
        messages={original}
        historyHeader={<button data-history-header>Load earlier</button>}
      />,
    );
    const viewport = screen.getByRole('log', { name: 'Message history' });
    expect(viewport).toHaveAttribute('tabindex', '0');
    expect(viewport).toHaveClass('focus-visible:outline-ring');
    expect(viewport).toContainElement(
      screen.getByRole('button', { name: 'Load earlier' }),
    );
    expect(screen.getAllByRole('log')).toHaveLength(1);
    viewport.focus();
    expect(viewport).toHaveFocus();
    expect(viewport).toHaveClass('[overflow-anchor:none]');
  });

  it.each([false, true])(
    'honors reduced motion (%s) for the explicit jump to latest',
    (reduce) => {
      render(<AIChatMessageList messages={original} />);
      const viewport = screen.getByRole('log');
      scroll(viewport, 0);
      // Read the current preference on each jump, not only on mount.
      reducedMotion = reduce;
      fireEvent.click(screen.getByRole('button', { name: 'Scroll to bottom' }));
      expect(scrollTo).toHaveBeenCalledWith({
        top: 400,
        behavior: reduce ? 'auto' : 'smooth',
      });
      fireEvent.scroll(viewport);
      expect(viewport).toHaveFocus();
      expect(
        screen.queryByRole('button', { name: 'Scroll to bottom' }),
      ).toBeNull();
    },
  );

  it('preserves prepend behavior without ResizeObserver and cleans up observers on unmount', () => {
    const { unmount } = render(<AIChatMessageList messages={original} />);
    expect(resizeObservers.size).toBe(1);
    unmount();
    expect(resizeObservers.size).toBe(0);
    vi.stubGlobal('ResizeObserver', undefined);
    const { rerender } = render(<AIChatMessageList messages={original} />);
    const viewport = screen.getByRole('log');
    scroll(viewport, 80);
    rerender(
      <AIChatMessageList messages={[message('earlier'), ...original]} />,
    );
    expect(viewport.scrollTop).toBe(280);
  });
});
