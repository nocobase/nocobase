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
