import { realtimeClientToken } from '@nocobase/app-client';
import {
  answerApi,
  renderWithApp,
  type ApiCall,
} from '@nocobase/app-testing/client';
import { QueryClient } from '@tanstack/react-query';
import {
  act,
  fireEvent,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useState } from 'react';

import {
  AgentSessionsPanel,
  type AgentSessionsPanelProps,
} from '../../client/panel.js';
import plugin from '../../client/plugin.js';
import { ApplicationCacheContext } from '../../client/query-cache.js';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '../../client/components/ui/dropdown-menu.js';
import type { Computer, Session } from '../../shared/api.js';

const session: Session = {
  id: 'session',
  computerId: 'computer',
  agentId: 'codex',
  cwd: '/work/app',
  title: 'Tidy the release notes',
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

const computer: Computer = {
  id: 'computer',
  name: 'Work laptop',
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

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      // A wide screen: what the panel decides, it decides by itself.
      matches: query.includes('min-width'),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe(): void {}
      disconnect(): void {}
    },
  );
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

async function setup(
  props: Partial<AgentSessionsPanelProps>,
  answer?: (call: ApiCall) => unknown,
) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const onViewChange = vi.fn();
  const requests = vi.fn((call: ApiCall): unknown => {
    const answered = answer?.(call);
    if (answered !== undefined) return answered;
    const { path, method, json } = call;
    if (path === 'agentSessions/sessions/session' && method === 'GET')
      return { data: session };
    if (path === 'agentSessions/sessions' && method === 'GET')
      return { data: [session], meta: {} };
    if (path === 'agentSessions/computers')
      return { data: [computer], meta: { total: 1 } };
    if (path === 'agentSessions/sessions/session/prompt')
      return {
        data: {
          seq: 1,
          type: 'user',
          payload: json,
          createdAt: '2026-10-13T00:00:01Z',
        },
      };
    return { data: [], meta: {} };
  });
  let update: (next: Partial<AgentSessionsPanelProps>) => void = () =>
    undefined;
  function ControlledPanel() {
    const [current, setCurrent] = useState(props);
    update = (next) => setCurrent((held) => ({ ...held, ...next }));
    return (
      <AgentSessionsPanel
        cli='acme'
        view={{ kind: 'session', sessionId: 'session' }}
        onViewChange={onViewChange}
        {...current}
      />
    );
  }
  await renderWithApp(
    <ApplicationCacheContext.Provider value={client}>
      <ControlledPanel />
    </ApplicationCacheContext.Provider>,
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
      fetch: answerApi(requests),
      route: '/my-issues/7',
    },
  );
  return {
    client,
    requests,
    onViewChange,
    update: (next: Partial<AgentSessionsPanelProps>) => act(() => update(next)),
  };
}

describe('the sessions panel', () => {
  const auto = (id: string, scope = 'page') => ({
    id,
    scope,
    mode: 'replace' as const,
    projectId: id,
    attachments: [
      { id, label: `Task ${id}`, reference: { kind: 'issue', refId: id } },
    ],
  });

  it('uses the host hint without prefilling text and clears text only for a deliberate new scope', async () => {
    const { update, requests } = await setup({
      view: { kind: 'new' },
      attach: { ...auto('a'), placeholder: 'Describe the task' },
    });
    const box = await screen.findByPlaceholderText('Describe the task');
    expect(box).toHaveValue('');
    fireEvent.change(box, { target: { value: 'Unsent request' } });
    update({ attach: { ...auto('b'), placeholder: 'Describe the task' } });
    await screen.findByText('Task b');
    expect(box).toHaveValue('Unsent request');
    update({
      attach: { ...auto('c', 'new-intent'), placeholder: 'Describe the task' },
    });
    await screen.findByText('Task c');
    expect(box).toHaveValue('');
    expect(
      requests.mock.calls.some(
        ([call]) =>
          call.method === 'POST' && call.path === 'agentSessions/sessions',
      ),
    ).toBe(false);
  });

  it('replaces automatic context, keeps manual attachments, and updates the project of a mounted new draft', async () => {
    const { client, update, requests } = await setup(
      { view: { kind: 'new' }, attach: auto('a') },
      ({ path, method }) => {
        if (path === 'agentSessions/projects')
          return {
            data: [
              { id: 'a', name: 'Project A' },
              { id: 'b', name: 'Project B' },
            ],
          };
        if (path.endsWith('/discoverChoices'))
          return { data: { status: 'available', choices: [] } };
        if (path === 'agentSessions/sessions' && method === 'POST')
          return { data: session };
        return undefined;
      },
    );
    await screen.findByText('Task a');
    client.setQueryData(
      ['agentSessions', 'memory', 'attached:new-session'],
      (held: object[] = []) => [
        ...held,
        { id: 'manual', label: 'My note', text: 'Keep my note' },
      ],
    );
    update({ attach: auto('b') });
    await screen.findByText('Task b');
    expect(screen.queryByText('Task a')).toBeNull();
    expect(screen.getByText('My note')).toBeTruthy();
    await screen.findByText('Project B');
    const box = await screen.findByRole('textbox');
    fireEvent.change(box, { target: { value: 'Start here' } });
    fireEvent.keyDown(box, { key: 'Enter' });
    await waitFor(() =>
      expect(requests).toHaveBeenCalledWith(
        expect.objectContaining({
          path: 'agentSessions/sessions',
          method: 'POST',
          json: expect.objectContaining({
            projectId: 'b',
            mentions: [{ kind: 'issue', refId: 'b' }],
          }),
        }),
      ),
    );
    update({ attach: auto('c') });
    await waitFor(() => expect(screen.queryByText('Task c')).toBeNull());
  });

  it('stops following after removal, including remounts, and resumes only for another explicit intent', async () => {
    const { update } = await setup({
      view: { kind: 'new' },
      attach: auto('a'),
    });
    fireEvent.click(
      await screen.findByRole('button', { name: 'Remove Task a' }),
    );
    update({ attach: auto('b') });
    await waitFor(() => expect(screen.queryByText('Task a')).toBeNull());
    expect(screen.queryByText('Task b')).toBeNull();
    update({ view: { kind: 'list' } });
    await screen.findByText(session.title);
    update({ view: { kind: 'new' } });
    await screen.findByRole('textbox');
    expect(screen.queryByText('Task b')).toBeNull();
    update({ attach: auto('b', 'another-start') });
    await screen.findByText('Task b');
  });

  it('never deposits pending automatic context into a session selected from history', async () => {
    const { update } = await setup({
      view: { kind: 'list' },
      attach: auto('a'),
    });
    await screen.findByText(session.title);
    update({ view: { kind: 'session', sessionId: 'session' } });
    await screen.findByRole('textbox');
    expect(screen.queryByText('Task a')).toBeNull();
  });

  it('keeps details inside the sidebar and marks the main page task as current', async () => {
    const { update } = await setup(
      { activeLink: { kind: 'issue', refId: '7' } },
      ({ path, method }) =>
        path === 'agentSessions/sessions/session' && method === 'GET'
          ? {
              data: {
                ...session,
                links: [
                  {
                    kind: 'issue',
                    refId: '7',
                    key: 'PM-7',
                    title: 'Fix sign-in',
                    group: null,
                    status: null,
                    href: '/issues/7',
                    startable: false,
                    decidedAt: null,
                  },
                ],
              },
            }
          : undefined,
    );
    fireEvent.click(await screen.findByRole('button', { name: /Tasks 1/ }));
    const details = await screen.findByRole('complementary', {
      name: 'Session details',
    });
    expect(details.classList.contains('fixed')).toBe(false);
    expect(details.parentElement?.querySelector('.bg-black\\/30')).toBeNull();
    expect(within(details).getByText('PM-7').closest('li')).toHaveAttribute(
      'aria-current',
      'true',
    );
    update({ activeLink: null });
    await waitFor(() =>
      expect(
        within(details).getByText('PM-7').closest('li'),
      ).not.toHaveAttribute('aria-current'),
    );
    expect(details).toBeVisible();
  });
  it('shows a session with the panel’s buttons in its header, and no way back to the page’s list', async () => {
    const onFullScreen = vi.fn();
    const { onViewChange } = await setup({
      onFullScreen,
      actions: <button type='button'>Close panel</button>,
    });
    const heading = await screen.findByRole('heading', {
      name: session.title,
    });
    const header = heading.closest('header') ?? heading.parentElement!;
    expect(screen.queryByRole('link', { name: 'Back to sessions' })).toBeNull();
    expect(
      within(header).getByRole('button', { name: 'Close panel' }),
    ).toBeTruthy();
    fireEvent.click(within(header).getByRole('button', { name: 'Sessions' }));
    expect(onViewChange).toHaveBeenLastCalledWith({ kind: 'list' });
    fireEvent.click(
      within(header).getByRole('button', { name: 'New session' }),
    );
    expect(onViewChange).toHaveBeenLastCalledWith({ kind: 'new' });
    fireEvent.click(
      within(header).getByRole('button', { name: 'Open full page' }),
    );
    expect(onFullScreen).toHaveBeenCalledWith('/agent-sessions/session');
  });

  it('puts what the host attached in the draft once, and sends it with the message', async () => {
    const attach = {
      id: 'issue:7',
      attachments: [
        {
          id: 'issue:7',
          label: 'PM-7 Fix the sign-in loop',
          reference: { kind: 'issue', refId: '7' },
        },
        {
          id: 'page',
          label: 'Release notes',
          text: 'The person is looking at the release notes page.',
        },
      ],
    };
    const { requests, client } = await setup({ attach });
    await screen.findByRole('heading', { name: session.title });
    const attached = await screen.findByRole('list', {
      name: 'Goes with the message',
    });
    expect(within(attached).getAllByRole('listitem')).toHaveLength(2);
    fireEvent.click(
      within(attached).getByRole('button', { name: 'Remove Release notes' }),
    );
    await waitFor(() =>
      expect(within(attached).getAllByRole('listitem')).toHaveLength(1),
    );
    // Applied once: the same attachment again does not come back.
    expect(
      client.getQueryData(['agentSessions', 'memory', 'panel:attach']),
    ).toBe('issue:7');

    const box = screen.getByRole('textbox');
    fireEvent.change(box, { target: { value: 'Why does this loop?' } });
    fireEvent.keyDown(box, { key: 'Enter' });
    await waitFor(() =>
      expect(requests).toHaveBeenCalledWith(
        expect.objectContaining({
          path: 'agentSessions/sessions/session/prompt',
          json: expect.objectContaining({
            content: [{ type: 'text', text: 'Why does this loop?' }],
            mentions: [{ kind: 'issue', refId: '7' }],
          }),
        }),
      ),
    );
    await waitFor(() =>
      expect(
        screen.queryByRole('list', { name: 'Goes with the message' }),
      ).toBeNull(),
    );
  });

  it('sends what cannot be mentioned as text along with the message', async () => {
    const { requests } = await setup({
      attach: {
        id: 'page',
        attachments: [
          { id: 'page', label: 'Release notes', text: 'On the release notes.' },
        ],
      },
    });
    await screen.findByRole('list', { name: 'Goes with the message' });
    const box = screen.getByRole('textbox');
    fireEvent.change(box, { target: { value: 'Summarize this' } });
    fireEvent.keyDown(box, { key: 'Enter' });
    await waitFor(() =>
      expect(requests).toHaveBeenCalledWith(
        expect.objectContaining({
          path: 'agentSessions/sessions/session/prompt',
          json: expect.objectContaining({
            content: [
              { type: 'text', text: 'Summarize this' },
              { type: 'text', text: 'On the release notes.' },
            ],
            mentions: [],
          }),
        }),
      ),
    );
  });

  it('opens a session picked in the list in the panel', async () => {
    const { onViewChange } = await setup({ view: { kind: 'list' } });
    fireEvent.click(await screen.findByText(session.title));
    expect(onViewChange).toHaveBeenCalledWith({
      kind: 'session',
      sessionId: 'session',
    });
    expect(screen.queryByRole('link', { name: 'New session' })).toBeNull();
  });

  it('shows a new session in the panel once its first message created it', async () => {
    const { onViewChange } = await setup(
      { view: { kind: 'new' } },
      ({ path, method }) => {
        if (path.endsWith('/discoverChoices'))
          return { data: { status: 'available', choices: [] } };
        if (path === 'agentSessions/projects') return { data: [] };
        if (path === 'agentSessions/sessions' && method === 'POST')
          return { data: { ...session, id: 'created' } };
        return undefined;
      },
    );
    const box = await screen.findByRole('textbox');
    expect(
      screen.queryByRole('complementary', { name: 'This computer' }),
    ).toBeNull();
    await waitFor(() => expect(box).not.toBeDisabled());
    fireEvent.change(box, { target: { value: 'Start here' } });
    fireEvent.keyDown(box, { key: 'Enter' });
    await waitFor(() =>
      expect(onViewChange).toHaveBeenCalledWith({
        kind: 'session',
        sessionId: 'created',
      }),
    );
  });
});

it('lets a host replace controls across panel views while retaining session commands', async () => {
  const { update, requests } = await setup({
    renderHeaderActions: (items) => (
      <DropdownMenu>
        <DropdownMenuTrigger render={<button type='button' />}>
          Host controls
        </DropdownMenuTrigger>
        <DropdownMenuContent>{items}</DropdownMenuContent>
      </DropdownMenu>
    ),
  });
  const title = await screen.findByRole('heading', { name: session.title });
  expect(
    within(title).getByRole('button', { name: session.title }),
  ).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: 'Host controls' }));
  fireEvent.click(await screen.findByRole('menuitem', { name: 'Rename' }));
  const rename = await screen.findByRole('textbox', { name: 'Rename' });
  fireEvent.change(rename, { target: { value: 'Host toolbar conversation' } });
  fireEvent.keyDown(rename, { key: 'Enter' });
  await waitFor(() =>
    expect(requests).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'agentSessions/sessions/session',
        method: 'PATCH',
        json: { title: 'Host toolbar conversation' },
      }),
    ),
  );
  update({ view: { kind: 'new' } });
  expect(
    await screen.findByRole('button', { name: 'Host controls' }),
  ).toBeVisible();
  update({ view: { kind: 'list' } });
  expect(
    await screen.findByRole('button', { name: 'Host controls' }),
  ).toBeVisible();
});

it('adds side history without remounting the draft, keeps its context and selects sessions in place', async () => {
  const { update, onViewChange } = await setup({
    view: { kind: 'new' },
    attach: {
      id: 'note',
      attachments: [
        { id: 'note', label: 'Keep this context', text: 'Context details' },
      ],
    },
    renderHeaderActions: () => <button>Host controls</button>,
  });
  const box = await screen.findByRole('textbox');
  fireEvent.change(box, { target: { value: 'Unsent draft' } });
  update({ showHistory: true });
  const history = await screen.findByRole('region', { name: 'Sessions' });
  expect(screen.getByDisplayValue('Unsent draft')).toBe(box);
  expect(box).toHaveValue('Unsent draft');
  expect(screen.getByText('Keep this context')).toBeVisible();
  fireEvent.click(within(history).getByText(session.title));
  expect(onViewChange).toHaveBeenLastCalledWith({
    kind: 'session',
    sessionId: 'session',
  });
  update({ showHistory: false });
  expect(screen.getByRole('textbox')).toBe(box);
  update({
    view: { kind: 'session', sessionId: 'session' },
    showHistory: true,
  });
  const title = await screen.findByRole('heading', { name: session.title });
  fireEvent.click(within(title).getByRole('button', { name: session.title }));
  expect(await screen.findByRole('menuitem', { name: 'Rename' })).toBeVisible();
  expect(screen.getByRole('menuitem', { name: 'Archive' })).toBeVisible();
  expect(screen.getByRole('menuitem', { name: 'Show details' })).toBeVisible();
});

it('uses the host mode title and new action above search and state filters, with a plain empty row', async () => {
  const { update } = await setup({
    view: { kind: 'new' },
    showHistory: true,
    title: 'My Agent',
    historyActions: <button>New conversation</button>,
    renderHeaderActions: () => <button>Host controls</button>,
  });
  const history = await screen.findByRole('region', { name: 'Sessions' });
  expect(
    within(history).getByRole('heading', { name: 'My Agent' }),
  ).toBeVisible();
  expect(
    within(history).getByRole('button', { name: 'New conversation' }),
  ).toBeVisible();
  expect(screen.queryByRole('heading', { name: 'New session' })).toBeNull();
  expect(within(history).queryByRole('combobox')).toBeNull();
  fireEvent.click(within(history).getByRole('button', { name: 'Needs me 0' }));
  expect(await within(history).findByText('No conversations')).toBeVisible();
  fireEvent.click(
    within(history).getByRole('button', { name: 'All', exact: true }),
  );
  fireEvent.change(
    within(history).getByRole('textbox', { name: 'Search sessions' }),
    { target: { value: 'not here' } },
  );
  expect(within(history).getByText('No conversations')).toBeVisible();
  fireEvent.click(
    within(history).getByRole('button', { name: 'Archived', exact: true }),
  );
  expect(
    within(history).getByRole('button', { name: 'Archived', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  fireEvent.click(
    within(history).getByRole('button', { name: 'Archived', exact: true }),
  );
  expect(
    within(history).getByRole('button', { name: 'My computers' }),
  ).toBeVisible();
  update({ showHistory: false });
  expect(screen.queryByRole('region', { name: 'Sessions' })).toBeNull();
  expect(screen.getByRole('heading', { name: 'My Agent' })).toBeVisible();
});
