// db-test-portability: dialect-specific — a fake configuration names SQLite to exercise the database check; no database is opened
import { answerApi, renderWithApp } from '@nocobase/app-testing/client';
import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import DistributedStatusPage from '../../client/components/status-page.js';
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
  return renderWithApp(<DistributedStatusPage />, {
    plugins: extra ? [plugin(), fixtureClientPlugin()] : [plugin()],
    namespace: '@nocobase/app-plugin-distributed',
    fetch: answerApi(({ path }) => {
      if (path !== 'distributed/status') throw new Error(`Unexpected ${path}`);
      return { data: status };
    }),
  });
}

describe('cluster and distributed page', () => {
  it('tells a single instance that nothing needs to change', async () => {
    await show(SINGLE);

    expect(await screen.findByText('Single instance')).toBeInTheDocument();
    expect(screen.getByRole('note')).toHaveTextContent(
      'Running one instance needs no change.',
    );
    expect(screen.getByText('0 / 5')).toBeInTheDocument();
    expect(
      screen.getAllByText('This instance only').length,
    ).toBeGreaterThanOrEqual(5);
    expect(
      screen.getByText(/SQLite serves one instance only/u),
    ).toBeInTheDocument();
    expect(screen.getByText(/Manual worker ID 0/u)).toBeInTheDocument();
    expect(screen.getByText('Before going live')).toBeInTheDocument();
    expect(
      screen.getByText(/There is no “Test connection”/u),
    ).toBeInTheDocument();
  });

  it('does not tell a single instance with a blocking item that nothing needs to change', async () => {
    await show({
      ...SINGLE,
      checks: [
        {
          id: 'service.unregistered',
          level: 'required',
          title: 'Caching',
          detail: 'caching.default selects the adapter "acme".',
          params: {
            service: 'caching',
            adapter: 'acme',
            configPath: 'caching.default',
            plugin: '@nocobase/app-plugin-caching-redis',
          },
        },
        ...SINGLE.checks,
      ],
    });

    expect(await screen.findByText('Single instance')).toBeInTheDocument();
    expect(
      screen.getByText('Items below must be fixed even for one instance'),
    ).toBeInTheDocument();
    expect(screen.getByText('must be fixed')).toBeInTheDocument();
    expect(screen.getByRole('note')).toHaveTextContent(
      'Even with one instance, the items marked “Must fix” below need attention.',
    );
    expect(screen.getByRole('note')).not.toHaveTextContent('needs no change');
  });

  it('lists what must be fixed before running several instances', async () => {
    await show(MULTI);

    const queue = (
      await screen.findByText('Queue is still local to this instance')
    ).closest('li')!;
    expect(within(queue).getByText('Must fix')).toBeInTheDocument();
    expect(
      within(queue).getByText('queue: default: redis', {
        normalizer: (text) => text.replace(/\s+/gu, ' ').trim(),
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Files in attachments, contracts are on this host/u),
    ).toBeInTheDocument();
    expect(screen.queryByRole('note')).not.toBeInTheDocument();
    expect(
      screen.getAllByText('Shared between instances').length,
    ).toBeGreaterThanOrEqual(4);
    expect(screen.getAllByText('Configured').length).toBeGreaterThanOrEqual(4);
  });

  it('shows checks and blocks an external plugin registers', async () => {
    await show(MULTI, true);

    expect(await screen.findByText('Running instances')).toBeInTheDocument();
    expect(
      await screen.findByText('Running instances: node-a, node-b'),
    ).toBeInTheDocument();
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
