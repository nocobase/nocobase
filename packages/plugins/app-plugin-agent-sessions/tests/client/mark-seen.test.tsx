import { answerApi, renderWithApp } from '@nocobase/app-testing/client';
import { act } from '@testing-library/react';
import { useRef } from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { useMarkSeen } from '../../client/api.js';
import plugin from '../../client/plugin.js';

let intersect: (entries: { isIntersecting: boolean }[]) => void;
class Observer {
  constructor(callback: typeof intersect) {
    intersect = callback;
  }
  observe() {}
  disconnect() {}
}
function Probe({ id = 'a', seq = 3 }: { id?: string; seq?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useMarkSeen(id, seq, ref);
  return <div ref={ref} />;
}
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
it('requires the transcript end, cancels on hidden pages and resets on session switches', async () => {
  vi.stubGlobal('IntersectionObserver', Observer);
  let visible = true;
  vi.spyOn(document, 'visibilityState', 'get').mockImplementation(() =>
    visible ? 'visible' : 'hidden',
  );
  const calls: string[] = [];
  const app = await renderWithApp(<Probe />, {
    plugins: [plugin({ routes: false })],
    fetch: answerApi(({ path }) => {
      calls.push(path);
      return { data: {} };
    }),
  });
  vi.useFakeTimers();
  await act(async () => {
    intersect([{ isIntersecting: false }]);
    await vi.advanceTimersByTimeAsync(1100);
  });
  expect(calls).toEqual([]);
  await act(async () => {
    intersect([{ isIntersecting: true }]);
    await vi.advanceTimersByTimeAsync(500);
  });
  visible = false;
  await act(async () => {
    document.dispatchEvent(new Event('visibilitychange'));
    await vi.advanceTimersByTimeAsync(1100);
  });
  expect(calls).toEqual([]);
  visible = true;
  await act(async () => {
    document.dispatchEvent(new Event('visibilitychange'));
    await vi.advanceTimersByTimeAsync(500);
    intersect([{ isIntersecting: false }]);
    await vi.advanceTimersByTimeAsync(1100);
  });
  expect(calls).toEqual([]);
  // A long message does not intersect at its end until it has been scrolled through.
  await act(async () => {
    intersect([{ isIntersecting: true }]);
    await vi.advanceTimersByTimeAsync(1100);
  });
  expect(calls).toEqual(['agentSessions/sessions/a/seen']);
  app.rerender(<Probe id='b' seq={8} />);
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1100);
  });
  expect(calls).toHaveLength(1);
  await act(async () => {
    intersect([{ isIntersecting: true }]);
    await vi.advanceTimersByTimeAsync(1100);
  });
  expect(calls.at(-1)).toBe('agentSessions/sessions/b/seen');
});
