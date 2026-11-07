import { answerApi, renderWithApp } from '@nocobase/app-testing/client';
import { cleanup, screen, within } from '@testing-library/react';
import { Route, Routes } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';

import releases from '../client/plugin.js';
import { appStateOf } from '../client/lib/app-state.js';
import AppPage from '../client/pages/app-page.js';
import { allPermissions, ACCESS_NAMESPACE } from '../shared/access.js';
import type { AppHostView, AppSummary } from '../shared/releases.js';
import { appSummary } from './helpers/app-summary.js';

afterEach(cleanup);

const MiB = 1024 ** 2;

/** A preview host with a resident Staging App in use, an idle PR preview, a hidden App and a PR waiting for memory. */
const HOST: AppHostView = {
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

async function page(summary: AppSummary, locale = 'en-US') {
  await renderWithApp(
    <Routes>
      <Route path='/apps/:appId' element={<AppPage />} />
    </Routes>,
    {
      plugins: [releases({ routes: false })],
      namespace: ACCESS_NAMESPACE,
      locale,
      route: '/apps/shop',
      fetch: answerApi((call) => {
        if (call.path === 'releases/me')
          return {
            data: {
              userId: 'user',
              kind: 'human',
              permissions: allPermissions(),
            },
          };
        if (/releases\/apps\/[^/]+$/.test(call.path)) return { data: summary };
        if (call.path.endsWith('/initialAdmin'))
          return new Response(null, { status: 404 });
        return { data: [], meta: { total: 0 } };
      }),
    },
  );
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

  it('lists every occupant of the host with why it holds or waits, and the process memory as one total', async () => {
    const summary = appSummary('stopped');
    await page({
      ...summary,
      runtime: { ...summary.runtime, waiting: 'memory' },
      host: HOST,
    });
    const section = (
      await screen.findByRole('heading', { name: /Shared app host/ })
    ).closest('section')!;
    const scoped = within(section as HTMLElement);
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
    expect(row('An app you cannot view').getByText('Running')).toBeTruthy();
    expect(
      row('An app you cannot view').getByText('Used in the last minute'),
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
    // The App's own badge says what it waits for.
    expect(screen.getAllByText('Waiting for memory').length).toBeGreaterThan(1);
  });

  it('words the host in Chinese and leaves it out for a driver that shares none', async () => {
    const summary = appSummary('running');
    await page(
      { ...summary, host: { ...HOST, recycling: 'restarting' } },
      'zh-CN',
    );
    expect(await screen.findByText('共享应用宿主')).toBeTruthy();
    expect(screen.getByText('已部署 12 个应用，3 个运行或启动中')).toBeTruthy();
    expect(
      screen.getByText('这个宿主正在重启，恢复前它的应用会提示“稍后重试”。'),
    ).toBeTruthy();
    expect(screen.getByText('启动被拒：内存不足')).toBeTruthy();
    expect(screen.getByText('Demo：应用恢复失败，后台重试中。')).toBeTruthy();
    cleanup();
    await page({ ...summary, host: null });
    await screen.findByRole('tab', { name: 'Overview' });
    expect(screen.queryByText('Shared app host')).toBeNull();
  });
});
