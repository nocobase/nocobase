import { realtimeClientToken } from '@nocobase/app-client';
import { useState } from 'react';
import { answerApi, renderWithApp } from '@nocobase/app-testing/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import plugin from '../../client/plugin.js';
import { AgentSessionsConfigContext } from '../../client/config.js';
import { NewSession } from '../../client/components/new-session.js';
import type { Computer, DiscoveredChoices } from '../../shared/api.js';

const computer: Computer = {
  id: 'fresh',
  name: 'Fresh computer',
  platform: 'linux',
  arch: 'x64',
  host: 'test',
  home: '/work',
  roots: ['/work'],
  folders: ['/work'],
  defaultFolders: true,
  online: true,
  agents: [{ id: 'codex', name: 'Codex', version: 'test' }],
  choices: {},
  commands: {},
  lastSeenAt: '2026-10-13T08:00:00Z',
  createdAt: '2026-10-13T08:00:00Z',
};
const choices: DiscoveredChoices = {
  status: 'available',
  choices: [
    {
      id: 'model',
      category: 'model',
      name: 'Model',
      currentValue: 'initial',
      options: [
        { value: 'initial', name: 'Initial model' },
        { value: 'chosen', name: 'Chosen model' },
      ],
    },
    {
      id: 'effort',
      category: 'thought_level',
      name: 'Reasoning',
      currentValue: 'high',
      options: [{ value: 'high', name: 'High' }],
    },
  ],
};

beforeEach(() => localStorage.clear());

describe('new-session composer', () => {
  it('shows only the background connection command when all computers are offline', async () => {
    await renderWithApp(
      <QueryClientProvider client={new QueryClient()}>
        <AgentSessionsConfigContext.Provider
          value={{ cli: 'nb-studio', connectPrompt: null, linkPanels: {} }}
        >
          <NewSession />
        </AgentSessionsConfigContext.Provider>
      </QueryClientProvider>,
      {
        plugins: [plugin({ routes: false })],
        namespace: '@nocobase/app-plugin-agent-sessions',
        fetch: answerApi(({ path }) =>
          path === 'agentSessions/computers'
            ? { data: [{ ...computer, online: false }], meta: { total: 1 } }
            : { data: [], meta: {} },
        ),
      },
    );
    expect(
      await screen.findByRole('heading', {
        name: 'Your computers are offline',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('nb-studio acp service install'),
    ).toBeInTheDocument();
    expect(screen.queryByText('nb-studio acp start')).not.toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('explains an available surface with no selectable values instead of leaving an empty settings bar', async () => {
    await renderWithApp(
      <QueryClientProvider
        client={
          new QueryClient({ defaultOptions: { queries: { retry: false } } })
        }
      >
        <NewSession />
      </QueryClientProvider>,
      {
        plugins: [plugin({ routes: false })],
        services: (app) => {
          vi.spyOn(
            app.container.resolve(realtimeClientToken),
            'connected',
            'get',
          ).mockReturnValue(true);
        },
        namespace: '@nocobase/app-plugin-agent-sessions',
        fetch: answerApi(({ path }) => {
          if (path === 'agentSessions/computers')
            return { data: [computer], meta: { total: 1 } };
          if (path.endsWith('/discoverChoices'))
            return {
              data: {
                status: 'available',
                choices: [
                  {
                    id: 'mode',
                    category: 'mode',
                    name: 'Mode',
                    currentValue: 'default',
                    options: [],
                  },
                ],
              },
            };
          return { data: [], meta: {} };
        }),
      },
    );
    await screen.findByText(
      'This agent has no configurable settings. Its defaults will be used.',
    );
    expect(screen.getByRole('textbox')).not.toBeDisabled();
  });
  it('tells to update the command line on a computer whose bridge was refused as too old', async () => {
    await renderWithApp(
      <QueryClientProvider
        client={
          new QueryClient({ defaultOptions: { queries: { retry: false } } })
        }
      >
        <AgentSessionsConfigContext.Provider
          value={{ cli: 'nb-studio', connectPrompt: null, linkPanels: {} }}
        >
          <NewSession />
        </AgentSessionsConfigContext.Provider>
      </QueryClientProvider>,
      {
        plugins: [plugin({ routes: false })],
        services: (app) => {
          vi.spyOn(
            app.container.resolve(realtimeClientToken),
            'connected',
            'get',
          ).mockReturnValue(true);
        },
        namespace: '@nocobase/app-plugin-agent-sessions',
        fetch: answerApi(({ path }) => {
          if (path === 'agentSessions/computers')
            return {
              data: [
                {
                  ...computer,
                  online: false,
                  host: 'nb-studio 1.0.0-beta.56',
                  outdatedBridge: {
                    host: 'nb-studio 1.0.0-beta.56',
                    bridgeProtocol: 1,
                    protocol: 2,
                    refusedAt: '2026-10-14T08:00:00Z',
                  },
                },
              ],
              meta: { total: 1 },
            };
          return { data: [], meta: {} };
        }),
      },
    );
    expect((await screen.findByRole('alert')).textContent).toContain(
      'nb-studio 1.0.0-beta.56',
    );
    expect(screen.getByRole('alert').textContent).toContain(
      'bridge protocol 1, and the application needs 2',
    );
    expect(screen.getByText('nb-studio update')).toBeInTheDocument();
    expect(
      screen.getByText('nb-studio acp service install', {
        selector: '[role=alert] code',
      }),
    ).toBeInTheDocument();
  });
  it('keeps the selected computer when it goes offline and clears its settings before switching', async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const other = {
      ...computer,
      id: 'other',
      name: 'Other computer',
      folders: ['/work/other'],
    };
    const requests: string[] = [];
    await renderWithApp(
      <QueryClientProvider client={client}>
        <NewSession />
      </QueryClientProvider>,
      {
        plugins: [plugin({ routes: false })],
        services: (app) => {
          vi.spyOn(
            app.container.resolve(realtimeClientToken),
            'connected',
            'get',
          ).mockReturnValue(true);
        },
        namespace: '@nocobase/app-plugin-agent-sessions',
        fetch: answerApi(({ path }) => {
          if (path === 'agentSessions/computers')
            return { data: [computer, other], meta: { total: 2 } };
          if (path.endsWith('/discoverChoices')) {
            requests.push(path);
            return { data: choices };
          }
          if (path === 'agentSessions/projects') return { data: [] };
          return { data: [], meta: {} };
        }),
      },
    );
    await screen.findByText('Initial model');
    await act(async () =>
      client.setQueryData(
        ['agentSessions', 'computers'],
        [{ ...computer, online: false }, other],
      ),
    );
    await screen.findByText(
      'This computer is offline. Reconnect its bridge to load settings and send.',
    );
    expect(
      screen.getByRole('button', { name: 'Fresh computer' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('textbox')).not.toBeDisabled();
    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();
    expect(screen.queryByText('Initial model')).toBeNull();
    expect(requests).toEqual(['agentSessions/computers/fresh/discoverChoices']);
    fireEvent.click(screen.getByRole('button', { name: 'Fresh computer' }));
    fireEvent.click(
      await screen.findByRole('menuitem', { name: /Other computer/ }),
    );
    await screen.findByText('Initial model');
    expect(requests.at(-1)).toBe(
      'agentSessions/computers/other/discoverChoices',
    );
  });
  it('sends the discovered settings with a locked target once discovery answers', async () => {
    const discovered: { input: unknown; resolve: (value: unknown) => void }[] =
      [];
    let creation: unknown;
    let finishCreate: ((value: unknown) => void) | undefined;
    await renderWithApp(
      <QueryClientProvider
        client={
          new QueryClient({ defaultOptions: { queries: { retry: false } } })
        }
      >
        <NewSession />
      </QueryClientProvider>,
      {
        plugins: [plugin({ routes: false })],
        services: (app) => {
          vi.spyOn(
            app.container.resolve(realtimeClientToken),
            'connected',
            'get',
          ).mockReturnValue(true);
        },
        namespace: '@nocobase/app-plugin-agent-sessions',
        fetch: answerApi(({ path, method, json }) => {
          if (path === 'agentSessions/computers')
            return { data: [computer], meta: { total: 1 } };
          if (path.endsWith('/discoverChoices'))
            return new Promise((resolve) =>
              discovered.push({ input: json, resolve }),
            );
          if (path === 'agentSessions/projects') return { data: [] };
          if (path === 'agentSessions/sessions' && method === 'POST') {
            creation = json;
            return new Promise((resolve) => {
              finishCreate = resolve;
            });
          }
          if (path === 'agentSessions/sessions') return { data: [], meta: {} };
          return { data: [] };
        }),
      },
    );
    await screen.findByText('Loading settings…');
    expect(screen.getByRole('textbox')).not.toBeDisabled();
    await waitFor(() => expect(discovered).toHaveLength(1));
    await act(async () => discovered[0]!.resolve({ data: choices }));
    await screen.findByText('Reasoning: High');
    fireEvent.click(screen.getByRole('button', { name: 'Initial model' }));
    fireEvent.click(
      await screen.findByRole('menuitemradio', { name: 'Chosen model' }),
    );
    await waitFor(() => expect(discovered).toHaveLength(2));
    // Discovery names the session the message creates, so the computer keeps the agent it starts for it.
    expect(discovered[1]!.input).toEqual({
      agentId: 'codex',
      cwd: '/work',
      settings: { model: 'chosen' },
      sessionId: (discovered[0]!.input as { sessionId: string }).sessionId,
    });
    expect(screen.getByRole('textbox')).not.toBeDisabled();
    await act(async () =>
      discovered[1]!.resolve({
        data: {
          ...choices,
          choices: choices.choices.map((choice) =>
            choice.id === 'model'
              ? { ...choice, currentValue: 'chosen' }
              : choice,
          ),
        },
      }),
    );
    await screen.findByText('Chosen model');
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'First message' },
    });
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });
    await waitFor(() =>
      expect(creation).toMatchObject({
        computerId: 'fresh',
        agentId: 'codex',
        cwd: '/work',
        settings: { model: 'chosen', effort: 'high' },
        content: [{ type: 'text', text: 'First message' }],
        submissionId: (discovered[1]!.input as { sessionId: string }).sessionId,
      }),
    );
    expect(
      screen.getByRole('button', { name: 'Fresh computer' }).closest('[inert]'),
    ).not.toBeNull();
    await act(async () => finishCreate?.({ data: { id: 'new-session' } }));
  });
  it('sends before discovery answers, with only the settings the person chose', async () => {
    let creation: unknown;
    const discoveries: unknown[] = [];
    await renderWithApp(
      <QueryClientProvider
        client={
          new QueryClient({ defaultOptions: { queries: { retry: false } } })
        }
      >
        <NewSession />
      </QueryClientProvider>,
      {
        plugins: [plugin({ routes: false })],
        services: (app) => {
          vi.spyOn(
            app.container.resolve(realtimeClientToken),
            'connected',
            'get',
          ).mockReturnValue(true);
        },
        namespace: '@nocobase/app-plugin-agent-sessions',
        fetch: answerApi(({ path, method, json }) => {
          if (path === 'agentSessions/computers')
            return { data: [computer], meta: { total: 1 } };
          // The agent is still starting: discovery has not answered when the message goes.
          if (path.endsWith('/discoverChoices')) {
            discoveries.push(json);
            return new Promise(() => {});
          }
          if (path === 'agentSessions/projects') return { data: [] };
          if (path === 'agentSessions/sessions' && method === 'POST') {
            creation = json;
            return { data: { id: 'new-session' } };
          }
          if (path === 'agentSessions/sessions') return { data: [], meta: {} };
          return { data: [] };
        }),
      },
    );
    await screen.findByText('Loading settings…');
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'First message' },
    });
    expect(screen.getByRole('button', { name: 'Send' })).not.toBeDisabled();
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });
    await waitFor(() =>
      expect(creation).toMatchObject({
        computerId: 'fresh',
        agentId: 'codex',
        cwd: '/work',
        settings: {},
        content: [{ type: 'text', text: 'First message' }],
        // The session is created with the id its discovery named, so it takes over that agent.
        submissionId: (discoveries[0] as { sessionId: string }).sessionId,
      }),
    );
    // While the page is still shown, the next draft does not discover and start another agent.
    await act(async () => new Promise((resolve) => setTimeout(resolve, 50)));
    expect(discoveries).toHaveLength(1);
  });
});

it('retains a pending first send across navigation and does not let a second mounted composer submit it', async () => {
  let finish: ((value: unknown) => void) | undefined;
  let creates = 0;
  function Menu() {
    const [shown, setShown] = useState(true);
    return (
      <>
        <button onClick={() => setShown(!shown)}>Navigate</button>
        {shown && <NewSession />}
      </>
    );
  }
  await renderWithApp(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <Menu />
    </QueryClientProvider>,
    {
      namespace: '@nocobase/app-plugin-agent-sessions',
      plugins: [plugin({ routes: false })],
      services: (app) => {
        vi.spyOn(
          app.container.resolve(realtimeClientToken),
          'connected',
          'get',
        ).mockReturnValue(true);
      },
      fetch: answerApi(({ path, method }) => {
        if (path === 'agentSessions/computers') return { data: [computer] };
        if (path.endsWith('/discoverChoices')) return { data: choices };
        if (path === 'agentSessions/sessions' && method === 'POST') {
          creates++;
          return new Promise((resolve) => {
            finish = resolve;
          });
        }
        return { data: [], meta: {} };
      }),
    },
  );
  await screen.findByText('Initial model');
  fireEvent.change(screen.getByRole('textbox'), {
    target: { value: 'Only submit once' },
  });
  fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });
  await waitFor(() => expect(creates).toBe(1));
  fireEvent.click(screen.getByText('Navigate'));
  fireEvent.click(screen.getByText('Navigate'));
  expect(screen.getByRole('textbox')).toHaveValue('Only submit once');
  expect(screen.getByRole('textbox')).toBeDisabled();
  expect(screen.getByText('Sending…')).toBeInTheDocument();
  fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });
  expect(creates).toBe(1);
  await act(async () => {
    finish?.({ data: { id: 'created' } });
  });
  await waitFor(() => expect(screen.getByRole('textbox')).toHaveValue(''));
});
