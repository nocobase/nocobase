import {
  answerApi,
  renderWithApp,
  type ApiCall,
} from '@nocobase/app-testing/client';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { useState, type ReactElement } from 'react';
import { describe, expect, it } from 'vitest';

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
  const discovery = useChoiceDiscovery(
    JSON.stringify([computerId, agentId, cwd, online]),
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
      <button disabled={!discovery.result || discovery.loading}>Send</button>
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
        choices={discovery.result?.choices}
        onChoose={discovery.choose}
      />
    </>
  );
}

async function setup() {
  const requests: { call: ApiCall; resolve: (result: unknown) => void }[] = [];
  await renderWithApp(<Probe />, {
    namespace: '@nocobase/app-plugin-agent-sessions',
    plugins: [plugin({ routes: false })],
    fetch: answerApi(
      (call) =>
        new Promise((resolve) => {
          requests.push({ call, resolve });
        }),
    ),
  });
  await waitFor(() => expect(requests).toHaveLength(1));
  const answer = async (index: number, result: unknown): Promise<void> => {
    await act(async () => {
      requests[index]!.resolve(result);
    });
  };
  return { requests, answer };
}

describe('choice discovery', () => {
  it('ignores delayed responses across A → B → A and clears settings on computer, agent and folder changes', async () => {
    const { requests, answer } = await setup();
    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();
    fireEvent.click(screen.getByText('Computer'));
    await waitFor(() => expect(requests).toHaveLength(2));
    fireEvent.click(screen.getByText('Computer'));
    await waitFor(() => expect(requests).toHaveLength(3));
    await answer(0, { data: choice('stale-A') });
    await answer(1, { data: choice('stale-B') });
    expect(screen.queryByText('stale-A')).toBeNull();
    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();
    await answer(2, { data: choice('fresh-A') });
    await screen.findByText('fresh-A');
    fireEvent.click(screen.getByRole('button', { name: 'fresh-A' }));
    fireEvent.click(
      await screen.findByRole('menuitemradio', { name: 'Other' }),
    );
    await waitFor(() => expect(requests).toHaveLength(4));
    expect(requests[3]!.call.json).toMatchObject({
      settings: { model: 'other' },
    });
    await answer(3, { data: choice('other') });
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
