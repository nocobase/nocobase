// @vitest-environment jsdom
import { act, fireEvent, render } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { useChatScroll } from '../../client/chat/use-chat-scroll.js';

afterEach(() => vi.unstubAllGlobals());
it('follows same-message layout growth, preserves up-thread reading and older-page position, then resumes near bottom', () => {
  let resize!: () => void;
  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(callback: () => void) {
        resize = callback;
      }
      observe() {}
      disconnect() {}
    },
  );
  let height = 1000;
  function Log({ seq, text }: { seq: number; text: string }) {
    const ref = useChatScroll(seq);
    return (
      <div ref={ref} data-testid='log'>
        <div>{text}</div>
      </div>
    );
  }
  const view = render(<Log seq={10} text='A' />);
  const log = view.getByTestId('log');
  Object.defineProperties(log, {
    scrollHeight: { get: () => height },
    clientHeight: { value: 400 },
  });
  act(() => resize());
  expect(log.scrollTop).toBe(1000);
  height = 1100;
  view.rerender(<Log seq={10} text='AB' />);
  expect(log.scrollTop).toBe(1100);
  log.scrollTop = 300;
  fireEvent.scroll(log);
  height = 1200;
  act(() => resize());
  expect(log.scrollTop).toBe(300);
  height = 1500;
  view.rerender(<Log seq={1} text='Older messages and AB' />);
  expect(log.scrollTop).toBe(600);
  act(() => resize());
  expect(log.scrollTop).toBe(600);
  log.scrollTop = 1100;
  fireEvent.scroll(log);
  height = 1600;
  act(() => resize());
  expect(log.scrollTop).toBe(1600);
  view.rerender(<Log seq={1} text='Canonical AB' />);
  expect(log.scrollTop).toBe(1600);
});

it('preserves the visible message when an older page and new output grow in one commit, including native scroll anchoring', () => {
  let resize!: () => void;
  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(callback: () => void) {
        resize = callback;
      }
      observe() {}
      disconnect() {}
    },
  );
  let height = 1000;
  let anchorTop = 20;
  function Log({ seq }: { seq: number }) {
    const ref = useChatScroll(seq);
    return (
      <div ref={ref} data-testid='log'>
        <div>
          <ol>
            <li data-testid='anchor'>Reading this saved message</li>
          </ol>
        </div>
      </div>
    );
  }
  const view = render(<Log seq={10} />);
  const log = view.getByTestId('log');
  const anchor = view.getByTestId('anchor');
  Object.defineProperties(log, {
    scrollHeight: { get: () => height },
    clientHeight: { value: 400 },
  });
  log.getBoundingClientRect = () => ({ top: 0, bottom: 400 }) as DOMRect;
  anchor.getBoundingClientRect = () =>
    ({ top: anchorTop, bottom: anchorTop + 30 }) as DOMRect;
  act(() => resize());
  log.scrollTop = 300;
  fireEvent.scroll(log);
  height = 1500; // 300 px prepended and 200 px appended below the reader.
  anchorTop = 320;
  view.rerender(<Log seq={1} />);
  expect(log.scrollTop).toBe(600);
  anchorTop = 20;
  fireEvent.scroll(log);
  height = 1700;
  log.scrollTop = 800; // The browser already preserved the same anchor during prepend.
  view.rerender(<Log seq={0} />);
  expect(log.scrollTop).toBe(800);
});

it('leaves a reader who scrolled up where they are when the layout changes before their scroll event arrives', () => {
  let resize!: () => void;
  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(callback: () => void) {
        resize = callback;
      }
      observe() {}
      disconnect() {}
    },
  );
  let height = 1000;
  function Log({ text }: { text: string }) {
    const ref = useChatScroll(1);
    return (
      <div ref={ref} data-testid='log'>
        <div>{text}</div>
      </div>
    );
  }
  const view = render(<Log text='A' />);
  const log = view.getByTestId('log');
  Object.defineProperties(log, {
    scrollHeight: { get: () => height },
    clientHeight: { value: 400 },
  });
  act(() => resize());
  expect(log.scrollTop).toBe(1000);
  // The reader goes to the top; a resize reflows the content before the browser dispatches the scroll event.
  log.scrollTop = 0;
  height = 1200;
  act(() => resize());
  expect(log.scrollTop).toBe(0);
  view.rerender(<Log text='AB' />);
  expect(log.scrollTop).toBe(0);
  // Back at the end, the log follows again.
  log.scrollTop = 1200;
  fireEvent.scroll(log);
  height = 1300;
  act(() => resize());
  expect(log.scrollTop).toBe(1300);
});
