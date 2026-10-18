import { answerApi, renderWithApp } from '@nocobase/app-testing/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, screen, waitFor, act } from '@testing-library/react';
import { createElement } from 'react';
import { expect, it, vi } from 'vitest';
import { realtimeClientToken, type RealtimeClient } from '@nocobase/app-client';
import type { TranscriptEvent } from '../../shared/api.js';
import plugin from '../../client/plugin.js';
import { usePrompt, useTranscript, useLiveSessions } from '../../client/api.js';
const key = ['agentSessions', 'transcript', 'test'];
const prompt = (seq: number) => ({
  kind: 'prompt',
  seq,
  at: '2026-10-14T12:00:00Z',
  promptId: 'p' + seq,
  content: [{ type: 'text', text: 'hello' }],
});
const chunk = (text: string) => ({
  kind: 'update',
  seq: 2,
  at: '2026-10-14T12:00:00Z',
  update: {
    sessionUpdate: 'agent_message_chunk',
    content: { type: 'text', text },
  },
});
function Probe() {
  const q = useTranscript('test');
  const p = usePrompt('test');
  return createElement(
    'section',
    null,
    createElement(
      'button',
      {
        onClick: () =>
          p.mutate({
            content: [{ type: 'text', text: 'hello' }],
            mentions: [],
          }),
      },
      'Send',
    ),
    createElement('output', null, JSON.stringify(q.data)),
  );
}
it('a prompt confirmation must not skip the preceding streamed tail', async () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });
  client.setQueryData(key, [prompt(1), chunk('partial')]);
  const afters: number[] = [];
  await renderWithApp(
    createElement(QueryClientProvider, { client }, createElement(Probe)),
    {
      plugins: [plugin({ routes: false })],
      namespace: '@nocobase/app-plugin-agent-sessions',
      fetch: answerApi(({ method, query }) => {
        if (method === 'POST') return { data: prompt(3) };
        const after = Number(query?.after ?? 0);
        afters.push(after);
        return {
          data: [prompt(1), chunk('complete'), prompt(3)].filter(
            (e) => e.seq > after,
          ),
          meta: { hasMore: false },
        };
      }),
    },
  );
  fireEvent.click(screen.getByText('Send'));
  await waitFor(() =>
    expect(client.getQueryData<TranscriptEvent[]>(key)?.at(-1)?.seq).toBe(3),
  );
  await act(async () => {
    await client.invalidateQueries({ queryKey: key });
  });
  console.log(JSON.stringify({ afters, result: client.getQueryData(key) }));
  expect(JSON.stringify(client.getQueryData(key))).toContain('complete');
});

it('does not advance a server-read position for consecutive confirmations or skip intervening events', async () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });
  let rows = [prompt(1), chunk('partial')];
  const afters: number[] = [];
  let confirmed = 1;
  await renderWithApp(
    createElement(QueryClientProvider, { client }, createElement(Probe)),
    {
      plugins: [plugin({ routes: false })],
      namespace: '@nocobase/app-plugin-agent-sessions',
      fetch: answerApi(({ method, query }) => {
        if (method === 'POST') {
          confirmed += 2;
          return { data: prompt(confirmed) };
        }
        const after = Number(query?.after ?? 0);
        afters.push(after);
        return {
          data: rows.filter((e) => e.seq > after),
          meta: { hasMore: false },
        };
      }),
    },
  );
  await screen.findByText(/partial/);
  rows = [
    prompt(1),
    chunk('complete'),
    prompt(3),
    { ...chunk('intervening complete'), seq: 4 },
    prompt(5),
  ];
  for (const seq of [3, 5]) {
    fireEvent.click(screen.getByText('Send'));
    await waitFor(() =>
      expect(client.getQueryData<TranscriptEvent[]>(key)?.at(-1)?.seq).toBe(
        seq,
      ),
    );
  }
  expect(afters).toEqual([0]);
  await act(async () => {
    await client.invalidateQueries({ queryKey: key });
  });
  expect(afters).toEqual([0, 1]);
  const events = client.getQueryData<TranscriptEvent[]>(key)!;
  expect(events.map((e) => e.seq)).toEqual([1, 2, 3, 4, 5]);
  expect(JSON.stringify(events)).toContain('complete');
  expect(JSON.stringify(events)).toContain('intervening complete');
  await act(async () => {
    await client.invalidateQueries({ queryKey: key });
  });
  expect(afters).toEqual([0, 1, 4]);
});

it('keeps re-reading an unfinished tail, including structurally unchanged reads', async () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });
  let text = 'partial';
  const afters: number[] = [];
  await renderWithApp(
    createElement(QueryClientProvider, { client }, createElement(Probe)),
    {
      plugins: [plugin({ routes: false })],
      namespace: '@nocobase/app-plugin-agent-sessions',
      fetch: answerApi(({ query }) => {
        const after = Number(query?.after ?? 0);
        afters.push(after);
        return {
          data: [prompt(1), chunk(text)].filter((e) => e.seq > after),
          meta: { hasMore: false },
        };
      }),
    },
  );
  await screen.findByText(/partial/);
  for (const next of ['partial', 'partial growing', 'complete']) {
    text = next;
    await act(async () => {
      await client.invalidateQueries({ queryKey: key });
    });
    expect(JSON.stringify(client.getQueryData(key))).toContain(next);
  }
  expect(afters).toEqual([0, 1, 1, 1]);
});

it('does not commit read progress from a cancelled GET that settles after confirmation', async () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });
  const afters: number[] = [];
  let finishRead: ((answer: unknown) => void) | undefined;
  let cancelledSignal: AbortSignal | null | undefined;
  let finishRecovery: ((answer: unknown) => void) | undefined;
  await renderWithApp(
    createElement(QueryClientProvider, { client }, createElement(Probe)),
    {
      plugins: [plugin({ routes: false })],
      namespace: '@nocobase/app-plugin-agent-sessions',
      fetch: async (input, init) => {
        const request =
          input instanceof Request ? input : new Request(input, init);
        if (request.method === 'GET' && afters.length === 1)
          cancelledSignal = request.signal;
        return answerApi(({ method, query }) => {
          if (method === 'POST') return { data: prompt(3) };
          const after = Number(query?.after ?? 0);
          afters.push(after);
          if (afters.length === 2)
            return new Promise((resolve) => {
              finishRead = resolve;
            });
          if (afters.length >= 3)
            return new Promise((resolve) => {
              finishRecovery = resolve;
            });
          return {
            data: [
              prompt(1),
              chunk(afters.length === 1 ? 'partial' : 'complete'),
              prompt(3),
              { ...chunk('second reply'), seq: 4 },
            ].filter(
              (e) => e.seq > after && (afters.length !== 1 || e.seq <= 2),
            ),
            meta: { hasMore: false },
          };
        })(input, init);
      },
    },
  );
  await screen.findByText(/partial/);
  void client.invalidateQueries({ queryKey: key });
  await waitFor(() => expect(finishRead).toBeDefined());
  fireEvent.click(screen.getByText('Send'));
  await waitFor(() =>
    expect(client.getQueryData<TranscriptEvent[]>(key)?.at(-1)?.seq).toBe(3),
  );
  expect(cancelledSignal?.aborted).toBe(true);
  await act(async () => {
    finishRead!({
      data: [
        chunk('complete'),
        prompt(3),
        { ...chunk('second reply'), seq: 4 },
      ],
      meta: { hasMore: false },
    });
  });
  expect(JSON.stringify(client.getQueryData(key))).toContain('partial');
  const recovery = client.invalidateQueries(
    { queryKey: key },
    { cancelRefetch: false },
  );
  await waitFor(() => expect(finishRecovery).toBeDefined());
  await act(async () => {
    finishRecovery!({
      data: [
        chunk('complete'),
        prompt(3),
        { ...chunk('second reply'), seq: 4 },
      ],
      meta: { hasMore: false },
    });
    await recovery;
  });
  expect(afters).toEqual([0, 1, 1]);
  expect(JSON.stringify(client.getQueryData(key))).toContain('complete');
});

it('recovers a preceding streamed tail through the actual compensation polling callback', async () => {
  const intervals = vi.spyOn(globalThis, 'setInterval');
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });
  let completed = false;
  const afters: number[] = [];
  await renderWithApp(
    createElement(QueryClientProvider, { client }, createElement(Probe)),
    {
      plugins: [plugin({ routes: false })],
      namespace: '@nocobase/app-plugin-agent-sessions',
      fetch: answerApi(({ method, query }) => {
        if (method === 'POST') {
          completed = true;
          return { data: prompt(3) };
        }
        const after = Number(query?.after ?? 0);
        afters.push(after);
        return {
          data: [
            prompt(1),
            chunk(completed ? 'complete' : 'partial'),
            ...(completed ? [prompt(3)] : []),
          ].filter((e) => e.seq > after),
          meta: { hasMore: false },
        };
      }),
    },
  );
  await screen.findByText(/partial/);
  fireEvent.click(screen.getByText('Send'));
  await waitFor(() =>
    expect(client.getQueryData<TranscriptEvent[]>(key)?.at(-1)?.seq).toBe(3),
  );
  const poll = intervals.mock.calls
    .filter(([, ms]) => ms === 60_000)
    .at(-1)?.[0];
  expect(typeof poll).toBe('function');
  await act(async () => {
    if (typeof poll === 'function') poll();
  });
  await screen.findByText(/complete/);
  expect(afters).toEqual([0, 1]);
  intervals.mockRestore();
});

function LiveReaderProbe() {
  useLiveSessions();
  return createElement(Probe);
}
it('reconnect re-reads a preceding streamed event after a confirmation', async () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });
  const opened = new Set<() => void>();
  const afters: number[] = [];
  let complete = false;
  const realtime: Pick<
    RealtimeClient,
    'subscribe' | 'onOpen' | 'onError' | 'connected' | 'reconnect' | 'close'
  > = {
    connected: true,
    subscribe: () => () => {},
    onOpen: (listener) => {
      opened.add(listener);
      return () => {
        opened.delete(listener);
      };
    },
    onError: () => () => {},
    reconnect: () => {},
    close: () => {},
  };
  await renderWithApp(
    createElement(
      QueryClientProvider,
      { client },
      createElement(LiveReaderProbe),
    ),
    {
      plugins: [plugin({ routes: false })],
      namespace: '@nocobase/app-plugin-agent-sessions',
      services: (app) => {
        const actual = app.container.resolve(realtimeClientToken);
        vi.spyOn(actual, 'connected', 'get').mockReturnValue(true);
        vi.spyOn(actual, 'watch').mockImplementation((topic, options) => {
          const stop = realtime.subscribe(topic, (event) =>
            options?.onEvent?.(event),
          );
          const stopReady = realtime.onOpen(() => options?.onReady?.());
          return {
            state: 'subscribed',
            error: undefined,
            retry: () => {},
            close: () => {
              stop();
              stopReady();
            },
          };
        });
      },
      fetch: answerApi(({ method, query }) => {
        if (method === 'POST') {
          complete = true;
          return { data: prompt(3) };
        }
        const after = Number(query?.after ?? 0);
        afters.push(after);
        return {
          data: [
            prompt(1),
            chunk(complete ? 'complete' : 'partial'),
            ...(complete ? [prompt(3)] : []),
          ].filter((e) => e.seq > after),
          meta: { hasMore: false },
        };
      }),
    },
  );
  await screen.findByText(/partial/);
  fireEvent.click(screen.getByText('Send'));
  await waitFor(() =>
    expect(client.getQueryData<TranscriptEvent[]>(key)?.at(-1)?.seq).toBe(3),
  );
  await act(async () => {
    for (const listener of opened) listener();
  });
  await screen.findByText(/complete/);
  expect(afters).toEqual([0, 1]);
  expect(
    client.getQueryData<TranscriptEvent[]>(key)?.map((e) => e.seq),
  ).toEqual([1, 2, 3]);
});

it('advances only through successfully fetched pages, not a higher confirmation', async () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });
  const afters: number[] = [];
  let completed = false;
  await renderWithApp(
    createElement(QueryClientProvider, { client }, createElement(Probe)),
    {
      plugins: [plugin({ routes: false })],
      namespace: '@nocobase/app-plugin-agent-sessions',
      fetch: answerApi(({ method, query }) => {
        if (method === 'POST') {
          completed = true;
          return { data: prompt(5) };
        }
        const after = Number(query?.after ?? 0);
        afters.push(after);
        const rows = (
          completed
            ? [
                prompt(1),
                chunk('complete'),
                prompt(3),
                { ...chunk('intervening reply'), seq: 4 },
                prompt(5),
              ]
            : [prompt(1), chunk('partial')]
        ).filter((e) => e.seq > after);
        return { data: rows.slice(0, 2), meta: { hasMore: rows.length > 2 } };
      }),
    },
  );
  await screen.findByText(/partial/);
  fireEvent.click(screen.getByText('Send'));
  await waitFor(() =>
    expect(client.getQueryData<TranscriptEvent[]>(key)?.at(-1)?.seq).toBe(5),
  );
  await act(async () => {
    await client.invalidateQueries({ queryKey: key });
  });
  expect(afters).toEqual([0, 1, 3]);
  expect(
    client.getQueryData<TranscriptEvent[]>(key)?.map((e) => e.seq),
  ).toEqual([1, 2, 3, 4, 5]);
  await act(async () => {
    await client.invalidateQueries({ queryKey: key });
  });
  expect(afters).toEqual([0, 1, 3, 4]);
});
