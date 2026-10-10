// @vitest-environment node
/**
 * The demo data over the real services: it adds its review checklist to the installed Software development workflow
 * instead of a workflow of its own, its projects use the default workflow, and adding the checklist again changes
 * nothing.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { SOFTWARE_TEMPLATE } from '../../server/agents/catalog/workflow-templates.js';
import builtInAgents from '../../database/main/seeds/202610010030_studio_builtin_agents.js';
import presetLabels from '../../database/main/seeds/202610010060_studio_preset_labels.js';
import { createDesignService } from '../../server/agents/design.js';
import { addReviewChecklist, buildDemo } from '../../server/demo/build.js';
import { DEMO_REVIEW_CHECKLIST } from '../../server/demo/data.js';
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
  await h.projects.workflows.installTemplate(SOFTWARE_TEMPLATE);
  // The installation's built-in agents, owned by its administrator.
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
  await builtInAgents.run({
    query: conn.query,
    repository: (name: string) => conn.repository(name),
    config: { get: () => undefined },
  } as never);
  // An installation with a model service: the built-in assistant gets its model.
  await h.agents.online.services.create({
    title: 'Local',
    provider: 'openai-compatible',
    baseUrl: 'http://127.0.0.1:9/v1',
    models: [{ value: 'mock-model', label: 'Mock model' }],
  });
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
    knowledge: h.knowledge!,
    adminId: 'admin',
    onWarning: (message, error) => warnings.push({ message, error }),
    ...(history ? { connection: () => h.database.connection() } : {}),
  });
  expect(warnings.map((warning) => warning.message)).toEqual(expected);
}

describe('the demo data', () => {
  it('gives the built-in assistant a model and makes it the team default when a model service offers one', async () => {
    await build();
    const agents = await h.agents.agents.list();
    // No chat agent of its own beside the built-in ones.
    expect(agents.map((agent) => agent.name).sort()).toEqual(
      [
        'Code Reviewer',
        'Frontend Developer',
        'Project lead',
        'Project assistant',
      ].sort(),
    );
    const assistant = agents.find(
      (agent) => agent.id === 'studio-project-assistant',
    )!;
    expect(assistant).toMatchObject({
      type: 'online',
      modelEntries: [
        { modelService: 'local', model: 'mock-model', effort: null },
      ],
    });
    // A runner agent lists its tools in order: a runtime takes its work with the first one it has signed in.
    expect(
      agents.find((agent) => agent.name === 'Code Reviewer'),
    ).toMatchObject({
      type: 'runner',
      modelEntries: [
        { tool: 'codex', model: null, effort: null },
        { tool: 'claude', model: 'opus', effort: null },
      ],
    });
    expect((await h.agents.chat.settings()).defaultAgentId).toBe(assistant.id);
  });

  it('leaves the built-in assistant waiting for a model, and says why, without a model service', async () => {
    await h.agents.online.services.remove('local');
    await build([
      'The built-in Project assistant has no model: set up a model service with a model in Agent team › Models, then give it one on its page to chat with it',
    ]);
    expect(await h.agents.agents.get('studio-project-assistant')).toMatchObject(
      {
        type: 'online',
        modelEntries: [],
      },
    );
    // It stays the team's default chat agent, as the installation made it.
    expect((await h.agents.chat.settings()).defaultAgentId).toBe(
      'studio-project-assistant',
    );
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
    // Never heard from again, they go offline and take no work.
    expect(
      await h.agents.runners.markOffline(new Date(Date.now() + 60_000)),
    ).toHaveLength(3);
  });

  it('adds its review checklist to Software development and creates no workflow', async () => {
    await build();
    const workflows = await h.projects.workflows.list(admin());
    expect(workflows).toHaveLength(1);
    const [software] = workflows;
    expect(software).toMatchObject({ builtInKey: 'software', isDefault: true });
    const review = software!.definition.states.find(
      (state) => state.key === 'in_review',
    )!;
    // The template's own rules stay: telling the owner, and the code reviewer's run.
    expect(review.rules?.map((rule) => rule.type)).toEqual([
      'checklist',
      'notifyOwner',
      'runAgent',
    ]);
    expect(review.rules?.[0]).toEqual({
      type: 'checklist',
      config: { items: DEMO_REVIEW_CHECKLIST },
    });
    const projects = await h.projects.projects.list(admin());
    expect(projects.length).toBeGreaterThan(0);
    expect(projects.every((project) => project.workflowId === null)).toBe(true);
    // An issue in review got the checklist on entering it, with what the demo checked.
    const reviewed = (
      await h.projects.issueQueries.page(admin(), { statusKey: 'in_review' })
    ).data[0]!;
    const detail = await h.projects.issueQueries.detail(admin(), reviewed.id);
    expect(detail.checklist?.items.map((item) => item.itemKey)).toEqual(
      DEMO_REVIEW_CHECKLIST.map((item) => item.key),
    );
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

  it('leaves a workflow that has the checklist alone', async () => {
    expect(await addReviewChecklist(h.projects, admin())).toBe(true);
    const [first] = await h.projects.workflows.list(admin());
    expect(await addReviewChecklist(h.projects, admin())).toBe(true);
    const [second] = await h.projects.workflows.list(admin());
    expect(second!.revision).toBe(first!.revision);
    expect(second!.definition).toEqual(first!.definition);
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

  it('has an issue whose agent proposal waits in Proposal review for the administrator to decide', async () => {
    await build();
    const [issue, ...others] = (
      await h.projects.issueQueries.page(admin(), {
        statusKey: 'proposal_review',
      })
    ).data;
    expect(others).toHaveLength(0);
    expect(issue).toMatchObject({ title: 'Export the issue list to Excel' });
    const state = await createDesignService({
      projects: () => h.projects,
      inbox: () => undefined,
    }).state(admin(), issue!.id);
    expect(state).toMatchObject({
      inReview: true,
      canApprove: true,
      canRequestChanges: true,
      proposal: { authorType: 'agent', authorName: 'Frontend Developer' },
    });
    expect(state.proposal?.content).toContain('## Approach');
    // No run waits for the agent: no demo runtime is online.
    const runs = await h.agents.runs.openOn(
      h.database.connection(),
      { kind: 'issue', id: issue!.id },
      state.proposal!.authorId!,
    );
    expect(runs).toHaveLength(0);
  });

  it('has a past the dashboard measures: work finished over two months and the agents’ runs on it', async () => {
    // The installation's price table (seeded by the agents plugin) prices Claude Code's Sonnet.
    await h.agents.prices.replace({
      subscriptions: [],
      prices: [
        {
          tool: 'claude',
          model: 'claude-sonnet-4*',
          inputPerM: 3,
          outputPerM: 15,
        },
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
