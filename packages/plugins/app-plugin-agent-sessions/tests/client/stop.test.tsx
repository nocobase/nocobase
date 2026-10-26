import {
  answerApi,
  renderWithApp,
  type ApiCall,
} from '@nocobase/app-testing/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { useEffect, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import plugin from '../../client/plugin.js';
import { Composer } from '../../client/components/composer.js';
import { useStop } from '../../client/use-stop.js';
import type { TranscriptItem } from '../../client/transcript.js';

const prompt = (
  id: string,
  state:
    'running' | 'queued' | 'cancelled' | 'done' | 'withdrawing' | 'withdrawn',
): TranscriptItem => ({
  type: 'prompt',
  key: id,
  promptId: id,
  at: '',
  text: id,
  images: [],
  state,
  withdrawable: true,
});
const options = {
  namespace: '@nocobase/app-plugin-agent-sessions',
  plugins: [plugin({ routes: false })],
};

describe('stopping a session', () => {
  it('keeps draft text and attachments while the stop button remains available', async () => {
    const stop = vi.fn(),
      send = vi.fn();
    await renderWithApp(
      <QueryClientProvider client={new QueryClient()}>
        <Composer
          placeholder='Draft'
          busy
          onStop={stop}
          onSend={send}
          initialContent={[
            { type: 'text', text: 'Keep this' },
            { type: 'image', mimeType: 'image/png', data: 'aGVsbG8=' },
          ]}
        />
      </QueryClientProvider>,
      options,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Stop' }));
    expect(stop).toHaveBeenCalledOnce();
    expect(send).not.toHaveBeenCalled();
    expect(screen.getByRole('textbox')).toHaveValue('Keep this');
    expect(
      screen.getByRole('button', { name: 'Remove image' }),
    ).toBeInTheDocument();
  });

  it('lets suggestions consume Escape without sending or stopping', async () => {
    const outer = vi.fn(),
      stop = vi.fn();
    await renderWithApp(
      <QueryClientProvider client={new QueryClient()}>
        <div onKeyDown={outer}>
          <Composer
            placeholder='Draft'
            busy
            onStop={stop}
            onSend={vi.fn()}
            commands={[{ name: 'help', description: 'Show help' }]}
          />
        </div>
      </QueryClientProvider>,
      options,
    );
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '/h' } });
    expect(screen.getByText('Show help')).toBeVisible();
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(screen.queryByText('Show help')).toBeNull();
    expect(outer).not.toHaveBeenCalled();
    expect(stop).not.toHaveBeenCalled();
    expect(input).toHaveValue('/h');
  });

  it('deduplicates surfaces, waits for withdrawal confirmation and retains failed targets', async () => {
    const client = new QueryClient();
    const failure = vi.fn();
    let replaceItems!: (value: TranscriptItem[]) => void;
    let rejectRequest: boolean | 'stale' = true;
    const calls: ApiCall[] = [];
    function Surface({
      items,
      name,
    }: {
      items: TranscriptItem[];
      name: string;
    }) {
      const stop = useStop('session', items, failure);
      return (
        <button onClick={stop.stop}>
          {name}:{stop.pending ? 'pending' : stop.active ? 'retry' : 'idle'}
        </button>
      );
    }
    function Harness() {
      const [items, setItems] = useState(() => [
        prompt('A', 'running'),
        prompt('B', 'queued'),
      ]);
      useEffect(() => {
        replaceItems = setItems;
      }, []);
      return (
        <QueryClientProvider client={client}>
          <Surface items={items} name='first' />
          <Surface items={items} name='second' />
        </QueryClientProvider>
      );
    }
    await renderWithApp(<Harness />, {
      ...options,
      fetch: answerApi((call) => {
        if (call.method === 'POST') {
          calls.push(call);
          if (rejectRequest)
            return Response.json(
              {
                error: {
                  message: 'Unavailable',
                  ...(rejectRequest === 'stale'
                    ? { reason: 'AGENT_SESSIONS_STOP_TARGET_CHANGED' }
                    : {}),
                },
              },
              { status: rejectRequest === 'stale' ? 400 : 503 },
            );
        }
        return { data: null };
      }),
    });
    fireEvent.click(screen.getByRole('button', { name: 'first:idle' }));
    fireEvent.click(screen.getByRole('button', { name: /^second:/ }));
    await screen.findByRole('button', { name: 'first:retry' });
    expect(calls).toHaveLength(1);
    rejectRequest = false;
    // A response failure must not redirect retry to a newly observed running turn.
    act(() =>
      replaceItems([
        prompt('A', 'cancelled'),
        prompt('B', 'withdrawing'),
        prompt('C', 'running'),
      ]),
    );
    fireEvent.click(screen.getByRole('button', { name: 'first:retry' }));
    await waitFor(() => expect(calls).toHaveLength(2));
    expect(calls[1]?.json).toEqual({ promptId: 'A' });
    expect(screen.getByRole('button', { name: 'first:pending' })).toBeVisible();
    act(() =>
      replaceItems([prompt('A', 'cancelled'), prompt('B', 'withdrawn')]),
    );
    await screen.findByRole('button', { name: 'first:idle' });
    fireEvent.click(screen.getByRole('button', { name: 'first:idle' }));
    expect(calls).toHaveLength(2);
    rejectRequest = 'stale';
    act(() => replaceItems([prompt('D', 'running')]));
    fireEvent.click(screen.getByRole('button', { name: 'first:idle' }));
    await waitFor(() => expect(calls).toHaveLength(3));
    await screen.findByRole('button', { name: 'first:idle' });
    // A definitive stale-target response must not trap the UI in retries of the old turn.
    rejectRequest = false;
    act(() => replaceItems([prompt('E', 'running')]));
    fireEvent.click(screen.getByRole('button', { name: 'first:idle' }));
    await waitFor(() => expect(calls).toHaveLength(4));
    expect(calls[3]?.json).toEqual({ promptId: 'E' });
  });
});

function ReconciliationHarness({
  failure,
  register,
}: {
  failure: (error: unknown) => void;
  register: (update: (items: TranscriptItem[]) => void) => void;
}) {
  const [items, setItems] = useState(() => [
    prompt('A', 'running'),
    prompt('B', 'queued'),
  ]);
  useEffect(() => {
    register(setItems);
  }, [register]);
  const stop = useStop('reconcile', items, failure);
  return (
    <button onClick={stop.stop}>
      {stop.pending ? 'pending' : stop.active ? 'retry' : 'idle'}
    </button>
  );
}

it.each(['lost response', 'natural completion', 'late confirmation'] as const)(
  'reconciles %s without another stop request',
  async (scenario) => {
    const client = new QueryClient();
    const failure = vi.fn();
    const requests: ApiCall[] = [];
    let update!: (items: TranscriptItem[]) => void;
    await renderWithApp(
      <QueryClientProvider client={client}>
        <ReconciliationHarness
          failure={failure}
          register={(setItems) => {
            update = setItems;
          }}
        />
      </QueryClientProvider>,
      {
        ...options,
        fetch: answerApi((call) => {
          if (call.method === 'POST') {
            requests.push(call);
            if (scenario !== 'late confirmation')
              return Response.json(
                { error: { message: 'Lost response' } },
                { status: 503 },
              );
          }
          return { data: null };
        }),
      },
    );
    if (scenario === 'late confirmation') vi.useFakeTimers();
    try {
      fireEvent.click(screen.getByRole('button', { name: 'idle' }));
      if (scenario === 'late confirmation') {
        await act(async () => {
          await vi.advanceTimersByTimeAsync(30_001);
        });
        expect(screen.getByRole('button', { name: 'retry' })).toBeVisible();
        vi.useRealTimers();
      } else await screen.findByRole('button', { name: 'retry' });
      expect(requests).toHaveLength(1);
      // A terminal target alone is not enough while the queued input is still awaiting removal.
      act(() =>
        update([
          prompt('A', scenario === 'natural completion' ? 'done' : 'cancelled'),
          prompt('B', 'withdrawing'),
        ]),
      );
      expect(screen.getByRole('button', { name: 'retry' })).toBeVisible();
      act(() =>
        update([
          prompt('A', scenario === 'natural completion' ? 'done' : 'cancelled'),
          prompt('B', 'withdrawn'),
        ]),
      );
      await screen.findByRole('button', { name: 'idle' });
      expect(requests).toHaveLength(1);
    } finally {
      vi.useRealTimers();
    }
  },
);
