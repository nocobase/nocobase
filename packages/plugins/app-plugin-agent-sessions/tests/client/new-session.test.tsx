import { answerApi, renderWithApp } from '@nocobase/app-testing/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import plugin from '../../client/plugin.js';
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
    expect(screen.getByRole('textbox')).toBeDisabled();
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
  it('requires discovery on a fresh computer and sends the discovered settings with a locked target', async () => {
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
    expect(screen.getByRole('textbox')).toBeDisabled();
    await waitFor(() => expect(discovered).toHaveLength(1));
    await act(async () => discovered[0]!.resolve({ data: choices }));
    await screen.findByText('Reasoning: High');
    fireEvent.click(screen.getByRole('button', { name: 'Initial model' }));
    fireEvent.click(
      await screen.findByRole('menuitemradio', { name: 'Chosen model' }),
    );
    await waitFor(() => expect(discovered).toHaveLength(2));
    expect(discovered[1]!.input).toEqual({
      agentId: 'codex',
      cwd: '/work',
      settings: { model: 'chosen' },
    });
    expect(screen.getByRole('textbox')).toBeDisabled();
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
      }),
    );
    expect(
      screen.getByRole('button', { name: 'Fresh computer' }).closest('[inert]'),
    ).not.toBeNull();
    await act(async () => finishCreate?.({ data: { id: 'new-session' } }));
  });
});
