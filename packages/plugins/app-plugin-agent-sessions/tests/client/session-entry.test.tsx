import { realtimeClientToken } from '@nocobase/app-client';
import { answerApi, renderWithApp } from '@nocobase/app-testing/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  act,
  fireEvent,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { Route, Routes, useLocation } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import AgentSessionsPage from '../../client/pages/sessions.js';
import plugin from '../../client/plugin.js';
import { discoveryKey } from '../../client/use-choice-discovery.js';
import { sessionMemoryKey } from '../../client/use-session-memory.js';
import type { Session } from '../../shared/api.js';

const recent: Session = {
  id: 'recent',
  computerId: 'computer',
  agentId: 'codex',
  cwd: '/work/recent',
  title: 'Recent',
  titleSource: 'owner',
  state: null,
  startup: null,
  settings: {},
  running: false,
  waiting: false,
  computerOnline: true,
  lastSeq: 0,
  project: null,
  links: [],
  archivedAt: null,
  lastActivityAt: '2026-10-13T00:00:00Z',
  createdAt: '2026-10-13T00:00:00Z',
};

function Location() {
  const location = useLocation();
  return (
    <output data-testid='location'>
      {location.pathname + location.search}
    </output>
  );
}

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query.includes('min-width'),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
});
afterEach(() => vi.unstubAllGlobals());

async function setup(route = '/agent-sessions', cachedSettings = false) {
  let finish!: (response: Response) => void;
  const pending = new Promise<Response>((resolve) => {
    finish = resolve;
  });
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  // The draft's session id names its discovery, so cached choices belong to one draft.
  if (cachedSettings)
    client.setQueryData(sessionMemoryKey('new-session:id'), 'draft-session');
  if (cachedSettings)
    client.setQueryData(
      [
        ...discoveryKey,
        JSON.stringify([
          'computer',
          { id: 'codex', name: 'Codex', version: 'test' },
          '/work',
          ['/work'],
          ['/work'],
          '/work',
          'test',
        ]),
        {},
        'draft-session',
      ],
      {
        status: 'available',
        choices: [
          {
            id: 'model',
            category: 'model',
            name: 'Model',
            currentValue: 'first',
            options: [
              { value: 'first', name: 'First' },
              { value: 'second', name: 'Second' },
            ],
          },
        ],
      },
    );
  let first = true;
  let retryHistory = false;
  const discoveries: unknown[] = [];
  const fetch = answerApi(({ path, json }) => {
    if (path === 'agentSessions/sessions')
      return { data: retryHistory ? [recent] : [], meta: {} };
    if (path === 'agentSessions/computers')
      return {
        data: [
          {
            id: 'computer',
            name: 'Computer',
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
            lastSeenAt: '2026-10-13T00:00:00Z',
            createdAt: '2026-10-13T00:00:00Z',
          },
        ],
      };
    if (path.endsWith('/discoverChoices')) {
      discoveries.push(json);
      return {
        data: {
          status: 'available',
          choices: [
            {
              id: 'model',
              category: 'model',
              name: 'Model',
              currentValue: 'first',
              options: [
                { value: 'first', name: 'First' },
                { value: 'second', name: 'Second' },
              ],
            },
          ],
        },
      };
    }
    return { data: [], meta: {} };
  });
  await renderWithApp(
    <QueryClientProvider client={client}>
      <Location />
      <Routes>
        <Route path='/agent-sessions' element={<AgentSessionsPage />}>
          <Route path=':sessionId' element={<p>Opened recent session</p>} />
        </Route>
      </Routes>
    </QueryClientProvider>,
    {
      route,
      plugins: [plugin({ routes: false })],
      namespace: '@nocobase/app-plugin-agent-sessions',
      services: (app) => {
        vi.spyOn(
          app.container.resolve(realtimeClientToken),
          'connected',
          'get',
        ).mockReturnValue(true);
      },
      fetch: (request) => {
        if (
          new URL(request.url).pathname === '/api/agentSessions/sessions' &&
          first
        ) {
          first = false;
          return pending;
        }
        return fetch(request);
      },
    },
  );
  const complete = async (history: boolean, status = 200) => {
    retryHistory = history;
    await act(async () => {
      finish(
        new Response(
          JSON.stringify(
            status === 200
              ? {
                  data: history ? [recent] : [],
                  meta: {},
                }
              : { message: 'List unavailable' },
          ),
          { status, headers: { 'content-type': 'application/json' } },
        ),
      );
    });
  };
  return { client, complete, discoveries };
}

describe('ordinary session entry', () => {
  it('allows a cold empty-history draft before the list returns', async () => {
    const { complete } = await setup();
    const input = await screen.findByRole('textbox', {
      name: 'Say what you need. Several things at once, or a screenshot, are fine.',
    });
    fireEvent.change(input, { target: { value: 'Keep my draft' } });
    await complete(false);
    expect(input).toHaveValue('Keep my draft');
    expect(input).not.toBeDisabled();
  });

  it('opens the latest session after a delayed list without initializing an unused agent', async () => {
    const { complete, discoveries } = await setup();
    await screen.findByRole('textbox', {
      name: 'Say what you need. Several things at once, or a screenshot, are fine.',
    });
    await complete(true);
    await screen.findByText('Opened recent session');
    expect(screen.getByTestId('location')).toHaveTextContent(
      '/agent-sessions/recent',
    );
    expect(discoveries).toEqual([]);
  });

  it('keeps editing even after the draft is cleared and history arrives', async () => {
    const { complete, discoveries } = await setup('/agent-sessions', true);
    const input = await screen.findByRole('textbox', {
      name: 'Say what you need. Several things at once, or a screenshot, are fine.',
    });
    await screen.findByRole('button', { name: 'First', exact: true });
    fireEvent.change(input, { target: { value: 'Draft' } });
    fireEvent.change(input, { target: { value: '' } });
    await complete(true);
    expect(input).toBeInTheDocument();
    expect(screen.queryByText('Opened recent session')).not.toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent('?new');
    await screen.findByText('Recent');
    expect(discoveries).toEqual([]);
  });

  it('keeps a deliberate model choice when history arrives', async () => {
    const { complete } = await setup('/agent-sessions', true);
    fireEvent.click(
      await screen.findByRole('button', { name: 'First', exact: true }),
    );
    fireEvent.click(
      await screen.findByRole('menuitemradio', { name: 'Second', exact: true }),
    );
    await complete(true);
    await screen.findByRole('button', { name: 'Second', exact: true });
    expect(screen.queryByText('Opened recent session')).not.toBeInTheDocument();
  });

  it('keeps explicit new independent of a delayed history list', async () => {
    const { complete } = await setup('/agent-sessions?new');
    expect(screen.queryByRole('heading', { name: 'New session' })).toBeNull();
    const input = await screen.findByRole('textbox', {
      name: 'Say what you need. Several things at once, or a screenshot, are fine.',
    });
    await complete(true);
    expect(input).toBeInTheDocument();
    expect(screen.queryByText('Opened recent session')).not.toBeInTheDocument();
  });

  it('keeps the draft through a list failure and successful refetch', async () => {
    const { client, complete } = await setup();
    const input = await screen.findByRole('textbox', {
      name: 'Say what you need. Several things at once, or a screenshot, are fine.',
    });
    fireEvent.change(input, { target: { value: 'Survives list failure' } });
    await complete(true, 500);
    await act(async () => {
      await client.refetchQueries({ queryKey: ['agentSessions', 'sessions'] });
    });
    await screen.findByText('Recent');
    await waitFor(() => expect(input).toHaveValue('Survives list failure'));
    expect(screen.queryByText('Opened recent session')).not.toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent('?new');
  });
  it('protects image-only drafts before the image finishes reading', async () => {
    const { complete } = await setup('/agent-sessions?issue=kept');
    const input = await screen.findByRole('textbox', {
      name: 'Say what you need. Several things at once, or a screenshot, are fine.',
    });
    fireEvent.paste(input, {
      clipboardData: {
        files: [new File(['image'], 'image.png', { type: 'image/png' })],
      },
    });
    await complete(true);
    expect(input).toBeInTheDocument();
    await screen.findByRole('button', { name: 'Remove image' });
    expect(screen.getByTestId('location')).toHaveTextContent('issue=kept&new=');
  });
  it('keeps automatic recent entry when no supported image was added', async () => {
    const { complete } = await setup();
    const input = await screen.findByRole('textbox', {
      name: 'Say what you need. Several things at once, or a screenshot, are fine.',
    });
    fireEvent.paste(input, {
      clipboardData: {
        files: [
          new File(['document'], 'file.pdf', { type: 'application/pdf' }),
        ],
      },
    });
    await complete(true);
    await screen.findByText('Opened recent session');
  });
  it('keeps an in-progress configuration interaction when the list arrives', async () => {
    const { complete } = await setup();
    const computer = await screen.findByRole('button', {
      name: 'Computer',
      exact: true,
    });
    fireEvent.focus(computer);
    await complete(true);
    expect(screen.getByTestId('location')).toHaveTextContent('?new');
    expect(screen.queryByText('Opened recent session')).not.toBeInTheDocument();
    expect(
      screen.getByRole('textbox', {
        name: 'Say what you need. Several things at once, or a screenshot, are fine.',
      }),
    ).not.toBeDisabled();
  });
});

describe('archived view', () => {
  const old: Session = {
    ...recent,
    id: 'old',
    title: 'Old investigation',
    archivedAt: '2026-10-12T00:00:00Z',
  };

  async function render(route: string) {
    await renderWithApp(
      <QueryClientProvider
        client={
          new QueryClient({ defaultOptions: { queries: { retry: false } } })
        }
      >
        <Location />
        <Routes>
          <Route path='/agent-sessions' element={<AgentSessionsPage />}>
            <Route path=':sessionId' element={<SessionStub />} />
          </Route>
        </Routes>
      </QueryClientProvider>,
      {
        route,
        plugins: [plugin({ routes: false })],
        namespace: '@nocobase/app-plugin-agent-sessions',
        fetch: answerApi(({ path, query }) => {
          if (path === 'agentSessions/sessions')
            return {
              data: query?.archived === 'true' ? [old] : [recent],
              meta: {},
            };
          return { data: [], meta: {} };
        }),
      },
    );
  }

  it('names the archived list and keeps an unarchived session and its draft out of the main area until restored', async () => {
    await render('/agent-sessions/recent');
    const draft = await screen.findByRole('textbox', { name: 'Draft' });
    fireEvent.change(draft, { target: { value: 'Unsent reply' } });
    const list = screen.getByRole('region', { name: 'Sessions' });
    fireEvent.click(
      within(list).getByRole('button', { name: 'Archived', exact: true }),
    );
    expect(
      await within(list).findByRole('heading', { name: 'Archived' }),
    ).toBeVisible();
    await within(list).findByText('Old investigation');
    expect(screen.getByRole('main').querySelector('h2')?.textContent).toBe(
      'Archived',
    );
    expect(
      screen.getByText(
        'Choose an archived session to read it. Your open session and unsent draft are kept.',
      ),
    ).toBeVisible();
    expect(screen.queryByRole('textbox', { name: 'Draft' })).toBeNull();
    expect(screen.getByTestId('location')).toHaveTextContent(
      '/agent-sessions/recent',
    );

    fireEvent.click(within(list).getByText('Old investigation'));
    await screen.findByText('Viewing old');
    expect(
      screen.queryByText(
        'Choose an archived session to read it. Your open session and unsent draft are kept.',
      ),
    ).toBeNull();

    fireEvent.click(
      within(list).getByRole('button', { name: 'Archived', exact: true }),
    );
    expect(
      await within(list).findByRole('heading', { name: 'My agents' }),
    ).toBeVisible();
  });

  it('restores the open session with its unsent draft when leaving the archived list', async () => {
    await render('/agent-sessions/recent');
    const draft = await screen.findByRole('textbox', { name: 'Draft' });
    fireEvent.change(draft, { target: { value: 'Unsent reply' } });
    const list = screen.getByRole('region', { name: 'Sessions' });
    const archived = within(list).getByRole('button', {
      name: 'Archived',
      exact: true,
    });
    fireEvent.click(archived);
    await within(list).findByText('Old investigation');
    fireEvent.click(archived);
    expect(await screen.findByRole('textbox', { name: 'Draft' })).toHaveValue(
      'Unsent reply',
    );
  });
});

function SessionStub() {
  const location = useLocation();
  const id = location.pathname.split('/').pop();
  return (
    <div>
      <p>Viewing {id}</p>
      <textarea aria-label='Draft' />
    </div>
  );
}
