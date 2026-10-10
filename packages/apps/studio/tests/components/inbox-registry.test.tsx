/**
 * The inbox registry: an item whose source nobody renders reads safely as sent, and a contributor's entry words,
 * renders and acts on its own items (release management's deployment requests among them).
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { useTranslation } from '@nocobase/i18n/client';
import { FlaskConicalIcon } from 'lucide-react';
import { useMemo, type ReactElement } from 'react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import type { InboxItem } from '@nocobase/app-plugin-notification-in-app/client/inbox';

import { InboxDetail } from '@/extensions/nocobase-inbox/inbox-detail';
import { InboxList } from '@/extensions/nocobase-inbox/inbox-list';
import { entriesOf, groupEntries } from '@/extensions/nocobase-inbox/model';
import {
  defaultInboxCategories,
  defineInboxRenderer,
  linkOf,
  type InboxRegistry,
} from '@/extensions/nocobase-inbox/registry';
import { InboxRegistryProvider } from '@/extensions/nocobase-inbox/registry-scope';

import { runnersRenderer } from '../../client/inbox/contributions/runners';
import { failedRunRenderer } from '../../client/inbox/contributions/failed-runs';
import { releasesRenderer } from '../../client/inbox/contributions/releases';
import { runRequestsRenderer } from '../../client/inbox/contributions/run-requests';
import type { InboxNotice } from '../../shared/inbox';

const request = vi.fn();
const pm = vi.hoisted(() => ({
  viewer: { userId: 'owner', permissions: { scopes: {} } } as {
    userId: string;
    permissions: { scopes: Record<string, string> };
  },
  issue: vi.fn(),
}));

vi.mock('@nocobase/app-client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@nocobase/app-client')>()),
  useApiClient: () => ({ request }),
}));

vi.mock('@/extensions/nocobase-plan-card/plan-card', () => ({
  PlanCard: () => null,
}));

vi.mock('@nocobase/app-plugin-projects/client/kit', () => ({
  PmEmpty: ({ title }: { title: string }) => <p>{title}</p>,
  PmLoadError: ({ title }: { title: string }) => <p>{title}</p>,
  PmTag: ({ children }: { children: ReactElement }) => <span>{children}</span>,
  usePageContextSource: () => undefined,
  PmStatusBadge: ({ statusKey }: { statusKey: string }) => (
    <span>{statusKey}</span>
  ),
  PmActorAvatar: ({ name }: { name: string }) => <span>{name}</span>,
  pmKeys: {
    issue: (id: string) => ['pm', 'issue', id],
    issues: ['pm', 'issues'],
    members: ['pm', 'members'],
  },
  usePmApi: () => ({ issue: pm.issue, members: () => Promise.resolve([]) }),
  useViewer: () => pm.viewer,
}));

// Keys stand for their text, so a test can tell which text was chosen.
vi.mock('@nocobase/i18n/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@nocobase/i18n/client')>();
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string) => key,
      i18n: { language: 'en-US' },
    }),
  };
});

// The chime preference lives on the server with the person (`inbox/chime.ts`); here it is simply on.
vi.mock('@nocobase/app-plugin-users/client/preferences', () => ({
  useUserPreference: (_key: string, options: { defaultValue: unknown }) => [
    options.defaultValue,
    () => undefined,
    { loaded: true, stored: false },
  ],
}));
vi.mock('../../client/access/notify', () => ({
  useNotify: () => ({ success: vi.fn(), error: vi.fn() }),
}));

function item(id: string, overrides: Partial<InboxItem> = {}): InboxItem {
  return {
    id,
    deliveryId: `d-${id}`,
    notificationId: `n-${id}`,
    title: `Title ${id}`,
    body: `Body ${id}`,
    createdAt: '2026-10-01T08:00:00.000Z',
    ...overrides,
  };
}

function notice(id: string, overrides: Partial<InboxNotice>): InboxNotice {
  return {
    notificationId: `n-${id}`,
    source: 'mystery',
    kind: 'decision',
    type: 'something_happened',
    subject: null,
    decisionKey: 'k1',
    data: null,
    count: 1,
    resolvedAt: null,
    outcome: null,
    ...overrides,
  };
}

const signOff = vi.fn();

/** A contributor's entry: QA sign-offs, worded from their data, with one action. */
const qaRenderer = defineInboxRenderer<{ readonly build: string }>({
  source: 'qa',
  icon: () => FlaskConicalIcon,
  useWording() {
    const { t } = useTranslation();
    return {
      label: (_entry, where) =>
        where === 'detail' ? t('QA sign-off waiting') : t('QA sign-off'),
      text: (entry, model) => ({
        title: `Sign off ${String(entry.notice?.data?.build)}`,
        sentence: model ? `Loaded ${model.build}` : null,
      }),
      outcome: (outcome) => `QA ${outcome}`,
    };
  },
  useModel(entry) {
    const build = String(entry.notice?.data?.build);
    return useMemo(() => ({ build }), [build]);
  },
  // eslint-disable-next-line @eslint-react/no-unnecessary-use-prefix
  useCanAct: (entry) =>
    entry.notice?.resolvedAt ? { state: 'none' } : { state: 'yes' },
  Actions: ({ entry, onDecided }) => (
    <button
      type='button'
      onClick={() => {
        signOff(entry.notice?.decisionKey);
        onDecided();
      }}
    >
      Sign off
    </button>
  ),
  Body: ({ model }) => <p>{`Build ${model.build} passed every check`}</p>,
});

const registry = (renderers: InboxRegistry['renderers']): InboxRegistry => ({
  renderers,
  feeds: [],
});

function renderDetail(
  entry: ReturnType<typeof entriesOf>[number],
  given: InboxRegistry,
  onAction = vi.fn(),
) {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>
        <InboxRegistryProvider registry={given}>
          <InboxDetail
            entry={entry}
            busy={false}
            onBack={vi.fn()}
            onAction={onAction}
            onOpen={vi.fn()}
          />
        </InboxRegistryProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return onAction;
}

describe('an item nobody renders', () => {
  const entries = entriesOf(
    [item('a', { body: 'Something needs you' })],
    [
      notice('a', {
        subject: { type: 'thing', id: 't1', label: null },
        // Whatever the sender put there is never read by the fallback.
        data: { nested: { deep: [1, { x: null }] }, title: 42 },
      }),
    ],
  );

  it('is listed with its title and body as sent', () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <InboxRegistryProvider registry={registry([qaRenderer])}>
            <InboxList
              filter={{ view: 'all', kind: 'all' }}
              unread={1}
              groups={groupEntries(entries, defaultInboxCategories)}
              loaded
              query={{
                isError: false,
                error: null,
                hasNextPage: false,
                isFetchingNextPage: false,
                refetch: vi.fn(),
                fetchNextPage: vi.fn(),
              }}
              pending={1}
              selectedId={null}
              busy={false}
              onFilter={vi.fn()}
              onSelect={vi.fn()}
              onOpen={vi.fn()}
              onAction={vi.fn()}
            />
          </InboxRegistryProvider>
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(screen.getByText('Title a')).toBeInTheDocument();
    expect(screen.getByText('Something needs you')).toBeInTheDocument();
    expect(screen.getAllByText('inbox.tabs.decision').length).toBeGreaterThan(
      0,
    );
  });

  it('shows its title in the detail pane and offers nothing to decide', () => {
    renderDetail(entries[0], registry([qaRenderer]));
    expect(
      screen.getByRole('heading', { name: 'Title a' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Something needs you')).toBeInTheDocument();
    // Only the inbox's own read and delete.
    expect(
      screen.getAllByRole('button').map((button) => button.ariaLabel),
    ).toEqual(['inbox.back', 'inbox.actions.read', 'inbox.actions.delete']);
  });
});

describe("the agents plugin's runner notices", () => {
  it('tells a runtime owner it needs an upgrade, with the runner Studio serves', () => {
    const [entry] = entriesOf(
      [item('a', { title: 'laptop needs an upgrade', body: '' })],
      [
        notice('a', {
          source: 'runners',
          kind: 'info',
          type: 'runner_upgrade_required',
          decisionKey: null,
          subject: { type: 'runner', id: 'r1', label: 'laptop' },
          data: {
            runnerName: 'laptop',
            runnerVersion: '0.0.9',
            protocolVersion: 2,
            minProtocolVersion: 3,
            maxProtocolVersion: 4,
            latestVersion: '0.2.0',
            subjectId: 'r1',
          },
        }),
      ],
    );
    renderDetail(entry, registry([runnersRenderer]));
    // Worded in its own namespace from its data, with nothing to decide.
    expect(
      screen.getByText('headings.runner_upgrade_required'),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'title' })).toBeInTheDocument();
    expect(screen.getByText('sentence latest')).toBeInTheDocument();
  });
});

describe('a contributed entry', () => {
  it('words, renders and decides its own items', () => {
    const [entry] = entriesOf(
      [item('a')],
      [notice('a', { source: 'qa', data: { build: '#88' } })],
    );
    const onAction = renderDetail(entry, registry([qaRenderer]));
    expect(screen.getByText('QA sign-off waiting')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Sign off #88' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Loaded #88')).toBeInTheDocument();
    expect(
      screen.getByText('Build #88 passed every check'),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Sign off' }));
    expect(signOff).toHaveBeenCalledWith('k1');
    // Deciding marks the item read.
    expect(onAction).toHaveBeenCalledWith(entry, 'read');
  });

  it('says how a settled decision ended, in its own words', () => {
    const [entry] = entriesOf(
      [item('a', { readAt: '2026-10-01T09:00:00.000Z' })],
      [
        notice('a', {
          source: 'qa',
          data: { build: '#88' },
          resolvedAt: '2026-10-01T09:00:00.000Z',
          outcome: 'passed',
        }),
      ],
    );
    renderDetail(entry, registry([qaRenderer]));
    expect(screen.getByText(/inbox\.resolved/u)).toHaveTextContent('QA passed');
    expect(
      screen.queryByRole('button', { name: 'Sign off' }),
    ).not.toBeInTheDocument();
  });
});

describe('release management’s deployment request', () => {
  it('renders the request from its data and decides it through its own API', async () => {
    request.mockResolvedValue({ data: { status: 'approved' } });
    const [entry] = entriesOf(
      [item('a', { title: 'Deployment request for crm', body: '' })],
      [
        notice('a', {
          source: 'releases',
          type: 'deployment_requested',
          subject: { type: 'app', id: 'app1', label: 'crm' },
          decisionKey: 'req1',
          data: {
            requestId: 'req1',
            kind: 'deploy',
            appId: 'app1',
            appName: 'crm',
            releaseVersion: 'v2.1.0',
            environmentName: 'production',
            requesterName: 'Carl',
            note: 'Hotfix',
            requestedAt: '2026-10-01T07:00:00.000Z',
          },
        }),
      ],
    );
    const onAction = renderDetail(entry, registry([releasesRenderer]));
    // Worded in its own namespace: the keys are its own.
    expect(
      screen.getByText('headings.deployment_requested'),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'title' })).toBeInTheDocument();
    expect(screen.getByText('Hotfix')).toBeInTheDocument();
    expect(screen.getByText('v2.1.0')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'approve' }));
    await waitFor(() =>
      expect(request).toHaveBeenCalledWith({
        method: 'POST',
        path: 'releases/deploymentRequests/req1/approve',
        json: {},
      }),
    );
    await waitFor(() => expect(onAction).toHaveBeenCalledWith(entry, 'read'));
  });
});

describe('where release management’s items open', () => {
  const entryOf = (
    type: string,
    target: string,
    data: Record<string, string> = {
      requestId: 'req 1',
      appId: 'app1',
      deploymentId: 'd1',
    },
  ) =>
    entriesOf(
      [item('a', { target: { type: 'route', path: target } })],
      [notice('a', { source: 'releases', type, data })],
    )[0]!;

  it('opens a request’s dialog over its App’s page, whatever path the card was sent with', () => {
    expect(
      linkOf(
        releasesRenderer,
        entryOf('deployment_requested', '/releases/requests/req%201'),
      ),
    ).toBe('/releases/app1/requests/req%201');
    expect(
      linkOf(
        releasesRenderer,
        entryOf('deployment_request_decided', '/releases/app1'),
      ),
    ).toBe('/releases/app1/requests/req%201');
  });

  it('falls back to the request’s dialog for a card without its App', () => {
    expect(
      linkOf(
        releasesRenderer,
        entryOf('deployment_requested', '/releases/requests/req%201', {
          requestId: 'req 1',
        }),
      ),
    ).toBe('/releases/requests/req%201');
  });

  it('opens the App for a failed deployment', () => {
    expect(
      linkOf(releasesRenderer, entryOf('deployment_failed', '/releases/app1')),
    ).toBe('/releases/app1');
  });
});

describe("a failed run's decision card", () => {
  const failed = () =>
    entriesOf(
      [item('f', { title: 'Coder could not finish PM-7', body: '' })],
      [
        notice('f', {
          source: 'projects',
          type: 'run_failed_final',
          subject: { type: 'issue', id: 'i7', label: 'PM-7' },
          decisionKey: 'agents:run-failed:r1',
          data: {
            identifier: 'PM-7',
            runId: 'r1',
            agentName: 'Coder',
            failureReason: 'toolAuth',
            attempts: '3',
          },
        }),
      ],
    )[0]!;
  const detail = (ownerUserId: string) => ({
    id: 'i7',
    identifier: 'PM-7',
    title: 'Fix login',
    statusKey: 'todo',
    statuses: [],
    ownerUserId,
    owner: { id: ownerUserId, name: 'Owner' },
    executor: { type: 'agent', id: 'a1' },
    activities: [],
    threads: [],
  });

  it("lets the issue's owner retry it through Studio's API", async () => {
    pm.viewer = { userId: 'owner', permissions: { scopes: {} } };
    pm.issue.mockResolvedValue(detail('owner'));
    request.mockResolvedValue({ outcome: 'retried', runId: 'r2' });
    const onAction = renderDetail(failed(), registry([failedRunRenderer]));
    fireEvent.click(
      await screen.findByRole('button', { name: 'inbox.runFailed.retry' }),
    );
    await waitFor(() =>
      expect(request).toHaveBeenCalledWith({
        method: 'POST',
        path: 'failedRuns/r1/decide',
        json: { action: 'retry' },
      }),
    );
    expect(
      screen.getByRole('button', { name: 'inbox.runFailed.reassign' }),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(onAction).toHaveBeenCalledWith(expect.anything(), 'read'),
    );
  });

  it('says why someone who neither owns nor may edit the issue cannot decide', async () => {
    pm.viewer = {
      userId: 'someone',
      permissions: { scopes: { 'pm.issues/edit': 'none' } },
    };
    pm.issue.mockResolvedValue(detail('owner'));
    renderDetail(failed(), registry([failedRunRenderer]));
    expect(
      await screen.findByText('inbox.runFailed.forbidden'),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'inbox.runFailed.retry' }),
    ).toBeNull();
  });
});

describe("a run request's decision card", () => {
  const TEXT = 'Please also cover the SSO path.\n\nAnd the **logout** page.';
  const asked = (overrides: Record<string, unknown> = {}) => ({
    id: 'req1',
    agentId: 'a1',
    agentName: 'Coder',
    subject: { kind: 'issue', id: 'i7' },
    threadScope: 'main',
    responsibleUserId: 'owner',
    responsibleName: 'Owner',
    requestedByUserId: 'bob',
    requestedByName: 'Bob',
    ownerUserId: 'owner',
    fireAt: null,
    maxAttempts: null,
    input: {
      type: 'comment',
      actor: { kind: 'user', id: 'bob', name: 'Bob' },
      text: TEXT,
      payload: { trigger: 'comment', commentId: 'c1' },
    },
    status: 'pending',
    settledById: null,
    settledAt: null,
    note: null,
    expiresAt: '2026-10-16T08:00:00.000Z',
    runId: null,
    supersededById: null,
    createdAt: '2026-10-09T08:00:00.000Z',
    updatedAt: '2026-10-09T08:00:00.000Z',
    ...overrides,
  });
  const card = (type = 'run_request') =>
    entriesOf(
      [item('r', { title: 'Bob asks Coder to work on PM-7', body: '' })],
      [
        notice('r', {
          source: 'runRequests',
          kind: type === 'run_request' ? 'decision' : 'info',
          type,
          subject: { type: 'issue', id: 'i7', label: 'PM-7' },
          decisionKey: type === 'run_request' ? 'req1' : null,
          data: {
            requestId: 'req1',
            agentName: 'Coder',
            requestedByName: 'Bob',
            identifier: 'PM-7',
            excerpt: 'Please also cover the SSO path.',
            reason: 'timeout',
          },
        }),
      ],
    )[0]!;
  const answer = (found: Record<string, unknown>) =>
    request.mockImplementation((call: { method?: string }) =>
      Promise.resolve(call.method === 'POST' ? undefined : { data: found }),
    );

  it('shows the owner what was asked in full, and confirms it through the agents plugin', async () => {
    pm.viewer = { userId: 'owner', permissions: { scopes: {} } };
    request.mockReset();
    answer(asked());
    const onAction = renderDetail(card(), registry([runRequestsRenderer]));
    expect(await screen.findByTestId('run-request-snapshot')).toHaveTextContent(
      'And the logout page.',
    );
    fireEvent.click(
      await screen.findByRole('button', { name: 'runRequests.confirm' }),
    );
    await waitFor(() =>
      expect(request).toHaveBeenCalledWith({
        method: 'POST',
        path: 'agents/runRequests/req1/confirm',
      }),
    );
    expect(
      screen.getByRole('button', { name: 'runRequests.reject' }),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(onAction).toHaveBeenCalledWith(expect.anything(), 'read'),
    );
  });

  it('offers nothing to decide to someone who does not own the issue', async () => {
    pm.viewer = { userId: 'bob', permissions: { scopes: {} } };
    request.mockReset();
    answer(asked());
    renderDetail(card(), registry([runRequestsRenderer]));
    expect(
      await screen.findByText('runRequests.onlyOwner'),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'runRequests.confirm' }),
    ).toBeNull();
  });

  it('lets the person who asked run an expired request as themselves', async () => {
    pm.viewer = { userId: 'bob', permissions: { scopes: {} } };
    request.mockReset();
    answer(asked({ status: 'expired' }));
    renderDetail(card('run_request_expired'), registry([runRequestsRenderer]));
    fireEvent.click(
      await screen.findByRole('button', { name: 'runRequests.asMe' }),
    );
    await waitFor(() =>
      expect(request).toHaveBeenCalledWith({
        method: 'POST',
        path: 'agents/runRequests/req1/runAsMe',
      }),
    );
  });
});

describe('the detail header, kind by kind', () => {
  const header = (): HTMLElement =>
    screen.getByTestId('nocobase-inbox-detail').querySelector('header')!;

  it('links a deployment request’s title to its dialog and puts its decision right under it', () => {
    const [entry] = entriesOf(
      [
        item('a', {
          title: 'Deployment request for crm',
          body: '',
          target: { type: 'route', path: '/releases/requests/req1' },
        }),
      ],
      [
        notice('a', {
          source: 'releases',
          type: 'deployment_requested',
          decisionKey: 'req1',
          data: { requestId: 'req1', appId: 'app1', appName: 'crm' },
        }),
      ],
    );
    renderDetail(entry, registry([releasesRenderer]));
    const title = screen.getByRole('heading', { level: 2, name: 'title' });
    expect(within(title).getByRole('link')).toHaveAttribute(
      'href',
      '/releases/app1/requests/req1',
    );
    // No separate open button: the title is the way there.
    expect(screen.queryByRole('button', { name: /open/iu })).toBeNull();
    const approve = within(header()).getByRole('button', { name: 'approve' });
    const reject = within(header()).getByRole('button', { name: 'reject' });
    // Real buttons: the main decision primary, the other outline.
    expect(approve.className).toContain('bg-primary');
    expect(reject.className).toContain('border-border');
    expect(reject.className).not.toContain('text-destructive');
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(1);
  });

  it("gives a failed run's card the same header: the title links to the issue, the decision under it", async () => {
    pm.viewer = { userId: 'owner', permissions: { scopes: {} } };
    pm.issue.mockResolvedValue({
      id: 'i7',
      identifier: 'PM-7',
      title: 'Fix login',
      statusKey: 'todo',
      statuses: [],
      ownerUserId: 'owner',
      owner: { id: 'owner', name: 'Owner' },
      executor: { type: 'agent', id: 'a1' },
      activities: [],
      threads: [],
    });
    const [entry] = entriesOf(
      [
        item('f', {
          title: 'Coder could not finish PM-7',
          body: '',
          target: { type: 'route', path: '/issues/PM-7' },
        }),
      ],
      [
        notice('f', {
          source: 'projects',
          type: 'run_failed_final',
          subject: { type: 'issue', id: 'i7', label: 'PM-7' },
          decisionKey: 'agents:run-failed:r1',
          data: { identifier: 'PM-7', runId: 'r1', agentName: 'Coder' },
        }),
      ],
    );
    renderDetail(entry, registry([failedRunRenderer]));
    const title = screen.getByRole('heading', { level: 2 });
    expect(within(title).getByRole('link')).toHaveAttribute(
      'href',
      '/issues/PM-7',
    );
    const retry = await within(header()).findByRole('button', {
      name: 'inbox.runFailed.retry',
    });
    expect(retry.className).toContain('bg-primary');
    expect(
      within(header()).getByRole('button', { name: 'inbox.runFailed.cancel' })
        .className,
    ).toContain('border-border');
  });
});
