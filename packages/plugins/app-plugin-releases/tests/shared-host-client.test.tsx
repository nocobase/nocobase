/**
 * The shared app host: the environments page shows each host once with its memory, counts and occupants, an occupant
 * the reader may not view hidden; an App's page says only why the host affects it, linking to that block for those who
 * may read environments.
 */
import { answerApi, renderWithApp } from '@nocobase/app-testing/client';
import { cleanup, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes, useLocation } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

import releases from '../client/plugin.js';
import { appStateOf } from '../client/lib/app-state.js';
import AppPage from '../client/pages/app-page.js';
import EnvironmentsPage from '../client/pages/environments-page.js';
import {
  allPermissions,
  ACCESS_NAMESPACE,
  type ReleasesPermissions,
} from '../shared/access.js';
import type {
  AppSummary,
  EnvironmentListItem,
  SharedHostView,
} from '../shared/releases.js';
import { hostNoticeOf } from '../client/lib/host-occupants.js';
import { appSummary } from './helpers/app-summary.js';

afterEach(cleanup);

// jsdom lays nothing out; the environments page scrolls the linked block into view.
const scrolled = vi.fn(function (this: Element) {
  return this.id;
});
Element.prototype.scrollIntoView = scrolled;
afterEach(() => scrolled.mockClear());

const MiB = 1024 ** 2;

/** A preview host with a resident Staging App in use, an idle PR preview, a hidden App and a PR waiting for memory. */
const HOST: SharedHostView = {
  id: 'in-process',
  environments: [
    { id: 'preview', name: 'Preview' },
    { id: 'staging', name: 'Staging' },
  ],
  memory: {
    heapUsed: 900 * MiB,
    heapLimit: 2048 * MiB,
    rss: 1536 * MiB,
    available: 3072 * MiB,
  },
  recycling: 'pending',
  deployed: 12,
  running: 3,
  occupants: [
    {
      app: {
        id: 'studio-staging',
        name: 'Studio staging',
        environmentId: 'staging',
        environmentName: 'Staging',
        previewOf: null,
      },
      state: 'running',
      holds: ['requests', 'resident', 'busy'],
      waiting: null,
      lastAccessedAt: null,
      error: null,
    },
    {
      app: null,
      state: 'running',
      holds: ['recent'],
      waiting: null,
      lastAccessedAt: null,
      error: null,
    },
    {
      app: {
        id: 'pr-433',
        name: 'PR #433',
        environmentId: 'preview',
        environmentName: 'Preview',
        previewOf: 'studio',
      },
      state: 'stopped',
      holds: [],
      waiting: 'memory',
      lastAccessedAt: null,
      error: null,
    },
    {
      app: {
        id: 'pr-430',
        name: 'PR #430',
        environmentId: 'preview',
        environmentName: 'Preview',
        previewOf: 'studio',
      },
      state: 'running',
      holds: [],
      waiting: null,
      lastAccessedAt: null,
      error: null,
    },
  ],
  failedEnvironments: [
    { id: 'demo', name: 'Demo', error: 'The release archive is missing.' },
  ],
};

const ENVIRONMENT: EnvironmentListItem = {
  id: 'staging',
  name: 'Staging',
  driver: 'host',
  purpose: 'test',
  config: {},
  hasSecret: false,
  secretKeys: [],
  publicUrl: null,
  protected: false,
  approvers: [],
  maxApps: null,
  defaultIdleStopMinutes: null,
  defaultDormantAfterHours: null,
  appCount: 2,
} as unknown as EnvironmentListItem;

/** Where the page is, so a test sees where a link went. */
function Location() {
  const location = useLocation();
  return (
    <output data-testid='location'>{location.pathname + location.hash}</output>
  );
}

async function render(
  route: string,
  {
    summary = appSummary('running'),
    hosts = [HOST],
    permissions = allPermissions(),
    locale = 'en-US',
  }: {
    readonly summary?: AppSummary;
    readonly hosts?: readonly SharedHostView[];
    readonly permissions?: ReleasesPermissions;
    readonly locale?: string;
  } = {},
) {
  const calls: string[] = [];
  await renderWithApp(
    <>
      <Routes>
        <Route path='/apps/:appId' element={<AppPage />} />
        <Route path='/release-environments' element={<EnvironmentsPage />} />
      </Routes>
      <Location />
    </>,
    {
      plugins: [releases({ routes: false })],
      namespace: ACCESS_NAMESPACE,
      locale,
      route,
      fetch: answerApi((call) => {
        calls.push(call.path);
        if (call.path === 'releases/me')
          return { data: { userId: 'user', kind: 'human', permissions } };
        if (call.path === 'releases/hosts')
          return { data: hosts, meta: { total: hosts.length } };
        if (call.path === 'releases/environments')
          return { data: [ENVIRONMENT], meta: { total: 1 } };
        if (/releases\/apps\/[^/]+$/.test(call.path)) return { data: summary };
        if (call.path.endsWith('/initialAdmin'))
          return new Response(null, { status: 404 });
        return { data: [], meta: { total: 0 } };
      }),
    },
  );
  return calls;
}

/** An App on the shared host: its own runtime, and the host as the single-App read answers it. */
function onHost(
  state: AppSummary['runtime']['state'],
  {
    waiting = null,
    recycling = null,
    unrestored = false,
    error = null,
  }: {
    readonly waiting?: 'capacity' | 'memory' | 'recycle' | null;
    readonly recycling?: 'pending' | 'restarting' | null;
    /** The host could not restore this App's environment after it restarted. */
    readonly unrestored?: boolean;
    readonly error?: string | null;
  } = {},
): AppSummary {
  const summary = appSummary(state);
  const { environments: _environments, ...host } = HOST;
  return {
    ...summary,
    runtime: { ...summary.runtime, waiting, error },
    host: {
      ...host,
      recycling,
      failedEnvironments: unrestored
        ? [
            ...host.failedEnvironments,
            {
              id: summary.environment.id,
              name: summary.environment.name,
              error: null,
            },
          ]
        : host.failedEnvironments,
    },
  };
}

describe('shared app host', () => {
  it('maps a refused start to what it waits for, ahead of the stopped on-demand state', () => {
    const base = appSummary('stopped');
    const waiting = (reason: 'capacity' | 'memory' | 'recycle') =>
      appStateOf({ ...base, runtime: { ...base.runtime, waiting: reason } });
    expect(appStateOf(base)).toBe('stoppedOnDemand');
    expect(waiting('capacity')).toBe('waitingCapacity');
    expect(waiting('memory')).toBe('waitingMemory');
    expect(waiting('recycle')).toBe('waitingRecycle');
    // A start in progress or a running App shows that instead, and a deployment comes first.
    expect(
      appStateOf({
        ...base,
        runtime: { ...base.runtime, state: 'starting', waiting: 'memory' },
      }),
    ).toBe('starting');
    expect(
      appStateOf({
        ...base,
        hasPendingDeployment: true,
        runtime: { ...base.runtime, waiting: 'memory' },
      }),
    ).toBe('deploying');
  });

  it('blames the host for a failed start only when the host could not restore the App', () => {
    expect(
      hostNoticeOf(
        onHost('failed', {
          error: 'App failed to initialize: database password is invalid',
        }),
      ),
    ).toBeNull();
    expect(hostNoticeOf(onHost('failed', { unrestored: true }))).toBe(
      'ui.sharedHost.failed',
    );
    // Another environment's restore failure is not this App's.
    expect(HOST.failedEnvironments.map((item) => item.id)).not.toContain(
      appSummary('failed').environment.id,
    );
    expect(hostNoticeOf(onHost('stopped', { waiting: 'memory' }))).toBe(
      'ui.sharedHost.waiting.memory',
    );
    expect(hostNoticeOf(appSummary('failed'))).toBeNull();
  });

  it('lists every occupant of the host on the environments page once, with why it holds or waits and the process memory as one total', async () => {
    await render('/release-environments');
    const section = (
      await screen.findByRole('heading', { name: /Shared app host/ })
    ).closest('section')!;
    // One block for the host however many environments share it.
    expect(
      screen.getAllByRole('heading', { name: /Shared app host/ }),
    ).toHaveLength(1);
    expect(section.id).toBe('shared-host-in-process');
    const scoped = within(section as HTMLElement);
    expect(
      scoped.getByText('Environments on it: Preview, Staging'),
    ).toBeTruthy();
    expect(
      scoped.getByText('3 of 12 deployed apps running or starting'),
    ).toBeTruthy();
    expect(
      scoped.getByText(
        /Heap 900\.0 MiB of 2048\.0 MiB · process memory 1536\.0 MiB · 3072\.0 MiB available/,
      ),
    ).toBeTruthy();
    expect(
      scoped.getByText('Totals of the whole process, not of any one app.'),
    ).toBeTruthy();
    expect(scoped.getByText(/Old code is freed by restarting/)).toBeTruthy();
    expect(
      scoped.getByText(
        'Demo: its apps could not be restored; retrying in the background.',
      ),
    ).toBeTruthy();
    expect(scoped.getByText('The release archive is missing.')).toBeTruthy();

    const row = (name: string) =>
      within(scoped.getByText(name).closest('tr') as HTMLElement);
    expect(row('Studio staging').getByText('Staging')).toBeTruthy();
    expect(
      row('Studio staging').getByText('Serving requests · Always running'),
    ).toBeTruthy();
    expect(row('PR #433').getByText('Waiting for memory')).toBeTruthy();
    expect(
      row('PR #433').getByText('Start refused: not enough memory'),
    ).toBeTruthy();
    expect(
      row('PR #430').getByText('Idle; stopped first when room is needed'),
    ).toBeTruthy();
    // No per-App memory: the process total is never divided among its Apps.
    expect(scoped.queryByText(/MiB/, { selector: 'td *' })).toBeNull();
  });

  it('shows an app the reader may not view as hidden, with its state only', async () => {
    await render('/release-environments');
    const section = (
      await screen.findByRole('heading', { name: /Shared app host/ })
    ).closest('section') as HTMLElement;
    const hidden = within(
      within(section)
        .getByText('An app you cannot view')
        .closest('tr') as HTMLElement,
    );
    expect(hidden.getByText('Running')).toBeTruthy();
    expect(hidden.getByText('Used in the last minute')).toBeTruthy();
    // No name, environment or last access of it.
    expect(hidden.getAllByText('—')).toHaveLength(1);
  });

  it('leaves the block out of the environments page when no environment shares a host', async () => {
    await render('/release-environments', { hosts: [] });
    await screen.findByText('Staging');
    expect(screen.queryByText('Shared app host')).toBeNull();
  });

  it('says nothing of the host on the page of an App it does not affect', async () => {
    for (const summary of [
      onHost('running'),
      onHost('stopped'),
      // The App's own failure, on a healthy host: its error says why, not the host.
      onHost('failed', {
        error: 'App failed to initialize: database password is invalid',
      }),
    ]) {
      await render('/apps/shop', { summary });
      await screen.findByRole('tab', { name: 'Overview' });
      expect(screen.queryByText('Shared app host')).toBeNull();
      expect(screen.queryByText('View host usage')).toBeNull();
      expect(screen.queryByText(/deployed apps running/)).toBeNull();
      cleanup();
    }
    // Nor on an App whose driver shares no host.
    await render('/apps/shop', { summary: appSummary('failed') });
    await screen.findByRole('tab', { name: 'Overview' });
    expect(screen.queryByText('View host usage')).toBeNull();
  });

  it('says in one line why the host affects an App, linking to its block on the environments page', async () => {
    const cases: [AppSummary, string][] = [
      [
        onHost('stopped', { waiting: 'capacity' }),
        'Start refused: the active app limit or start queue is full',
      ],
      [
        onHost('stopped', { waiting: 'memory' }),
        'Start refused: not enough memory',
      ],
      [
        onHost('failed', { unrestored: true }),
        'The app could not be restored after its shared host restarted; retrying in the background.',
      ],
      [
        onHost('running', { recycling: 'restarting' }),
        'This host is restarting. Its apps answer “try again shortly” until they are back.',
      ],
      [
        onHost('running', { recycling: 'pending' }),
        /Old code is freed by restarting/ as unknown as string,
      ],
    ];
    for (const [summary, reason] of cases) {
      await render('/apps/shop', { summary });
      const notice = await waitFor(() => {
        const element = document.querySelector(
          '[data-slot="shared-host-notice"]',
        );
        expect(element).toBeTruthy();
        return element as HTMLElement;
      });
      expect(within(notice).getByText(reason)).toBeTruthy();
      // Only the line: the host's counts and occupants stay on the environments page.
      expect(screen.queryByText('Shared app host')).toBeNull();
      expect(screen.queryByText(/deployed apps running/)).toBeNull();
      cleanup();
    }
    const calls = await render('/apps/shop', {
      summary: onHost('stopped', { waiting: 'memory' }),
    });
    await userEvent.click(
      await screen.findByRole('link', { name: 'View host usage' }),
    );
    expect(
      await screen.findByRole('heading', { name: /Shared app host/ }),
    ).toBeTruthy();
    expect(screen.getByTestId('location').textContent).toBe(
      '/release-environments#shared-host-in-process',
    );
    expect(calls).toContain('releases/hosts');
    expect(scrolled.mock.results.map((result) => result.value)).toEqual([
      'shared-host-in-process',
    ]);
  });

  it('gives the reason without the link to someone who may not read environments', async () => {
    const permissions = allPermissions();
    await render('/apps/shop', {
      summary: onHost('stopped', { waiting: 'memory' }),
      permissions: {
        ...permissions,
        settings: {
          ...permissions.settings,
          'rel.environments/read': false,
          'rel.environments/manage': false,
        },
      },
    });
    expect(
      await screen.findByText('Start refused: not enough memory'),
    ).toBeTruthy();
    expect(screen.queryByRole('link', { name: 'View host usage' })).toBeNull();
  });

  it('words the host in Chinese', async () => {
    await render('/release-environments', {
      hosts: [{ ...HOST, recycling: 'restarting' }],
      locale: 'zh-CN',
    });
    expect(await screen.findByText('共享应用宿主')).toBeTruthy();
    expect(screen.getByText('使用它的环境：Preview, Staging')).toBeTruthy();
    expect(screen.getByText('已部署 12 个应用，3 个运行或启动中')).toBeTruthy();
    expect(
      screen.getByText('这个宿主正在重启，恢复前它的应用会提示“稍后重试”。'),
    ).toBeTruthy();
    expect(screen.getByText('启动被拒：内存不足')).toBeTruthy();
    expect(screen.getByText('Demo：应用恢复失败，后台重试中。')).toBeTruthy();
    cleanup();
    await render('/apps/shop', {
      summary: onHost('stopped', { waiting: 'memory' }),
      locale: 'zh-CN',
    });
    expect(await screen.findByText('启动被拒：内存不足')).toBeTruthy();
    expect(screen.getByRole('link', { name: '查看宿主占用' })).toBeTruthy();
  });
});
