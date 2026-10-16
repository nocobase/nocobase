import { answerApi, renderWithApp } from '@nocobase/app-testing/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { createElement } from 'react';
import plugin from '../../client/plugin.js';
import { realtimeClientToken, type RealtimeClient } from '@nocobase/app-client';
import { useLiveSessions, usePrompt, useTranscript } from '../../client/api.js';
import { describe, expect, it, vi } from 'vitest';
import { mergeTranscript } from '../../client/api.js';
import type { TranscriptEvent } from '../../shared/api.js';
const prompt = (seq: number): TranscriptEvent => ({
  kind: 'prompt',
  seq,
  at: '2026-10-14T12:00:00Z',
  promptId: `p${seq}`,
  content: [{ type: 'text', text: 'test' }],
});
describe('confirmed transcript events', () => {
  it('retains a confirmation absent from an older GET, merges repeated seq and sorts out of order events', () => {
    expect(
      mergeTranscript([prompt(3), prompt(1)], [prompt(1), prompt(2)]).map(
        (event) => event.seq,
      ),
    ).toEqual([1, 2, 3]);
    expect(mergeTranscript([prompt(1)], [prompt(1)])).toHaveLength(1);
  });
});

function ConversationProbe() {
  const events = useTranscript('test');
  const send = usePrompt('test');
  return createElement(
    'section',
    null,
    createElement(
      'button',
      {
        onClick: () =>
          send.mutate({
            content: [{ type: 'text', text: 'test' }],
            mentions: [],
          }),
      },
      'Send',
    ),
    createElement(
      'output',
      null,
      (events.data ?? []).map((event) => event.seq).join(','),
    ),
  );
}
it('shows a confirmation while GET is still pending and retains it when that older GET finishes', async () => {
  let finishRead: ((answer: unknown) => void) | undefined;
  await renderWithApp(
    createElement(
      QueryClientProvider,
      { client: new QueryClient() },
      createElement(ConversationProbe),
    ),
    {
      plugins: [plugin({ routes: false })],
      namespace: '@nocobase/app-plugin-agent-sessions',
      fetch: answerApi(({ method }) =>
        method === 'GET'
          ? new Promise((resolve) => {
              finishRead = resolve;
            })
          : { data: prompt(1) },
      ),
    },
  );
  await waitFor(() => expect(finishRead).toBeDefined());
  fireEvent.click(screen.getByText('Send'));
  await screen.findByText('1');
  await act(async () => {
    finishRead?.({ data: [], meta: { hasMore: false } });
  });
  expect(screen.getByText('1')).toBeInTheDocument();
});

function LiveProbe() {
  useLiveSessions();
  return null;
}
it('shares nested subscriptions and invalidates inactive discovery results after reconnect', async () => {
  const client = new QueryClient();
  const opened = new Set<() => void>();
  let subscriptions = 0;
  const realtime: RealtimeClient = {
    connected: true,
    subscribe: () => {
      subscriptions += 1;
      return () => {
        subscriptions -= 1;
      };
    },
    onOpen: (listener) => {
      opened.add(listener);
      return () => {
        opened.delete(listener);
      };
    },
    onError: () => () => undefined,
    reconnect: () => undefined,
    close: () => undefined,
  };
  await renderWithApp(
    createElement(
      QueryClientProvider,
      { client },
      createElement(
        'section',
        null,
        createElement(LiveProbe),
        createElement(LiveProbe),
      ),
    ),
    {
      plugins: [plugin({ routes: false })],
      namespace: '@nocobase/app-plugin-agent-sessions',
      services: (app) => {
        const actual = app.container.resolve(realtimeClientToken);
        vi.spyOn(actual, 'subscribe').mockImplementation(realtime.subscribe);
        vi.spyOn(actual, 'onOpen').mockImplementation(realtime.onOpen);
      },
      fetch: answerApi(() => ({ data: [] })),
    },
  );
  expect(subscriptions).toBe(1);
  expect(opened.size).toBe(1);
  const key = ['agentSessions', 'discovery', 'inactive'];
  client.setQueryData(key, { status: 'available', choices: [] });
  expect(client.getQueryState(key)?.isInvalidated).toBe(false);
  await act(async () => {
    for (const listener of opened) listener();
  });
  expect(client.getQueryState(key)?.isInvalidated).toBe(true);
});

function StreamingProbe() {
  useLiveSessions();
  const events = useTranscript('test');
  return createElement(
    'output',
    null,
    (events.data ?? []).map((event) => event.seq).join(','),
  );
}
it('does not cancel slow reads during a continuous stream and follows them with a compensation read', async () => {
  const client = new QueryClient();
  client.setQueryData(['agentSessions', 'transcript', 'test'], [prompt(1)]);
  let emit: (() => void) | undefined;
  const releases: ((answer: unknown) => void)[] = [];
  let allowFresh = false;
  const signals: AbortSignal[] = [];
  let reads = 0;
  const response = answerApi(() => {
    reads += 1;
    return !allowFresh
      ? new Promise((resolve) => {
          releases.push(resolve);
        })
      : { data: [prompt(2)], meta: { hasMore: false } };
  });
  await renderWithApp(
    createElement(
      QueryClientProvider,
      { client },
      createElement(StreamingProbe),
    ),
    {
      plugins: [plugin({ routes: false })],
      namespace: '@nocobase/app-plugin-agent-sessions',
      services: (app) => {
        const actual = app.container.resolve(realtimeClientToken);
        vi.spyOn(actual, 'subscribe').mockImplementation((topic, listener) => {
          emit = () =>
            listener({
              type: 'event',
              topic,
              publishedAt: '2026-10-14T12:00:00Z',
              payload: {
                kind: 'session',
                sessionId: 'test',
                lastSeq: 2,
              } as never,
            });
          return () => undefined;
        });
      },
      fetch: (request) => {
        signals.push(request.signal);
        return response(request);
      },
    },
  );
  await waitFor(() => expect(releases.length).toBeGreaterThan(0));
  const signal = signals.at(-1)!;
  const interval = setInterval(() => emit?.(), 50);
  try {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 450));
    });
    expect(signal.aborted).toBe(false);
    await act(async () => {
      allowFresh = true;
      for (const release of releases)
        release({ data: [prompt(1)], meta: { hasMore: false } });
    });
    await screen.findByText('1,2');
    expect(reads).toBeGreaterThan(1);
  } finally {
    clearInterval(interval);
  }
});

it('observes transport closure without a protocol error and preserves memory on reconnect', async () => {
  const client = new QueryClient();
  let connected = true;
  let opened: (() => void) | undefined;
  let sample: (() => void) | undefined;
  const original = globalThis.setInterval;
  const timer = vi
    .spyOn(globalThis, 'setInterval')
    .mockImplementation((handler, ms, ...args) => {
      if (ms === 1_000 && typeof handler === 'function')
        sample = () => handler(...args);
      return original(handler, ms, ...args);
    });
  try {
    await renderWithApp(
      createElement(QueryClientProvider, { client }, createElement(LiveProbe)),
      {
        plugins: [plugin({ routes: false })],
        namespace: '@nocobase/app-plugin-agent-sessions',
        fetch: answerApi(() => ({ data: [] })),
        services: (app) => {
          const realtime = app.container.resolve(realtimeClientToken);
          vi.spyOn(realtime, 'connected', 'get').mockImplementation(
            () => connected,
          );
          vi.spyOn(realtime, 'subscribe').mockImplementation(
            () => () => undefined,
          );
          vi.spyOn(realtime, 'onOpen').mockImplementation((listener) => {
            opened = listener;
            return () => undefined;
          });
        },
      },
    );
    const key = ['agentSessions', 'discovery', 'inactive'];
    const memory = ['agentSessions', 'memory', 'settings:target'];
    client.setQueryData(key, { status: 'available', choices: [] });
    client.setQueryData(memory, { model: 'second' });
    connected = false;
    await act(async () => {
      sample?.();
    });
    expect(client.getQueryData(['agentSessions', 'discoveryConnection'])).toBe(
      false,
    );
    expect(client.getQueryState(key)?.isInvalidated).toBe(true);
    connected = true;
    await act(async () => {
      opened?.();
    });
    expect(client.getQueryData(['agentSessions', 'discoveryConnection'])).toBe(
      true,
    );
    expect(client.getQueryData(memory)).toEqual({ model: 'second' });
  } finally {
    timer.mockRestore();
  }
});
