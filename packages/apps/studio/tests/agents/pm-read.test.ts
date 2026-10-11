// @vitest-environment node
/**
 * What the project manager reads in a conversation: the Reports page's figures (`report metrics`, `report usage`), an
 * issue's runs and a run's transcript (`issue runs`, `run get`, `run events`), who is asking (the brief's summary), and
 * the knowledge of the projects the conversation is about (the brief's section and `nb-studio kb`).
 */
import { RUNNER_ROUTES } from '@nocobase/agent-protocol';
import type { Issue } from '@nocobase/app-plugin-projects/shared/issues';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  askerSection,
  type AskerSummary,
} from '../../server/agents/conversation/asker.js';
import { mergedHits } from '../../server/knowledge/views.js';
import { metricsText, usageText } from '../../server/reports/text.js';
import { createBridgeHarness, type BridgeHarness } from './bridge-harness.js';

let h: BridgeHarness;
let projectId: string;
beforeEach(async () => {
  h = await createBridgeHarness({ knowledge: true });
  for (const id of ['alice', 'bob', 'root']) await h.addUser(id);
  h.roles.set('root', 'admin');
  const project = await h.projects.projects.create(h.viewer('root'), {
    name: 'Studio',
    leadUserId: 'alice',
  });
  projectId = project.id;
  await h.projects.projects.addMember(h.viewer('root'), projectId, {
    userId: 'bob',
  });
});
afterEach(() => h.close());

const PM_ACTIONS = [
  'pm.projects/view',
  'pm.issues/view',
  'pm.issues/create',
  'pm.issues/edit',
  'pm.issues/comment',
  'kb.knowledge/read',
  'kb.knowledge/propose',
  'studio.reports/read',
];

/** A conversation of `user` with a new project manager, its first message (with `context`) claimed by a runner. */
async function conversationRun(
  options: {
    readonly user?: string;
    readonly actions?: readonly string[];
    readonly context?: { kind: string; id: string }[];
  } = {},
) {
  const user = options.user ?? 'alice';
  const agentId = await h.createAgent({
    name: 'PM',
    actions: [...(options.actions ?? PM_ACTIONS)],
  });
  const conversation = await h.agents.conversations.create(user, { agentId });
  await h.agents.conversations.send(user, conversation.id, {
    content: 'Where do we stand?',
    ...(options.context
      ? { context: { route: '/issues', items: options.context } }
      : {}),
  });
  const payload = await h.claimOne();
  return {
    agentId,
    conversationId: conversation.id,
    token: payload.cli.credential.content.token as string,
    system: payload.prompt.system as string,
    payload,
  };
}

async function manifestIds(token: string): Promise<string[]> {
  return (await h.manifest({ runToken: token })).commands.map(
    (item) => item.id,
  );
}

/** An issue of the project with an agent working on it: its run claimed, started and reporting two events. */
async function workedIssue(): Promise<{
  issue: Issue;
  runId: string;
  token: string;
}> {
  const coder = await h.createAgent({ name: 'Coder' });
  const issue = await h.projects.issues.create(h.viewer('alice'), {
    title: 'Faster lists',
    projectId,
  });
  const current = await h.projects.issueQueries.detail(
    h.viewer('alice'),
    issue.id,
  );
  await h.projects.issues.update(h.viewer('alice'), issue.id, {
    revision: current.revision,
    executor: { type: 'agent', id: coder },
  });
  const payload = await h.claimOne();
  const runId = payload.run.id as string;
  await h.runner(RUNNER_ROUTES.start, runId, {
    workDir: '/tmp/w',
    adapter: { kind: 'claude' },
    acceptsInput: true,
  });
  const first = payload.run.firstSeq as number;
  const at = new Date().toISOString();
  const events = await h.runner(RUNNER_ROUTES.events, runId, {
    events: [
      { seq: first, at, type: 'text', content: 'Reading the list code.' },
      {
        seq: first + 1,
        at,
        type: 'toolUse',
        tool: 'Bash',
        input: { command: 'pnpm test' },
      },
    ],
  });
  expect(events.status).toBe(200);
  return {
    issue,
    runId,
    token: payload.cli.credential.content.token as string,
  };
}

describe('reports in the CLI', () => {
  it('gives a person with the Reports page the same metrics and usage the page shows', async () => {
    const metrics = await h.request(
      'GET',
      '/reports/metrics?from=2026-09-01&to=2026-09-30',
      { user: 'alice' },
    );
    expect(metrics.status).toBe(200);
    expect(metrics.body.data).toMatchObject({
      from: '2026-09-01',
      to: '2026-09-30',
      subjects: true,
    });
    expect(metrics.body.meta.message).toContain(
      'Metrics 2026-09-01 to 2026-09-30',
    );
    const usage = await h.request('GET', '/reports/usage?groupBy=project', {
      user: 'alice',
    });
    expect(usage.status).toBe(200);
    expect(usage.body.data).toMatchObject({ groupBy: 'project' });
    expect(usage.body.meta.message).toContain('by project');

    const badDay = await h.request('GET', '/reports/metrics?from=yesterday', {
      user: 'alice',
    });
    expect(badDay.status).toBe(400);
  });

  it('offers them to a run only when its agent may read reports and the person who woke it holds the page', async () => {
    const run = await conversationRun();
    expect(await manifestIds(run.token)).toEqual(
      expect.arrayContaining(['report:metrics', 'report:usage']),
    );
    const metrics = await h.request('GET', '/reports/metrics', {
      runToken: run.token,
    });
    expect(metrics.status).toBe(200);
    const usage = await h.request('GET', '/reports/usage', {
      runToken: run.token,
    });
    expect(usage.status).toBe(200);
    expect(usage.body.data).toMatchObject({ groupBy: 'agent' });

    const plain = await conversationRun({
      actions: PM_ACTIONS.filter((key) => key !== 'studio.reports/read'),
    });
    expect(await manifestIds(plain.token)).not.toContain('report:metrics');
    expect(
      (await h.request('GET', '/reports/metrics', { runToken: plain.token }))
        .status,
    ).toBe(403);
    expect(
      (await h.request('GET', '/reports/usage', { runToken: plain.token }))
        .status,
    ).toBe(403);

    h.roles.set('alice', 'none');
    expect(await manifestIds(run.token)).not.toContain('report:metrics');
    expect(
      (await h.request('GET', '/reports/metrics', { runToken: run.token }))
        .status,
    ).toBe(403);
  });

  it('words the figures for a reader', () => {
    expect(
      metricsText({
        from: '2026-09-01',
        to: '2026-09-30',
        projectId: null,
        generatedAt: '2026-10-01T00:00:00.000Z',
        subjects: true,
        adoption: {
          activeWeeks: 4,
          activeDays: 20,
          issuesCreated: 30,
          commentsCreated: 90,
          activeMembers: 5,
        },
        aiShare: {
          share: 0.5,
          deliveredByAgent: 6,
          deliveredTotal: 12,
          byAgent: [],
        },
        trust: {
          reviewPassRate: 0.75,
          approvalApproveRate: null,
          reworkRate: 0.25,
        },
        reliability: {
          runs: 10,
          completedRuns: 8,
          failedRuns: 2,
          failuresByReason: {},
          claimLatencyP50Ms: 2_000,
          claimLatencyP95Ms: 9_000,
          runDurationP50Ms: 600_000,
          lostRuns: 0,
        },
        cost: {
          inputTokens: 1000,
          outputTokens: 500,
          estimatedCost: { USD: 1.5 },
          costPerDeliveredIssue: { USD: 0.125 },
          byAgent: [],
        },
        humanLoad: {
          decisionsCreated: 4,
          decisionsResolved: 3,
          decisionResolveP50Ms: 7_200_000,
          openDecisions: 1,
          byOutcome: {},
          byKind: {},
        },
        statuses: {
          aiShare: 'ok',
          reviewPassRate: 'ok',
          claimLatencyP50Ms: 'ok',
          lostRuns: 'ok',
          decisionResolveP50Ms: 'ok',
        },
      }),
    ).toBe(
      [
        'Metrics 2026-09-01 to 2026-09-30',
        'Adoption: 20 active days in 4 weeks, 5 people, 30 issues and 90 comments created.',
        'Delivered: 12 issues, 6 by agents (AI share 50%).',
        'Review: 75% passed, 25% sent back; approvals n/a approved.',
        'Runs: 10 started, 8 completed, 2 failed, 0 lost; median wait 2s, median run 10m.',
        'Cost: 1.50 USD (1000 input and 500 output tokens), 0.13 USD per delivered issue.',
        'Decisions: 4 asked, 3 decided (median 2.0h), 1 open.',
      ].join('\n'),
    );
    const row = {
      key: 'a-1',
      name: 'Coder',
      runs: 2,
      durationMs: 0,
      inputTokens: 10,
      outputTokens: 5,
      cacheReadTokens: 0,
      cacheWriteTokens: 0,
      reasoningTokens: 0,
      cost: null,
      pricedRuns: 0,
    };
    expect(
      usageText({
        from: '2026-09-01',
        to: '2026-09-30',
        groupBy: 'agent',
        rows: [row],
        totals: { ...row, key: 'total', name: null },
        daily: [],
        unpricedModels: ['opus'],
      }),
    ).toBe(
      [
        'Usage 2026-09-01 to 2026-09-30 by agent: 2 runs, 10 input and 5 output tokens, n/a.',
        '- Coder: 2 runs, 15 tokens, n/a',
        'Models without a price: opus.',
      ].join('\n'),
    );
  });
});

describe("an issue's runs in the CLI", () => {
  const runs = (issue: string, query = '') =>
    `/issueRuns?issue=${encodeURIComponent(issue)}${query}`;

  it('lists the runs the person may read, and reads one with its transcript', async () => {
    const { issue, runId } = await workedIssue();
    // Alice assigned the agent: the run is hers.
    const listed = await h.request('GET', runs(issue.identifier), {
      user: 'alice',
    });
    expect(listed.status).toBe(200);
    expect(listed.body.data).toEqual([
      expect.objectContaining({
        id: runId,
        agent: 'Coder',
        status: 'running',
        trigger: 'assigned',
      }),
    ]);

    const run = await h.request('GET', `/issueRuns/${runId}`, {
      user: 'alice',
    });
    expect(run.status).toBe(200);
    expect(run.body.data).toMatchObject({
      id: runId,
      agent: 'Coder',
      issue: { identifier: issue.identifier },
      status: 'running',
    });
    expect(run.body.meta.message).toContain(
      `Run ${runId} of Coder on ${issue.identifier} Faster lists: running`,
    );

    const events = await h.request(
      'GET',
      `/issueRuns/${runId}/events?pageSize=1`,
      { user: 'alice' },
    );
    expect(events.status).toBe(200);
    expect(events.body.data).toEqual([
      expect.objectContaining({
        type: 'toolUse',
        tool: 'Bash',
        input: { command: 'pnpm test' },
      }),
    ]);
    const from = await h.request('GET', `/issueRuns/${runId}/events?after=0`, {
      user: 'alice',
    });
    expect(from.body.data[0]).toMatchObject({
      type: 'text',
      text: 'Reading the list code.',
    });
    expect(from.body.meta).toEqual({ lastSeq: from.body.data[1].seq });
  });

  it('filters before paging, preserves the unfiltered default, and publishes a repeatable CLI flag', async () => {
    const { runId } = await workedIssue();
    const url = `/issueRuns/${runId}/events`;
    const initial = await h.request('GET', `${url}?after=0`, { user: 'alice' });
    const after = initial.body.meta.lastSeq as number;
    const at = new Date().toISOString();
    const appended = Array.from({ length: 198 }, (_, index) => ({
      seq: after + index + 1,
      at,
      type: index % 17 === 0 ? 'text' : index % 23 === 0 ? 'input' : 'toolUse',
      content: `Event ${index}`,
    }));
    expect(
      (await h.runner(RUNNER_ROUTES.events, runId, { events: appended }))
        .status,
    ).toBe(200);
    const all = await h.request('GET', `${url}?after=0&pageSize=200`, {
      user: 'alice',
    });
    expect(all.status).toBe(200);
    expect(all.body.data).toHaveLength(200);
    const expected = (all.body.data as { seq: number; type: string }[]).filter(
      (event) => ['text', 'input'].includes(event.type),
    );
    const seen: number[] = [];
    let cursor = 0;
    for (let page = 0; page < 20; page += 1) {
      const read = await h.request(
        'GET',
        `${url}?after=${cursor}&pageSize=3&type=text&type=input&type=text`,
        { user: 'alice' },
      );
      expect(read.status).toBe(200);
      const rows = read.body.data as { seq: number; type: string }[];
      expect(
        rows.every((event) => ['text', 'input'].includes(event.type)),
      ).toBe(true);
      seen.push(...rows.map((event) => event.seq));
      if (rows.length === 0) break;
      expect(read.body.meta.lastSeq).toBeGreaterThan(cursor);
      cursor = read.body.meta.lastSeq as number;
    }
    expect(seen).toEqual(expected.map((event) => event.seq));
    const newest = await h.request(
      'GET',
      `${url}?pageSize=3&type=text&type=input`,
      { user: 'alice' },
    );
    expect(newest.body.data.map((event: { seq: number }) => event.seq)).toEqual(
      expected.slice(-3).map((event) => event.seq),
    );
    const empty = await h.request(
      'GET',
      `${url}?after=${cursor}&type=thinking`,
      { user: 'alice' },
    );
    expect(empty.body.data).toEqual([]);
    expect(empty.body.meta.lastSeq).toBe(cursor);
    expect(
      (await h.request('GET', `${url}?type=unknown`, { user: 'alice' })).status,
    ).toBe(400);
    expect(
      (await h.request('GET', `${url}?type=`, { user: 'alice' })).status,
    ).toBe(400);
    const manifest = await h.manifest({ user: 'alice' });
    expect(
      manifest.commands.find((command) => command.id === 'run:events')
        ?.parameters,
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'type',
          type: 'string[]',
          required: false,
        }),
      ]),
    );
  });

  it('keeps filtered transcripts behind the same authentication and run visibility checks', async () => {
    const { runId } = await workedIssue();
    const url = `/issueRuns/${runId}/events?type=text`;
    expect((await h.request('GET', url)).status).toBe(401);
    expect((await h.request('GET', url, { user: 'bob' })).status).toBe(404);
    h.roles.set('bob', 'none');
    expect((await h.request('GET', url, { user: 'bob' })).status).toBe(403);
    expect((await h.request('GET', url, { user: 'alice' })).status).toBe(200);
    const blind = await conversationRun({ actions: ['pm.projects/view'] });
    expect(
      (await h.request('GET', url, { runToken: blind.token })).status,
    ).toBe(403);
  });

  it('hides other people’s runs unless the person may read agents, and every run off issues they see', async () => {
    const { issue, runId } = await workedIssue();
    // Bob sees the issue but did not start the run.
    const bobs = await h.request('GET', runs(issue.identifier), {
      user: 'bob',
    });
    expect(bobs.body).toEqual({
      data: [],
      meta: { message: `${issue.identifier} has no runs you may read.` },
    });
    expect(
      (await h.request('GET', `/issueRuns/${runId}`, { user: 'bob' })).status,
    ).toBe(404);
    // An administrator reads every run.
    const roots = await h.request('GET', `/issueRuns/${runId}`, {
      user: 'root',
    });
    expect(roots.status).toBe(200);
    // Someone without issues is refused.
    h.roles.set('bob', 'none');
    expect(
      (await h.request('GET', runs(issue.identifier), { user: 'bob' })).status,
    ).toBe(403);
  });

  it('lets the project manager read them for the person who asked', async () => {
    const { issue, runId } = await workedIssue();
    const run = await conversationRun();
    const listed = await h.request('GET', runs(issue.identifier), {
      runToken: run.token,
    });
    expect(listed.status).toBe(200);
    expect(listed.body.data.map((row: { id: string }) => row.id)).toContain(
      runId,
    );
    const events = await h.request('GET', `/issueRuns/${runId}/events`, {
      runToken: run.token,
    });
    expect(events.status).toBe(200);
    expect(events.body.data).toHaveLength(2);
    // A conversation's own run is not an issue's: not offered here, and it names no issue by default.
    const own = await h.request('GET', `/issueRuns/${run.payload.run.id}`, {
      runToken: run.token,
    });
    expect(own.status).toBe(404);
    expect(
      (await h.request('GET', '/issueRuns', { runToken: run.token })).status,
    ).toBe(400);
  });

  it('defaults to the run’s own issue, and refuses an agent that may not view issues', async () => {
    const { issue, runId, token } = await workedIssue();
    const own = await h.request('GET', '/issueRuns', { runToken: token });
    expect(own.status).toBe(200);
    expect(own.body.data.map((row: { id: string }) => row.id)).toEqual([runId]);
    const blind = await conversationRun({ actions: ['pm.projects/view'] });
    const refused = await h.request('GET', runs(issue.identifier), {
      runToken: blind.token,
    });
    expect(refused.status).toBe(403);
    expect(
      (
        await h.request('GET', `/issueRuns/${runId}`, {
          runToken: blind.token,
        })
      ).status,
    ).toBe(403);
  });
});

describe('who is asking', () => {
  it('tells a conversation run the person’s roles, projects, open work and waiting decisions', async () => {
    const mine = await h.projects.issues.create(h.viewer('alice'), {
      title: 'Write the release notes',
      projectId,
    });
    h.inbox.set('alice', [
      {
        id: 'n-1',
        kind: 'decision',
        type: 'approval_requested',
        title: 'Approve',
        body: '',
        read: false,
        pending: true,
        issueIdentifier: null,
        url: null,
        createdAt: new Date().toISOString(),
      },
    ]);
    const run = await conversationRun();
    expect(run.system).toContain('## Who is asking');
    expect(run.system).toContain('- Name: alice (user id alice)');
    expect(run.system).toContain('- Roles: Contributor');
    expect(run.system).toContain(`- Projects: Studio (${projectId}, lead)`);
    expect(run.system).toContain(
      '- Open work: owns 1 open issues (0 in progress), executes 0; 1 decisions wait on them in their inbox.',
    );
    expect(run.system).toContain(
      `  - ${mine.identifier} [todo] Write the release notes`,
    );
  });

  it('is not part of a run on an issue', async () => {
    const coder = await h.createAgent({ name: 'Coder' });
    const issue = await h.projects.issues.create(h.viewer('alice'), {
      title: 'Faster lists',
      projectId,
    });
    const current = await h.projects.issueQueries.detail(
      h.viewer('alice'),
      issue.id,
    );
    await h.projects.issues.update(h.viewer('alice'), issue.id, {
      revision: current.revision,
      executor: { type: 'agent', id: coder },
    });
    const payload = await h.claimOne();
    expect(payload.prompt.system).not.toContain('## Who is asking');
  });

  it('words a system administrator with no projects and no inbox', () => {
    const summary: AskerSummary = {
      userId: 'root',
      name: 'Root',
      roles: [],
      superuser: true,
      projects: [],
      ownedOpen: 0,
      ownedStarted: 0,
      executingOpen: 0,
      issues: [],
      pendingDecisions: null,
    };
    const text = askerSection(summary);
    expect(text).toContain('- Roles: system administrator');
    expect(text).toContain('- Projects: none they belong to');
    expect(text).toContain(
      '- Open work: owns 0 open issues (0 in progress), executes 0.',
    );
  });
});

describe('knowledge in a conversation', () => {
  beforeEach(async () => {
    const docs = h.knowledge!.docs;
    await docs.create(
      { userId: 'root' },
      {
        scope: 'system',
        scopeId: '',
        title: 'Team conventions',
        slug: 'conventions',
        summary: 'How we work.',
        content: '# Conventions\n\nSmall commits, reviewed the same day.',
      },
    );
    await docs.create(
      { userId: 'alice' },
      {
        scope: 'project',
        scopeId: projectId,
        title: 'Release checklist',
        slug: 'release-checklist',
        content: '# Release checklist\n\nTag the release after review.',
      },
    );
  });

  it('reads the system’s documents when the person named no project', async () => {
    const run = await conversationRun();
    expect(run.system).toContain('## Knowledge');
    expect(run.system).toContain(
      "Without `--project`, `nb-studio kb` reads the system's documents.",
    );
    expect(run.system).toContain(
      '- **Team conventions** (`conventions`, system-wide): How we work.',
    );
    expect(run.system).not.toContain('Release checklist');
    // No files: a conversation reads through the commands.
    expect(run.payload).not.toHaveProperty('mounts');
    expect(run.system).not.toContain('## Capture learnings');

    const hits = await h.request('GET', '/kb/search?q=release', {
      runToken: run.token,
    });
    expect(hits.status).toBe(200);
    expect(hits.body.data).toEqual([]);
    const named = await h.request(
      'GET',
      `/kb/search?q=release&projectId=${projectId}`,
      { runToken: run.token },
    );
    expect(named.body.data).toEqual([
      expect.objectContaining({ slug: 'release-checklist' }),
    ]);
  });

  it('reads the projects of the page the person was on, and the system’s', async () => {
    const issue = await h.projects.issues.create(h.viewer('alice'), {
      title: 'Ship 1.0',
      projectId,
    });
    const run = await conversationRun({
      context: [{ kind: 'issue', id: issue.id }],
    });
    expect(run.system).toContain(
      `the projects this conversation is about: Studio (\`${projectId}\`)`,
    );
    expect(run.system).toContain(
      '- **Release checklist** (`release-checklist`, project Studio): (no summary)',
    );
    expect(run.system).toContain(
      '- **Team conventions** (`conventions`, system-wide): How we work.',
    );

    const hits = await h.request('GET', '/kb/search?q=review', {
      runToken: run.token,
    });
    expect(hits.status).toBe(200);
    expect(
      hits.body.data.map((hit: { slug: string }) => hit.slug).sort(),
    ).toEqual(['conventions', 'release-checklist']);
    const read = await h.request('GET', '/kb/docs/release-checklist', {
      runToken: run.token,
    });
    expect(read.status).toBe(200);
    expect(read.body.meta.message).toContain('Tag the release after review.');
    const system = await h.request('GET', '/kb/docs/conventions', {
      runToken: run.token,
    });
    expect(system.status).toBe(200);
  });

  it('says nothing of knowledge to an agent not configured to read it', async () => {
    const run = await conversationRun({
      actions: PM_ACTIONS.filter((key) => !key.startsWith('kb.knowledge')),
    });
    expect(run.system).not.toContain('## Knowledge');
    expect(await manifestIds(run.token)).not.toContain('kb:search');
  });

  it('merges the hits of several spaces, each section once at its best score, best first', () => {
    const hit = (docId: string, line: number, score: number) => ({
      docId,
      kind: 'article' as const,
      slug: docId,
      title: docId,
      version: 1,
      scope: 'system' as const,
      scopeId: '',
      inherited: true,
      headingPath: [],
      anchor: null,
      lines: [line, line + 2] as const,
      excerpt: '',
      titleMatch: false,
      updatedAt: '2026-10-02T00:00:00.000Z',
      score,
    });
    expect(
      mergedHits(
        [
          [hit('a', 1, 0.02), hit('b', 1, 0.016)],
          [hit('a', 1, 0.03), hit('c', 4, 0.025)],
        ],
        2,
      ).map((item) => [item.docId, item.score]),
    ).toEqual([
      ['a', 0.03],
      ['c', 0.025],
    ]);
  });
});
