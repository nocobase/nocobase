import {
  answerApi,
  renderWithApp,
  type ApiCall,
} from '@nocobase/app-testing/client';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { useState, type ReactElement } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';

import plugin from '../../client/plugin.js';
import { ChoiceMenus } from '../../client/components/choice-menus.js';
import { useChoiceDiscovery } from '../../client/use-choice-discovery.js';
import type { DiscoveredChoices } from '../../shared/api.js';

const choice = (value: string): DiscoveredChoices => ({
  status: 'available',
  choices: [
    {
      id: 'model',
      category: 'model',
      name: 'Model',
      currentValue: value,
      options: [
        { value, name: value },
        { value: 'other', name: 'Other' },
      ],
    },
  ],
});

function Probe(): ReactElement {
  const [computerId, setComputerId] = useState('A');
  const [agentId, setAgentId] = useState('codex');
  const [cwd, setCwd] = useState('/work');
  const [online, setOnline] = useState(true);
  const [sent, setSent] = useState('');
  const discovery = useChoiceDiscovery(
    JSON.stringify([computerId, agentId, cwd]),
    { computerId, agentId, cwd, enabled: online },
  );
  return (
    <>
      <button onClick={() => setComputerId(computerId === 'A' ? 'B' : 'A')}>
        Computer
      </button>
      <button
        onClick={() => setAgentId(agentId === 'codex' ? 'claude' : 'codex')}
      >
        Agent
      </button>
      <button onClick={() => setCwd(cwd === '/work' ? '/other' : '/work')}>
        Folder
      </button>
      <button onClick={() => setOnline(!online)}>Connection</button>
      <button onClick={discovery.retry}>Retry</button>
      <button
        disabled={!discovery.result || discovery.loading}
        onClick={() => setSent(discovery.isCurrent() ? 'Sent' : 'Blocked')}
      >
        Send
      </button>
      <span>{sent}</span>
      <output>
        {online
          ? discovery.loading
            ? 'Loading'
            : discovery.error
              ? 'Failure'
              : discovery.result?.status
          : 'Offline'}
      </output>
      <ChoiceMenus
        choices={discovery.displayed?.choices}
        values={discovery.settings}
        loading={discovery.loading}
        onChoose={discovery.choose}
      />
    </>
  );
}

async function setup() {
  const requests: { call: ApiCall; resolve: (result: unknown) => void }[] = [];
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  function Menu(): ReactElement {
    const [shown, setShown] = useState(true);
    return (
      <>
        <button onClick={() => setShown(!shown)}>Navigate</button>
        {shown && <Probe />}
      </>
    );
  }
  await renderWithApp(
    <QueryClientProvider client={client}>
      <Menu />
    </QueryClientProvider>,
    {
      namespace: '@nocobase/app-plugin-agent-sessions',
      plugins: [plugin({ routes: false })],
      fetch: answerApi(
        (call) =>
          new Promise((resolve) => {
            requests.push({ call, resolve });
          }),
      ),
    },
  );
  await waitFor(() => expect(requests).toHaveLength(1));
  const answer = async (index: number, result: unknown): Promise<void> => {
    await act(async () => {
      requests[index]!.resolve(result);
    });
  };
  return { requests, answer, client };
}

describe('choice discovery', () => {
  it('shares a pending request through navigation and retains the selected model across ten returns', async () => {
    const { requests, answer } = await setup();
    fireEvent.click(screen.getByText('Navigate'));
    fireEvent.click(screen.getByText('Navigate'));
    expect(requests).toHaveLength(1);
    await answer(0, { data: choice('First') });
    await screen.findByText('First');
    fireEvent.click(screen.getByRole('button', { name: 'First' }));
    fireEvent.click(
      await screen.findByRole('menuitemradio', { name: 'Other' }),
    );
    await waitFor(() => expect(requests).toHaveLength(2));
    await answer(1, { data: choice('other') });
    for (let i = 0; i < 10; i++) {
      fireEvent.click(screen.getByText('Navigate'));
      fireEvent.click(screen.getByText('Navigate'));
      await screen.findByText('other');
      expect(screen.getByRole('button', { name: 'Send' })).not.toBeDisabled();
    }
    expect(requests).toHaveLength(2);
  });

  it('blocks cached settings while realtime is disconnected and revalidates without losing the model', async () => {
    const { requests, answer, client } = await setup();
    await answer(0, { data: choice('First') });
    await screen.findByText('First');
    fireEvent.click(screen.getByRole('button', { name: 'First' }));
    fireEvent.click(
      await screen.findByRole('menuitemradio', { name: 'Other' }),
    );
    await waitFor(() => expect(requests).toHaveLength(2));
    await answer(1, { data: choice('other') });
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Send' })).not.toBeDisabled(),
    );
    await act(async () => {
      client.setQueryData(['agentSessions', 'discoveryConnection'], false);
    });
    await screen.findByText('Failure');
    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();
    await act(async () => {
      void client.invalidateQueries({
        queryKey: ['agentSessions', 'discovery'],
        refetchType: 'none',
      });
      client.setQueryData(['agentSessions', 'discoveryConnection'], true);
    });
    await waitFor(() => expect(requests).toHaveLength(3));
    expect(requests[2]!.call.json).toMatchObject({
      settings: { model: 'other' },
    });
    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();
    await answer(2, { data: choice('other') });
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Send' })).not.toBeDisabled(),
    );
  });

  it('bounds an unresponsive transport and retries without accepting its late response', async () => {
    let expire: (() => void) | undefined;
    const original = globalThis.setTimeout;
    const timer = vi
      .spyOn(globalThis, 'setTimeout')
      .mockImplementation((handler, ms, ...args) => {
        if (ms === 30_000 && typeof handler === 'function')
          expire = () => handler(...args);
        return original(handler, ms, ...args);
      });
    try {
      const { requests, answer } = await setup();
      await act(async () => {
        expire?.();
      });
      await screen.findByText('Failure');
      expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();
      fireEvent.click(screen.getByText('Retry'));
      await waitFor(() => expect(requests).toHaveLength(2));
      await answer(0, { data: choice('Late') });
      expect(screen.queryByText('Late')).toBeNull();
      await answer(1, { data: choice('Retried') });
      await screen.findByText('Retried');
    } finally {
      timer.mockRestore();
    }
  });

  it('checks expiration again at submission even before a stale timer rerenders', async () => {
    const { answer } = await setup();
    await answer(0, { data: choice('First') });
    await screen.findByText('First');
    const clock = vi
      .spyOn(Date, 'now')
      .mockReturnValue(Date.now() + 6 * 60_000);
    try {
      fireEvent.click(screen.getByRole('button', { name: 'Send' }));
      expect(screen.getByText('Blocked')).toBeInTheDocument();
    } finally {
      clock.mockRestore();
    }
  });

  it('reuses a valid cached target and disables sending during revalidation', async () => {
    const { requests, answer, client } = await setup();
    await answer(0, { data: choice('First') });
    await screen.findByText('First');
    fireEvent.click(screen.getByText('Computer'));
    await waitFor(() => expect(requests).toHaveLength(2));
    await answer(1, { data: choice('Second') });
    await screen.findByText('Second');
    fireEvent.click(screen.getByText('Computer'));
    await screen.findByText('First');
    expect(requests).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Send' })).not.toBeDisabled();
    await act(async () => {
      void client.invalidateQueries({
        queryKey: ['agentSessions', 'discovery'],
      });
    });
    await waitFor(() => expect(requests).toHaveLength(3));
    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();
    await answer(2, { data: choice('Refreshed') });
    await screen.findByText('Refreshed');
  });

  it('shares pending discovery across A → B → A and isolates settings on computer, agent and folder changes', async () => {
    const { requests, answer } = await setup();
    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();
    fireEvent.click(screen.getByText('Computer'));
    await waitFor(() => expect(requests).toHaveLength(2));
    fireEvent.click(screen.getByText('Computer'));
    expect(requests).toHaveLength(2);
    await answer(1, { data: choice('stale-B') });
    expect(screen.queryByText('stale-B')).toBeNull();
    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();
    await answer(0, { data: choice('fresh-A') });
    await screen.findByText('fresh-A');
    fireEvent.click(screen.getByRole('button', { name: 'fresh-A' }));
    fireEvent.click(
      await screen.findByRole('menuitemradio', { name: 'Other' }),
    );
    await waitFor(() => expect(requests).toHaveLength(3));
    expect(requests[2]!.call.json).toMatchObject({
      settings: { model: 'other' },
    });
    await answer(2, { data: choice('other') });
    for (const name of ['Agent', 'Folder', 'Computer']) {
      const index = requests.length;
      fireEvent.click(screen.getByText(name));
      await waitFor(() => expect(requests).toHaveLength(index + 1));
      expect(requests[index]!.call.json).toMatchObject({ settings: {} });
      expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();
      await answer(index, { data: choice(name) });
    }
  });

  it('shows failure/retry, offline/reconnect and distinguishes empty from unsupported settings', async () => {
    const { requests, answer } = await setup();
    await answer(
      0,
      Response.json(
        {
          error: {
            message: 'Discovery failed',
            reason: 'AGENT_SESSIONS_DISCOVERY_FAILED',
            code: 'FAILED_PRECONDITION',
            status: 400,
            domain: 'agentSessions',
            requestId: 'test',
          },
        },
        { status: 400 },
      ),
    );
    await screen.findByText('Failure');
    fireEvent.click(screen.getByText('Retry'));
    await waitFor(() => expect(requests).toHaveLength(2));
    await answer(1, { data: { status: 'available', choices: [] } });
    await screen.findByText('available');
    expect(screen.getByRole('button', { name: 'Send' })).not.toBeDisabled();
    fireEvent.click(screen.getByText('Connection'));
    expect(screen.getByText('Offline')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();
    fireEvent.click(screen.getByText('Connection'));
    await waitFor(() => expect(requests).toHaveLength(3));
    await answer(2, { data: { status: 'unsupported', choices: [] } });
    await screen.findByText('unsupported');
    expect(screen.getByRole('button', { name: 'Send' })).not.toBeDisabled();
  });

  it('shows single-option choices as fixed labeled values', async () => {
    const { answer } = await setup();
    const fixed = choice('Only model');
    await answer(0, {
      data: {
        ...fixed,
        choices: fixed.choices.map((item) => ({
          ...item,
          options: item.options.slice(0, 1),
        })),
      },
    });
    await screen.findByText('Model: Only model');
    expect(screen.queryByRole('button', { name: 'Only model' })).toBeNull();
  });
});
