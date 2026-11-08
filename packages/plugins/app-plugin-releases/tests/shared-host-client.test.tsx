/**
 * The shared app host: the environments page shows each host once as a capacity card (running against its limit, the
 * process memory as one total, its restart state) with its running Apps by environment, each linking to the
 * environment's Apps filtered to them; an environment's page shows each App's runtime state with why on hover or a
 * tap, and filters by state from the address; an App's page says only why the host affects it, linking to the card
 * for those who may read environments.
 */
import { answerApi, renderWithApp } from '@nocobase/app-testing/client';
import { cleanup, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes, useLocation } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

import releases from '../client/plugin.js';
import { appStateOf } from '../client/lib/app-state.js';
import AppPage from '../client/pages/app-page.js';
import EnvironmentPage from '../client/pages/environment-page.js';
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
import { hostNoticeOf } from '../client/lib/runtime-state.js';
import { appSummary } from './helpers/app-summary.js';

const NO_LIMIT_NOTE =
  /Totals of the whole host, every environment on it included/;

afterEach(cleanup);

// jsdom lays nothing out; the environments page scrolls the linked block into view.
const scrolled = vi.fn(function (this: Element) {
  return this.id;
});
Element.prototype.scrollIntoView = scrolled;
afterEach(() => scrolled.mockClear());

const MiB = 1024 ** 2;

/** A host Preview and Staging share: 3 of 6 Apps running (2 and 1), a restart pending and Demo not restored. */
const HOST: SharedHostView = {
  id: 'in-process',
  environments: [
    { id: 'preview', name: 'Preview', running: 2 },
    { id: 'staging', name: 'Staging', running: 1 },
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
  maxActive: 6,
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
    <output data-testid='location'>
      {location.pathname + location.search + location.hash}
    </output>
  );
}

async function render(
  route: string,
  {
    summary = appSummary('running'),
    hosts = [HOST],
    apps = [],
    permissions = allPermissions(),
    locale = 'en-US',
  }: {
    readonly summary?: AppSummary;
    readonly hosts?: readonly SharedHostView[];
    /** What an environment's Apps answer, whatever they ask. */
    readonly apps?: readonly AppSummary[];
    readonly permissions?: ReleasesPermissions;
    readonly locale?: string;
  } = {},
) {
  const calls: string[] = [];
  /** The Apps queries, as the server received them. */
  const listed: URLSearchParams[] = [];
  await renderWithApp(
    <>
      <Routes>
        <Route path='/apps/:appId' element={<AppPage />} />
        <Route path='/release-environments' element={<EnvironmentsPage />}>
          <Route path=':environmentId' element={<EnvironmentPage />} />
        </Route>
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
        if (call.path === 'releases/environments/staging')
          return { data: ENVIRONMENT };
        if (call.path === 'releases/apps') {
          const query = new URLSearchParams();
          for (const [name, value] of Object.entries(call.query ?? {}))
            for (const item of typeof value === 'string' ? [value] : value)
              query.append(name, item);
          listed.push(query);
          return { data: apps, meta: { total: apps.length } };
        }
        if (/releases\/apps\/[^/]+$/.test(call.path)) return { data: summary };
        if (call.path.endsWith('/initialAdmin'))
          return new Response(null, { status: 404 });
        return { data: [], meta: { total: 0 } };
      }),
    },
  );
  return { calls, listed };
}

/** An App on the shared host: its own runtime, and the host as the single-App read answers it. */
function onHost(
  state: AppSummary['runtime']['state'],
  {
    waiting = null,
    recycling = null,
    unrestored = false,
    environmentFailed = unrestored,
    error = null,
  }: {
    readonly waiting?: 'capacity' | 'memory' | 'recycle' | null;
    readonly recycling?: 'pending' | 'restarting' | null;
    /** The host restarted and could not put this App back (its environment's restore failed too). */
    readonly unrestored?: boolean;
    /** Its environment's restore failed, whether or not this App is back on the host. */
    readonly environmentFailed?: boolean;
    readonly error?: string | null;
  } = {},
): AppSummary {
  const summary = appSummary(state);
  const { environments: _environments, ...host } = HOST;
  return {
    ...summary,
    runtime: {
      ...summary.runtime,
      waiting,
      error,
      ...(unrestored ? { unrestored: true } : {}),
    },
    host: {
      ...host,
      recycling,
      failedEnvironments: environmentFailed
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
    // Its environment's restore failed, but this App is back on the host and fails on its own.
    expect(
      hostNoticeOf(
        onHost('failed', {
          environmentFailed: true,
          error: 'App failed to initialize: database password is invalid',
        }),
      ),
    ).toBeNull();
    // Another environment's restore failure is not this App's.
    expect(HOST.failedEnvironments.map((item) => item.id)).not.toContain(
      appSummary('failed').environment.id,
    );
    expect(hostNoticeOf(onHost('stopped', { waiting: 'memory' }))).toBe(
      'ui.runtime.waiting.memory',
    );
    expect(hostNoticeOf(appSummary('failed'))).toBeNull();
  });

  it('shows each host once on the environments page as a capacity card, its totals the whole host’s', async () => {
    await render('/release-environments');
    const card = (await screen.findByText('Shared app host')).closest(
      '[data-slot="card"]',
    ) as HTMLElement;
    // One card for the host however many environments share it, and no table of Apps.
    expect(screen.getAllByText('Shared app host')).toHaveLength(1);
    expect(card.id).toBe('shared-host-in-process');
    expect(card.querySelector('table')).toBeNull();
    const scoped = within(card);
    expect(
      scoped.getByText('Environments on it: Preview, Staging'),
    ).toBeTruthy();
    // Three metrics built alike — a short label, `used / limit`, a bar — so they line up; no `.0` in the numbers.
    const metrics = [
      ...card.querySelectorAll<HTMLElement>('[data-slot="shared-host-metric"]'),
    ].map((metric) =>
      [...metric.querySelectorAll(':scope > div:first-child > span')].map(
        (part) => part.textContent,
      ),
    );
    expect(metrics).toEqual([
      ['Running or starting', '3 / 6'],
      ['Heap', '900 MiB / 2 GiB'],
      ['Process memory', '1.5 GiB / 4.5 GiB'],
    ]);
    const bars = scoped.getAllByRole('progressbar');
    expect(bars.map((bar) => bar.getAttribute('aria-label'))).toEqual([
      'Running or starting',
      'Heap',
      'Process memory',
    ]);
    expect(bars.map((bar) => bar.getAttribute('aria-valuenow'))).toEqual([
      '50',
      String((900 / 2048) * 100),
      String((1536 / 4608) * 100),
    ]);
    expect(bars.map((bar) => bar.getAttribute('aria-valuetext'))).toEqual([
      '3 / 6',
      '900 MiB / 2 GiB',
      '1.5 GiB / 4.5 GiB',
    ]);
    // What the server has free is a side note, not part of a metric.
    expect(
      scoped.getByText(/Deployed: 12 · 3 GiB still free on the server · /),
    ).toBeTruthy();
    expect(scoped.getByText(NO_LIMIT_NOTE)).toBeTruthy();
    expect(scoped.getByText(/Deployed: 12/)).toBeTruthy();
    expect(scoped.getByText(/Old code is freed by restarting/)).toBeTruthy();
    expect(
      scoped.getByText(
        'Demo: its apps could not be restored; retrying in the background.',
      ),
    ).toBeTruthy();
    expect(scoped.getByText('The release archive is missing.')).toBeTruthy();
    expect(scoped.getByText('Lists only the apps you can view.')).toBeTruthy();
  });

  it('says when nothing limits how many apps run', async () => {
    await render('/release-environments', {
      hosts: [{ ...HOST, maxActive: null, memory: null }],
    });
    expect(await screen.findByText('3 · no limit')).toBeTruthy();
    expect(screen.getByText('Running or starting')).toBeTruthy();
    // No bar to fill, but the metric keeps the same shape.
    expect(screen.queryByRole('progressbar')).toBeNull();
    expect(
      document.querySelectorAll('[data-slot="shared-host-metric"]'),
    ).toHaveLength(1);
  });

  it('splits a card’s running apps by environment, each linking to its environment filtered to them', async () => {
    const { listed } = await render('/release-environments');
    const footer = (
      await screen.findByText('Running or starting, by environment:')
    ).closest('[data-host-environments]') as HTMLElement;
    expect(
      within(footer).getByRole('link', { name: 'Preview 2' }),
    ).toHaveAttribute(
      'href',
      '/release-environments/preview?runtimeState=running&runtimeState=starting',
    );
    await userEvent.click(
      within(footer).getByRole('link', { name: 'Staging 1' }),
    );
    await waitFor(() =>
      expect(screen.getByTestId('location').textContent).toBe(
        '/release-environments/staging?runtimeState=running&runtimeState=starting',
      ),
    );
    // The environment's Apps ask the server for the states the card counts, so the rows are as many as its number.
    await waitFor(() => expect(listed.length).toBeGreaterThan(0));
    const query = listed.at(-1)!;
    expect(query.getAll('environmentId')).toEqual(['staging']);
    expect(query.getAll('runtimeState')).toEqual(['running', 'starting']);
    expect(
      screen.getByRole('button', { name: 'State: Running, Starting' }),
    ).toBeTruthy();
  });

  it('names the counts without links for someone who may not read the apps', async () => {
    const permissions = allPermissions();
    for (const denied of [
      { ...permissions, pages: { 'rel-apps': false } },
      {
        ...permissions,
        scopes: { ...permissions.scopes, 'rel.apps/view': 'none' as const },
      },
    ]) {
      await render('/release-environments', { permissions: denied });
      expect(await screen.findByText('Shared app host')).toBeTruthy();
      expect(
        screen.getByText('Running or starting, by environment:'),
      ).toBeTruthy();
      expect(screen.queryByRole('link', { name: 'Preview 2' })).toBeNull();
      cleanup();
    }
    // Viewing only some Apps is enough: the environment's page shows those.
    await render('/release-environments', {
      permissions: {
        ...permissions,
        scopes: { ...permissions.scopes, 'rel.apps/view': { users: ['user'] } },
      },
    });
    expect(await screen.findByRole('link', { name: 'Preview 2' })).toBeTruthy();
  });

  it('leaves the card out of the environments page when no environment shares a host', async () => {
    await render('/release-environments', { hosts: [] });
    await screen.findByText('Staging');
    expect(screen.queryByText('Shared app host')).toBeNull();
  });

  it('shows each app’s runtime state on its environment’s page, with why on hover and on a tap', async () => {
    const running = appSummary('running', 'busy-app');
    const queued = appSummary('stopped', 'queued-app');
    const deploying = appSummary('running', 'deploying-app');
    const pending = appSummary('pending', 'pending-app');
    await render('/release-environments/staging', {
      apps: [
        pending,
        {
          ...running,
          runtime: {
            ...running.runtime,
            holds: ['requests', 'resident'],
            lastAccessedAt: '2026-11-07T01:00:00.000Z',
          },
        },
        { ...queued, runtime: { ...queued.runtime, waiting: 'memory' } },
        { ...deploying, hasPendingDeployment: true },
      ],
    });
    const row = async (id: string) =>
      within((await screen.findAllByText(id))[0]!.closest('tr') as HTMLElement);
    // The runtime's own state; a deployment in progress is marked beside it rather than hiding it.
    expect((await row('deploying-app')).getByText('Running')).toBeTruthy();
    // Not on its runtime yet is not worded as starting: it holds no slot.
    expect(
      (await row('pending-app')).getByText('Not started yet'),
    ).toBeTruthy();
    expect((await row('deploying-app')).getByText('Deploying')).toBeTruthy();
    expect(
      (await row('queued-app')).getByText('Waiting for memory'),
    ).toBeTruthy();
    // Why it runs, from a tap as on a phone (hover and focus open it too), without opening the App.
    const trigger = (await row('busy-app')).getByRole('button', {
      name: /Running/,
    });
    /** The open tooltip: Base UI's popup carries no `tooltip` role of its own. */
    const openTooltip = async () =>
      await waitFor(() => {
        const popup = document.querySelector<HTMLElement>(
          '[data-slot="tooltip-content"]',
        );
        expect(popup).toBeTruthy();
        return popup!;
      });
    await userEvent.click(trigger);
    const tooltip = await openTooltip();
    expect(within(tooltip).getByText('Serving requests')).toBeTruthy();
    expect(within(tooltip).getByText('Always running')).toBeTruthy();
    expect(within(tooltip).getByText(/^Last visit: /)).toBeTruthy();
    expect(screen.getByTestId('location').textContent).toBe(
      '/release-environments/staging',
    );
    // A second tap keeps it open, and so does the pointer leaving after a tap, as a touch does; Escape closes it.
    await userEvent.click(trigger);
    await userEvent.unhover(trigger);
    expect(await openTooltip()).toBeTruthy();
    await userEvent.keyboard('{Escape}');
    await waitFor(() =>
      expect(
        document.querySelector('[data-slot="tooltip-content"]'),
      ).toBeNull(),
    );
    await userEvent.hover((await row('queued-app')).getByRole('button'));
    expect(
      within(await openTooltip()).getByText('Start refused: not enough memory'),
    ).toBeTruthy();
  });

  it('keeps an environment’s state filter in the address, so a reload restores it', async () => {
    const { listed } = await render(
      '/release-environments/staging?runtimeState=failed',
      { apps: [appSummary('failed', 'broken')] },
    );
    expect((await screen.findAllByText('broken')).length).toBeGreaterThan(0);
    const first = listed.at(-1)!;
    expect(first.getAll('environmentId')).toEqual(['staging']);
    expect(first.getAll('runtimeState')).toEqual(['failed']);
    // Adding a state through the menu keeps the others.
    await userEvent.click(
      screen.getByRole('button', { name: 'State: Failed' }),
    );
    await userEvent.click(
      await screen.findByRole('menuitemcheckbox', { name: 'Waiting' }),
    );
    await waitFor(() =>
      expect(screen.getByTestId('location').textContent).toBe(
        '/release-environments/staging?runtimeState=waiting&runtimeState=failed',
      ),
    );
    await waitFor(() =>
      expect(listed.at(-1)!.getAll('runtimeState')).toEqual([
        'waiting',
        'failed',
      ]),
    );
    await userEvent.keyboard('{Escape}');
    await userEvent.click(
      screen.getByRole('button', { name: 'Clear filters' }),
    );
    await waitFor(() =>
      expect(screen.getByTestId('location').textContent).toBe(
        '/release-environments/staging',
      ),
    );
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
      expect(screen.queryByText(/apps running or starting/)).toBeNull();
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
      // Only the line: the host's counts stay on the environments page.
      expect(screen.queryByText('Shared app host')).toBeNull();
      expect(screen.queryByText(/apps running or starting/)).toBeNull();
      cleanup();
    }
    const { calls } = await render('/apps/shop', {
      summary: onHost('stopped', { waiting: 'memory' }),
    });
    await userEvent.click(
      await screen.findByRole('link', { name: 'View host usage' }),
    );
    expect(await screen.findByText('Shared app host')).toBeTruthy();
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
    expect(screen.getByText('运行或启动中')).toBeTruthy();
    expect(screen.getByText('进程内存')).toBeTruthy();
    expect(screen.getByText(/服务器还剩 3 GiB/)).toBeTruthy();
    expect(
      screen.getByText('这个宿主正在重启，恢复前它的应用会提示“稍后重试”。'),
    ).toBeTruthy();
    expect(screen.getByText('Demo：应用恢复失败，后台重试中。')).toBeTruthy();
    expect(screen.getByText('按环境，运行或启动中：')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Preview 2' })).toBeTruthy();
    cleanup();
    await render('/apps/shop', {
      summary: onHost('stopped', { waiting: 'memory' }),
      locale: 'zh-CN',
    });
    expect(await screen.findByText('启动被拒：内存不足')).toBeTruthy();
    expect(screen.getByRole('link', { name: '查看宿主占用' })).toBeTruthy();
  });
});
