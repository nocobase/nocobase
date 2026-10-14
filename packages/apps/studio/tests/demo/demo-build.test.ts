// @vitest-environment node
/**
 * The demo data over the real services: its runtimes' reports discover the agents, the demo enables some of them and
 * the project manager runs with two, its issues are in the fixed statuses, and the project manager executes the work
 * that agents do without starting it.
 */
import { runnerAgentId } from '@nocobase/app-plugin-agents/server/tokens';
import { STATUS_KEYS } from '@nocobase/app-plugin-projects/shared/statuses';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import presetLabels from '../../database/main/seeds/202610010060_studio_preset_labels.js';
import { PROJECT_MANAGER_ID } from '../../shared/project-manager.js';
import { buildDemo } from '../../server/demo/build.js';
import { DEMO_AGENTS, DEMO_ISSUES } from '../../server/demo/data.js';
import { DEMO_HISTORY } from '../../server/demo/history.js';
import { createPermissionSource } from '../../server/agents/commands/permissions.js';
import { createStudioReports } from '../../server/reports/service.js';
import {
  createBridgeHarness,
  permissionsOf,
  type BridgeHarness,
} from '../agents/bridge-harness.js';

let h: BridgeHarness;
beforeEach(async () => {
  h = await createBridgeHarness({ knowledge: true });
  await h.addUser('admin');
  h.roles.set('admin', 'admin');
  const conn = h.database.connection();
  const now = new Date();
  await conn.query
    .insertInto('authorizationPermissionSetAssignments')
    .values({
      id: 'user:admin:root',
      subjectType: 'user',
      subjectId: 'admin',
      permissionSetKey: 'root',
      createdAt: now,
      updatedAt: now,
    })
    .execute();
});
afterEach(() => h.close());

const admin = () => h.viewer('admin');

async function build(
  expected: readonly string[] = [],
  history = false,
): Promise<void> {
  const warnings: { message: string; error: unknown }[] = [];
  await buildDemo({
    users: {
      async create(input: { username: string }) {
        await h.addUser(input.username);
        h.roles.set(input.username, 'admin');
        return { id: input.username };
      },
    } as never,
    projects: h.projects,
    access: {
      permissionsOfUser: (userId: string) =>
        Promise.resolve(permissionsOf(h.roles.get(userId) ?? 'member', userId)),
    } as never,
    agents: h.agents,
    projectManager: h.manager,
    knowledge: h.knowledge!,
    adminId: 'admin',
    onWarning: (message, error) => warnings.push({ message, error }),
    ...(history ? { connection: () => h.database.connection() } : {}),
  });
  expect(warnings.map((warning) => warning.message)).toEqual(expected);
}

const idOf = (key: string): string => {
  const agent = DEMO_AGENTS.find((each) => each.key === key)!;
  return runnerAgentId(agent.tool, agent.model);
};

describe('the demo data', () => {
  it('enables the agents its runtimes discovered, with what they are good at and their skills', async () => {
    await build();
    const discovered = (await h.agents.agents.list()).filter(
      (agent) => agent.source === 'runner',
    );
    expect(
      discovered
        .map((agent) => ({
          tool: agent.tool,
          model: agent.model,
          status: agent.status,
        }))
        .sort((a, b) => a.model!.localeCompare(b.model!)),
    ).toEqual([
      { tool: 'claude', model: 'claude-haiku-4-5', status: 'pending' },
      { tool: 'claude', model: 'claude-opus-5-5', status: 'enabled' },
      { tool: 'claude', model: 'claude-sonnet-5', status: 'enabled' },
      { tool: 'codex', model: 'gpt-6.1-sol', status: 'enabled' },
    ]);
    for (const spec of DEMO_AGENTS) {
      expect(await h.agents.agents.get(idOf(spec.key))).toMatchObject({
        description: spec.description,
      });
      const skills = await h.agents.skills.attached({
        scope: 'agent',
        scopeId: idOf(spec.key),
      });
      expect(skills).toHaveLength(spec.skills.length);
    }
  });

  it('makes two of them the project manager’s first choice and fallback', async () => {
    await build();
    expect(await h.manager.settings()).toMatchObject({
      firstChoiceAgentId: idOf('opus'),
      fallbackAgentId: idOf('gpt'),
    });
    expect(
      (await h.agents.agents.get(PROJECT_MANAGER_ID)).modelEntries.map(
        (entry) => [entry.tool, entry.model],
      ),
    ).toEqual([
      ['claude', 'claude-opus-5-5'],
      ['codex', 'gpt-6.1-sol'],
    ]);
  });

  it('connects runtimes with their slots and limits per coding tool, owned by the people who connected them', async () => {
    await build();
    const runtimes = await h.agents.runners.list();
    expect(
      runtimes
        .map((runtime) => ({
          name: runtime.name,
          owner: runtime.ownerUserId,
          trust: runtime.trust,
          slots: runtime.slots,
          toolSlots: runtime.toolSlots,
          acceptJobs: runtime.acceptJobs,
          tools: runtime.tools.map((tool) => tool.kind),
        }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    ).toEqual(
      [
        {
          name: 'Build server build-01',
          owner: 'admin',
          trust: 'team',
          slots: 4,
          toolSlots: { claude: 2, codex: 1 },
          acceptJobs: true,
          tools: ['claude', 'codex', 'opencode'],
        },
        {
          name: 'Alex’s MacBook Pro',
          owner: 'alex',
          trust: 'team',
          slots: 2,
          toolSlots: { claude: 1 },
          acceptJobs: false,
          tools: ['claude', 'codex'],
        },
        {
          name: 'Lisa’s workstation',
          owner: 'lisa',
          trust: 'ownerOnly',
          slots: 1,
          toolSlots: null,
          acceptJobs: false,
          tools: ['claude'],
        },
      ].sort((a, b) => a.name.localeCompare(b.name)),
    );
    // Never heard from again, they are offline at once and take no work.
    expect(await h.agents.runners.online(h.database.connection())).toEqual([]);
    expect(
      await h.agents.runners.markOffline(new Date(Date.now() + 60_000)),
    ).toEqual([]);
  });

  it('puts its issues in the fixed statuses, the agents’ work executed by the project manager and not started', async () => {
    await build();
    const issues = (await h.projects.issueQueries.page(admin(), { limit: 100 }))
      .data;
    expect(issues).toHaveLength(DEMO_ISSUES.length);
    expect(issues.every((issue) => STATUS_KEYS.includes(issue.statusKey))).toBe(
      true,
    );
    expect(
      new Set(issues.map((issue) => issue.statusKey)).size,
    ).toBeGreaterThanOrEqual(STATUS_KEYS.length);
    for (const spec of DEMO_ISSUES) {
      const issue = issues.find((each) => each.title === spec.title)!;
      expect(issue).toMatchObject({
        statusKey: spec.status,
        needsYou: spec.needsYou ?? null,
      });
      const comments = await h.projects.commentQueries.list(
        h.database.connection(),
        issue.id,
        {},
      );
      expect(comments).toHaveLength(spec.comments?.length ?? 0);
    }
    const managed = DEMO_ISSUES.filter((spec) => spec.projectManager);
    expect(managed.length).toBeGreaterThan(0);
    for (const spec of managed) {
      const issue = issues.find((each) => each.title === spec.title)!;
      expect(issue).toMatchObject({
        statusKey: spec.status,
        executor: { type: 'agent', id: PROJECT_MANAGER_ID },
      });
    }
    expect(
      await h.database
        .connection()
        .query.selectFrom('agRuns')
        .select('id')
        .execute(),
    ).toEqual([]);
  });

  it('reuses the preset labels of an English installation instead of creating them again', async () => {
    const conn = h.database.connection();
    await presetLabels.run({
      query: conn.query,
      repository: (name: string) => conn.repository(name),
      config: {
        get: (key: string) =>
          key === 'i18n.defaultLocale' ? 'en-US' : undefined,
      },
    } as never);
    const before = await h.projects.labels.list();
    expect(before).toHaveLength(9);
    await build();
    const after = await h.projects.labels.list();
    expect(after).toEqual(before);
    const labelled = (await h.projects.issueQueries.page(admin(), {})).data
      .flatMap((issue) => issue.labels)
      .map((label) => label.id);
    expect(labelled.length).toBeGreaterThan(0);
    const presetIds = new Set(before.map((label) => label.id));
    expect(labelled.every((id) => presetIds.has(id))).toBe(true);
  });

  it('builds a knowledge base in the system and the projects, with one proposal waiting for its lead', async () => {
    await build();
    const knowledge = h.knowledge!;
    const projects = await h.projects.projects.list(admin());
    const studio = projects.find(
      (project) => project.name === 'Studio Platform',
    )!;
    const tree = await knowledge.docs.tree(
      { userId: 'alex' },
      { scope: 'project', scopeId: studio.id },
    );
    expect(
      tree.spaces.map((entry) => [
        entry.space.scope,
        entry.docs.map((doc) => doc.slug).sort(),
      ]),
    ).toEqual([
      ['project', ['dev-environment', 'known-pitfalls', 'sqlite-locks']],
      ['system', ['manual', 'manual-issues', 'team-conventions']],
    ]);
    const pending = await knowledge.proposals.list(
      { userId: 'alex' },
      { decidable: true },
    );
    expect(pending).toHaveLength(1);
    expect(pending[0]).toMatchObject({
      kind: 'update',
      docSlug: 'dev-environment',
      proposer: { kind: 'agent' },
      source: { kind: 'issue' },
      canDecide: true,
    });
  });

  it('has a past the dashboard measures: work finished over two months and the agents’ runs on it', async () => {
    // The installation's price table prices the demo agents' models.
    await h.agents.prices.replace({
      subscriptions: [],
      prices: [
        { tool: 'claude', model: 'claude-*', inputPerM: 3, outputPerM: 15 },
        { tool: 'codex', model: 'gpt-*', inputPerM: 2, outputPerM: 10 },
      ],
    });
    await build([], true);
    const permissions = createPermissionSource(() => ({
      permissionsOfUser: (userId: string) =>
        Promise.resolve(permissionsOf(h.roles.get(userId) ?? 'member', userId)),
    }));
    const reports = createStudioReports({
      agents: h.agents,
      projects: () => h.projects,
      viewerOf: (userId) =>
        permissions.viewerOf({ kind: 'user', userId, displayName: userId }),
      connection: () => h.database.connection(),
    });
    const admin = { userId: 'admin', allRuns: true };
    const report = await reports.dashboard(admin, 30);
    const recent = DEMO_HISTORY.filter((item) => item.doneDaysAgo < 29);
    // The demo's own done issues were done today, without a start.
    expect(report.current.completed).toBeGreaterThanOrEqual(recent.length);
    expect(report.current.completed).toBeGreaterThan(report.previous.completed);
    expect(report.current).toMatchObject({
      cycleTimeP50Ms: expect.any(Number),
      agentShare: expect.any(Number),
      costPerIssue: { USD: expect.any(Number) },
      successRate: expect.any(Number),
      reworkRate: expect.any(Number),
      runsPerIssue: expect.any(Number),
      interventionRate: expect.any(Number),
      queueWaitP50Ms: expect.any(Number),
    });
    expect(report.current.successRate).toBeLessThan(1);
    expect(report.current.reworkRate).toBeGreaterThan(0);
    expect(report.current.interventionRate).toBeGreaterThan(0);
    expect(
      report.buckets.filter((bucket) => bucket.completed > 0).length,
    ).toBeGreaterThan(5);
    expect(
      report.projects.find((project) => project.name === 'Studio Platform'),
    ).toMatchObject({ completed: expect.any(Number) });
    // Blocked and overdue issues, and a run that failed a few hours ago.
    const attention = await reports.attention(admin);
    expect(attention.blocked.total).toBeGreaterThan(0);
    expect(attention.overdue.total).toBeGreaterThan(0);
    expect(attention.failedRuns.total).toBe(1);
  });
});
