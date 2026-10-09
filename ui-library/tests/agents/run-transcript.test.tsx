import type { JSDOM } from 'jsdom';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import {
  RunTranscript,
  type RunTranscriptEvent,
} from '../../registry/agents/agent-run-history';

const event = (
  seq: number,
  type: string,
  meta?: Record<string, unknown>,
): RunTranscriptEvent => ({
  seq,
  at: '2026-01-01T00:00:00Z',
  type,
  content: `event ${seq}`,
  output: `output ${seq}`,
  meta,
});
const list = (): HTMLElement =>
  screen.getByRole('list', { name: 'Run transcript' });
const toggle = (name: string): void =>
  fireEvent.click(screen.getByRole('button', { name, exact: true }));
// Vitest exposes its JSDOM instance; Node's native web storage can shadow the browser global.
declare const jsdom: JSDOM;
beforeEach(() => {
  vi.stubGlobal('localStorage', jsdom.window.localStorage);
  window.localStorage.clear();
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it('defaults to agent and input in a long transcript, keeping all failure formats and the summary visible', () => {
  const events = Array.from({ length: 200 }, (_, index) =>
    event(index + 1, 'toolUse'),
  );
  events[20] = event(21, 'text');
  events[40] = event(41, 'input');
  events[60] = event(61, 'error');
  events[80] = event(81, 'toolResult', { isError: true });
  events[100] = event(101, 'toolResult', { ok: false });
  render(<RunTranscript events={events} summary={<p>Run failed</p>} />);
  expect(list().querySelectorAll('[data-type]')).toHaveLength(5);
  expect(screen.getByText('Run failed')).toBeVisible();
  expect(within(list()).getByText('event 61')).toBeVisible();
  expect(within(list()).getByText('output 81')).toBeVisible();
  expect(within(list()).getByText('output 101')).toBeVisible();
  toggle('Agent');
  toggle('Input');
  expect(list().querySelectorAll('[data-type]')).toHaveLength(3);
  toggle('Tools');
  expect(list().querySelectorAll('[data-type]')).toHaveLength(198);
});

it('counts consecutive hidden groups, expands only that segment and applies filters to live additions', () => {
  const events = [
    event(1, 'toolUse'),
    event(2, 'permission'),
    event(3, 'status'),
    event(4, 'text'),
    event(5, 'thinking'),
  ];
  const view = render(<RunTranscript events={events} open />);
  const segment = screen.getByRole('button', {
    name: 'Hidden events: 2 Tools, 1 System',
  });
  fireEvent.click(segment);
  expect(segment).toHaveAttribute('aria-expanded', 'true');
  expect(list().querySelectorAll('[data-type]')).toHaveLength(4);
  view.rerender(
    <RunTranscript events={[...events, event(6, 'thinking')]} open />,
  );
  expect(
    screen.getByRole('button', { name: 'Hidden events: 2 Thinking' }),
  ).toHaveAttribute('aria-expanded', 'false');
  expect(segment).toHaveAttribute('aria-expanded', 'true');
  toggle('Thinking');
  expect(within(list()).getByText('event 6')).toBeVisible();
  toggle('System');
  expect(within(list()).getByText('event 3')).toBeVisible();
});

it('keeps an expanded trailing segment open as events arrive and keeps errors outside hidden segments', () => {
  const events = [event(1, 'status')];
  const view = render(<RunTranscript events={events} />);
  fireEvent.click(
    screen.getByRole('button', { name: 'Hidden events: 1 System' }),
  );
  toggle('Agent');
  toggle('Input');
  view.rerender(
    <RunTranscript
      events={[
        ...events,
        event(2, 'checkout'),
        event(3, 'error'),
        event(4, 'toolResult', { isError: true }),
        event(5, 'toolResult', { ok: false }),
        event(6, 'futureEvent'),
      ]}
    />,
  );
  expect(
    screen.getByRole('button', { name: 'Hidden events: 2 System' }),
  ).toHaveAttribute('aria-expanded', 'true');
  expect(list().querySelectorAll('[data-type]')).toHaveLength(5);
  toggle('System');
  expect(within(list()).getByText('event 6')).toBeVisible();
});

it.each(['permission', 'allowed', 'denied', 'toolUse', 'toolResult'])(
  'groups %s under Tools',
  (type) => {
    render(<RunTranscript events={[event(1, type)]} />);
    expect(list().querySelector('[data-type]')).toBeNull();
    toggle('Tools');
    expect(list().querySelector('[data-type]')).toHaveAttribute(
      'data-type',
      type,
    );
  },
);

it('restores preferences on refresh and isolates changes when switching application/user keys', () => {
  const events = [event(1, 'toolUse')];
  const view = render(
    <RunTranscript events={events} preferenceKey='app:alice' />,
  );
  toggle('Tools');
  view.unmount();
  const fresh = render(
    <RunTranscript events={events} preferenceKey='app:alice' />,
  );
  expect(
    screen.getByRole('button', { name: 'Tools', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  fresh.rerender(<RunTranscript events={events} preferenceKey='app:bob' />);
  expect(list().querySelector('[data-type]')).toBeNull();
  toggle('Agent');
  toggle('Input');
  expect(JSON.parse(window.localStorage.getItem('app:bob')!)).toEqual([]);
  fresh.rerender(<RunTranscript events={events} preferenceKey='app:alice' />);
  expect(list().querySelector('[data-type]')).not.toBeNull();
  fresh.rerender(
    <RunTranscript events={events} preferenceKey='other-app:alice' />,
  );
  expect(list().querySelector('[data-type]')).toBeNull();
});

it.each(['bad json', '["unknown"]', '{}', 'null'])(
  'falls back from an invalid preference: %s',
  (stored) => {
    window.localStorage.setItem('preference', stored);
    render(
      <RunTranscript
        events={[event(1, 'text'), event(2, 'toolUse')]}
        preferenceKey='preference'
      />,
    );
    expect(list().querySelectorAll('[data-type]')).toHaveLength(1);
    expect(within(list()).getByText('event 1')).toBeVisible();
  },
);

it('works with unavailable storage and does not persist without a scope key', () => {
  const read = vi
    .spyOn(window.Storage.prototype, 'getItem')
    .mockImplementation(() => {
      throw new Error('disabled');
    });
  const write = vi
    .spyOn(window.Storage.prototype, 'setItem')
    .mockImplementation(() => {
      throw new Error('full');
    });
  const view = render(
    <RunTranscript events={[event(1, 'toolUse')]} preferenceKey='disabled' />,
  );
  toggle('Tools');
  expect(list().querySelector('[data-type]')).not.toBeNull();
  expect(read).toHaveBeenCalled();
  expect(write).toHaveBeenCalled();
  read.mockClear();
  write.mockClear();
  view.rerender(<RunTranscript events={[event(1, 'toolUse')]} />);
  toggle('Tools');
  expect(read).not.toHaveBeenCalled();
  expect(write).not.toHaveBeenCalled();
});
