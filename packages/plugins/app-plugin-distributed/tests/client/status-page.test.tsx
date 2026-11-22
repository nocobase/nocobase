// db-test-portability: dialect-specific — a fake configuration names SQLite to exercise the database check; no database is opened
import { answerApi, renderWithApp } from '@nocobase/app-testing/client';
import { fireEvent, screen, within } from '@testing-library/react';
import { Routes, Route } from 'react-router';
import { describe, expect, it } from 'vitest';

import DistributedStatusPage, {
  Configuration,
  Checks,
} from '../../client/components/status-page.js';
import plugin from '../../client/plugin.js';
import type {
  DistributedService,
  DistributedStatus,
} from '../../shared/types.js';
import { fixtureClientPlugin } from '../fixtures/client-extension.js';

function service(
  key: DistributedService['key'],
  overrides: Partial<DistributedService> = {},
): DistributedService {
  return {
    key,
    available: true,
    configPath: `${key}.default`,
    source: 'default',
    default: null,
    adapter: 'memory',
    sharing: 'local',
    registered: true,
    backends: [],
    selections: [],
    ...overrides,
  };
}

const SINGLE: DistributedStatus = {
  mode: 'single',
  services: [
    service('caching', { default: 'memory' }),
    service('concurrency', { default: 'memory', adapter: 'mutex' }),
    service('jobs'),
    service('queue', { adapter: 'inMemory' }),
    service('realtime', {
      adapter: 'inMemory',
      configPath: 'realtime.broker.adapter',
    }),
  ],
  idGeneration: { mode: 'manual', workerId: 0, source: 'default' },
  checks: [
    {
      id: 'database.sqlite',
      level: 'recommended',
      title: 'Database',
      detail: 'SQLite serves one instance only.',
      params: { dialect: 'sqlite' },
      fix: { text: 'Move the data.' },
    },
    {
      id: 'idGeneration.manual',
      level: 'recommended',
      title: 'ID generation',
      detail: 'Manual worker ID 0.',
      params: { workerId: 0 },
      fix: { text: 'Give every instance its own SNOWFLAKE_WORKER_ID.' },
    },
  ],
  extensions: {},
};

const MULTI: DistributedStatus = {
  ...SINGLE,
  mode: 'multi',
  services: SINGLE.services.map((entry) =>
    entry.key === 'queue'
      ? entry
      : {
          ...entry,
          default: 'redis',
          adapter: 'redis',
          sharing: 'shared',
          source: 'configured',
        },
  ),
  checks: [
    {
      id: 'service.local',
      level: 'required',
      title: 'Queue is still local to this instance',
      detail: 'Each instance keeps its own queue state.',
      params: {
        service: 'queue',
        adapter: 'inMemory',
        configPath: 'queue.default',
        plugin: '@nocobase/app-plugin-queue-redis',
      },
      fix: { text: 'Install it.', snippet: 'queue:\n  default: redis' },
    },
    {
      id: 'files.local',
      level: 'required',
      title: 'File storage',
      detail: 'Local files.',
      params: { collections: ['attachments', 'contracts'] },
    },
    {
      id: 'fixture.instances',
      level: 'ok',
      title: 'Running instances',
      detail: 'Two instances took worker IDs.',
    },
  ],
  extensions: { fixture: { instances: ['node-a', 'node-b'] } },
};

async function show(status: DistributedStatus, extra = false) {
  return renderWithApp(
    <Routes>
      <Route path='distributed' element={<DistributedStatusPage />}>
        <Route path='configuration' element={<Configuration />} />
        <Route path='checks' element={<Checks />} />
      </Route>
    </Routes>,
    {
      route: '/distributed',
      plugins: extra ? [plugin(), fixtureClientPlugin()] : [plugin()],
      namespace: '@nocobase/app-plugin-distributed',
      fetch: answerApi(({ path }) => {
        if (path !== 'distributed/status')
          throw new Error(`Unexpected ${path}`);
        return { data: status };
      }),
    },
  );
}

describe('cluster and distributed page', () => {
  it('opens configuration first and discloses a service’s effective settings', async () => {
    await show(SINGLE);
    expect(await screen.findByText('Single instance')).toBeVisible();
    expect(
      await screen.findByRole('heading', { name: 'Service backends' }),
    ).toBeVisible();
    expect(screen.getByText('0 / 5')).toBeVisible();
    expect(screen.queryByText(/SQLite serves one instance only/u)).toBeNull();
    const row = screen.getByText('Caching').closest('details')!;
    fireEvent.click(row.querySelector('summary')!);
    expect(within(row).getByText('caching.default')).toBeVisible();
    expect(
      within(row).getByText('@nocobase/app-plugin-caching-redis'),
    ).toBeVisible();
  });

  it('links to a blocking check even for single-instance configurations', async () => {
    await show({ ...SINGLE, checks: [MULTI.checks[0]!, ...SINGLE.checks] });
    fireEvent.click(await screen.findByRole('link', { name: 'Must fix · 1' }));
    expect(
      await screen.findByText('Queue is still local to this instance'),
    ).toBeVisible();
  });

  it('shows pending checks initially, expands fixes and filters extension checks', async () => {
    await show(MULTI, true);
    expect(await screen.findByText('4 / 5')).toBeVisible();
    expect(
      await screen.findByText('Running instances: node-a, node-b'),
    ).toBeVisible();
    fireEvent.click(
      screen.getByRole('link', { name: 'Multi-instance checks' }),
    );
    const queue = (
      await screen.findByText('Queue is still local to this instance')
    ).closest('li')!;
    expect(within(queue).getByText('Must fix')).toBeVisible();
    fireEvent.click(queue.querySelector('summary')!);
    expect(queue.querySelector('code')).toHaveTextContent(
      'queue: default: redis',
    );
    expect(screen.queryByText('Running instances')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'All' }));
    expect(screen.getByText('Running instances')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Needs attention' }));
    expect(screen.queryByText('Running instances')).toBeNull();
  });

  it('shows an empty pending filter when every check passes', async () => {
    await show({ ...MULTI, checks: [MULTI.checks[2]!] });
    fireEvent.click(
      await screen.findByRole('link', { name: 'Multi-instance checks' }),
    );
    expect(await screen.findByText('No checks to address.')).toBeVisible();
  });

  it('reports a refused request without showing any status', async () => {
    await renderWithApp(<DistributedStatusPage />, {
      plugins: [plugin()],
      namespace: '@nocobase/app-plugin-distributed',
      fetch: answerApi(() =>
        Response.json(
          { error: { code: 403, status: 'PERMISSION_DENIED', message: 'No' } },
          { status: 403 },
        ),
      ),
    });

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The status could not be loaded.',
    );
    expect(
      screen.queryByRole('button', { name: 'Retry' }),
    ).not.toBeInTheDocument();
  });
});
