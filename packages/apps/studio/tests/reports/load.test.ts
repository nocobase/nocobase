// @vitest-environment node
/**
 * The report routes under load: each reads a fixed number of queries whatever the number of issues, runs and usage
 * records, and the figures over a deterministic workload stay what they were before the reads were batched and moved
 * into the database (the snapshot was recorded from the earlier implementation).
 */
import { AsyncLocalStorage } from 'node:async_hooks';

import type { Knex } from 'knex';
import { afterEach, describe, expect, it } from 'vitest';

import { createPermissionSource } from '../../server/agents/commands/permissions.js';
import {
  createStudioReports,
  type StudioReports,
} from '../../server/reports/service.js';
import {
  createBridgeHarness,
  permissionsOf,
  type BridgeHarness,
} from '../agents/bridge-harness.js';
import { seedLoad } from './load-fixture.js';

const NOW = Date.parse('2026-10-01T12:00:00Z');
const ADMIN = { userId: 'alice', allRuns: true } as const;
const MEMBER = { userId: 'user1', allRuns: false } as const;
const RANGE = { from: '2026-09-02', to: '2026-10-01' } as const;

let h: BridgeHarness | undefined;
afterEach(async () => {
  await h?.close();
  h = undefined;
});

async function workload(issues: number): Promise<{
  readonly h: BridgeHarness;
  readonly reports: StudioReports;
  /** The generated ids of the workload's agents and projects, by a stable name. */
  readonly names: ReadonlyMap<string, string>;
}> {
  h = await createBridgeHarness();
  h.roles.set('alice', 'admin');
  const fixture = await seedLoad(h, {
    issues,
    runsPerIssue: 4,
    days: 60,
    now: NOW,
  });
  const names = new Map([
    ...fixture.agentIds.map((id, index) => [id, `agent-${index}`] as const),
    ...fixture.projectIds.map((id, index) => [id, `project-${index}`] as const),
  ]);
  const permissions = createPermissionSource(() => ({
    permissionsOfUser: (userId: string) =>
      Promise.resolve(permissionsOf(h?.roles.get(userId) ?? 'member', userId)),
  }));
  const reports = createStudioReports({
    agents: { ...h.agents, clock: { now: () => new Date(NOW) } },
    projects: () => h?.projects,
    viewerOf: (userId) =>
      permissions.viewerOf({ kind: 'user', userId, displayName: userId }),
    connection: () => (h as BridgeHarness).database.connection(),
  });
  return { h, reports, names };
}

/** What each route answers, by the service call behind it. */
function endpoints(
  harness: BridgeHarness,
  reports: StudioReports,
): Record<string, () => Promise<unknown>> {
  return {
    delivery: () => reports.delivery(ADMIN, 30),
    deliveryMember: () => reports.delivery(MEMBER, 30),
    agents: () => reports.agentPerformance(ADMIN, 30),
    agentsMember: () => reports.agentPerformance(MEMBER, 30),
    projects: () => reports.projectProgress(ADMIN, 30),
    attention: () => reports.attention(ADMIN),
    metrics: () => reports.metrics(ADMIN, RANGE),
    usage: () =>
      harness.agents.reporting.usage(ADMIN, { ...RANGE, groupBy: 'agent' }),
    usageByDay: () =>
      harness.agents.reporting.usage(ADMIN, {
        ...RANGE,
        groupBy: 'day',
        series: true,
      }),
    modelUsage: () => harness.agents.reporting.modelUsage(ADMIN, RANGE),
    users: () => harness.agents.people.list(harness.database.connection()),
  };
}

const scope = new AsyncLocalStorage<symbol>();

/** The statements each endpoint runs, after a first call has read what the database layer caches. */
async function queryCounts(
  harness: BridgeHarness,
  reports: StudioReports,
): Promise<Record<string, number>> {
  const client = await harness.database.connection().client<Knex>();
  const counts: Record<string, number> = {};
  for (const [name, read] of Object.entries(endpoints(harness, reports))) {
    await read();
    const mark = Symbol(name);
    let count = 0;
    const listener = () => {
      if (scope.getStore() === mark) count += 1;
    };
    client.on('query', listener);
    try {
      await scope.run(mark, read);
    } finally {
      client.removeListener('query', listener);
    }
    counts[name] = count;
  }
  return counts;
}

/**
 * Numbers rounded to a billionth, so summing in a different order does not show, and generated ids by their stable
 * names.
 */
function rounded(value: unknown, names: ReadonlyMap<string, string>): unknown {
  if (typeof value === 'string') return names.get(value) ?? value;
  if (typeof value === 'number')
    return Number.isInteger(value) ? value : Math.round(value * 1e9) / 1e9;
  if (Array.isArray(value)) return value.map((item) => rounded(item, names));
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        names.get(key) ?? key,
        rounded(item, names),
      ]),
    );
  return value;
}

describe('the report routes under load', () => {
  it('read a fixed number of queries whatever the number of rows', async () => {
    const small = await workload(20);
    const few = await queryCounts(small.h, small.reports);
    await small.h.close();
    h = undefined;
    const large = await workload(80);
    const many = await queryCounts(large.h, large.reports);
    expect(many).toEqual(few);
  }, 120_000);

  it('answer the same figures as before', async () => {
    const { h: harness, reports, names } = await workload(40);
    const answers: Record<string, unknown> = {};
    for (const [name, read] of Object.entries(endpoints(harness, reports)))
      // The people picker reads no figures; the day series repeats the usage report's sums.
      if (name !== 'users' && name !== 'usageByDay')
        answers[name] = rounded(await read(), names);
    expect(answers).toMatchSnapshot();
  }, 120_000);
});
