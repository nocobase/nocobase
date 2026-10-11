// @vitest-environment node
/**
 * An agent in a conversation managing work for the person who asked: it acts as them ("via ‹Agent›"), within what both
 * may do, changes at most two objects a turn directly and proposes operation plans for the rest, hears how its plans
 * were decided, and reads the page context the person sends as they see it.
 */
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import os from 'node:os';
import path from 'node:path';

import { CLI_ROUTES, EXIT_CODES, routePath } from '@nocobase/agent-protocol';
import type { Issue } from '@nocobase/app-plugin-projects/shared/issues';
import { Hono } from 'hono';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  runStudioCli,
  type StudioCliResult,
} from '../fixtures/nb-studio-cli.js';
import { createDirectWrites } from '../../server/agents/conversation/quota.js';
import {
  intakeMessage,
  intakeTitle,
} from '../../server/agents/conversation/intake.js';
import { projectRules } from '../../server/agents/conversation/rules.js';
import { createBridgeHarness, type BridgeHarness } from './bridge-harness.js';

let h: BridgeHarness;
beforeEach(async () => {
  h = await createBridgeHarness();
  for (const id of ['alice', 'bob', 'carol']) await h.addUser(id);
});
afterEach(() => h.close());

const alice = () => h.viewer('alice');

const cli = (id: string, ...args: string[]) =>
  `${routePath(CLI_ROUTES.command, { commandId: id }).slice('/api'.length)}${
    args.length > 0
      ? `?${args.map((arg) => `arg=${encodeURIComponent(arg)}`).join('&')}`
      : ''
  }`;

const PM_ACTIONS = [
  'pm.projects/view',
  'pm.issues/view',
  'pm.issues/create',
  'pm.issues/edit',
  'pm.issues/comment',
  'pm.issues/close',
  'pm.issues/change-owner',
];

interface ConversationRun {
  readonly agentId: string;
  readonly conversationId: string;
  readonly token: string;
  readonly runId: string;
  readonly payload: any;
}

/** A conversation of `user` with a new agent, its first message claimed by a runner. */
async function conversationRun(
  options: {
    readonly actions?: readonly string[];
    readonly user?: string;
    readonly source?: 'panel' | 'intake';
  } = {},
): Promise<ConversationRun> {
  const user = options.user ?? 'alice';
  const agentId = await h.createAgent({
    name: 'PM',
    actions: [...(options.actions ?? PM_ACTIONS)],
  });
  const conversation = await h.agents.conversations.create(user, {
    agentId,
    ...(options.source ? { source: options.source } : {}),
  });
  await h.agents.conversations.send(user, conversation.id, {
    content: 'Please tidy up my issues.',
  });
  const payload = await h.claimOne();
  return {
    agentId,
    conversationId: conversation.id,
    token: payload.cli.credential.content.token as string,
    runId: payload.run.id as string,
    payload,
  };
}

/** What a command of the CLI sends: an API route for most, the agents plugin's command endpoint for the rest. */
function command(
  run: Pick<ConversationRun, 'token'>,
  id: string,
  args: readonly string[] = [],
  body: Record<string, unknown> = {},
) {
  const runToken = run.token;
  const [first, second] = args.map(encodeURIComponent);
  switch (id) {
    case 'issue:get':
      return h.request('GET', `/projects/issues/${first}`, { runToken });
    case 'issue:search':
      return h.request(
        'GET',
        `/projects/issues?${new URLSearchParams(body as Record<string, string>).toString()}`,
        { runToken },
      );
    case 'issue:create':
      return h.request('POST', '/projects/issues', { runToken, body });
    case 'issue:update':
      return h.request('PATCH', `/projects/issues/${first}`, {
        runToken,
        body,
      });
    case 'issue:status:set':
      return h.request('PATCH', `/projects/issues/${first}`, {
        runToken,
        body: { statusKey: args[1] },
      });
    case 'issue:comment:add':
      return h.request('POST', `/projects/issues/${first}/comments`, {
        runToken,
        body,
      });
    case 'issue:dependency:add':
      return h.request('POST', `/projects/issues/${first}/dependencies`, {
        runToken,
        body: { dependsOnIssueId: args[1], ...body },
      });
    case 'project:list':
      return h.request('GET', '/projects', { runToken });
    case 'plan:create':
      return h.request('POST', '/projects/plans', { runToken, body });
    case 'plan:list':
      return h.request(
        'GET',
        `/projects/plans?${new URLSearchParams(body as Record<string, string>).toString()}`,
        { runToken },
      );
    case 'plan:get':
      return h.request('GET', `/projects/plans/${first}`, { runToken });
    case 'inbox:list':
      return h.request(
        'GET',
        `/inbox/items?${new URLSearchParams(body as Record<string, string>).toString()}`,
        { runToken },
      );
    default:
      void second;
      return h.request('POST', cli(id, ...args), { runToken, body });
  }
}

async function issue(title: string, viewer = alice()): Promise<Issue> {
  return h.projects.issues.create(viewer, { title });
}

async function activitiesOf(issueId: string) {
  return (await h.projects.issueQueries.activities(alice(), issueId, {})).data;
}

describe('a conversation run acts as the person who asked', () => {
  it('changes data as the asker, marked via the agent, its run and its conversation', async () => {
    const run = await conversationRun();
    const target = await issue('Fix login');
    const updated = await command(run, 'issue:update', [target.identifier], {
      priority: 'high',
    });
    expect(updated.status).toBe(200);
    expect(updated.body.data.issue).toMatchObject({ priority: 'high' });
    expect(updated.body.meta.directWrite.plan).toMatchObject({
      status: 'executed',
    });
    expect(updated.body.meta.message).toContain(
      `${target.identifier} changed directly`,
    );
    const planId = updated.body.meta.directWrite.plan.id as string;

    const change = (await activitiesOf(target.id)).find(
      (entry) => entry.via !== null,
    );
    expect(change).toMatchObject({
      actorType: 'user',
      actorId: 'alice',
      via: {
        type: 'agent',
        agentId: run.agentId,
        runId: run.runId,
        conversationId: run.conversationId,
        planId,
      },
    });

    const comment = await command(
      run,
      'issue:comment:add',
      [target.identifier],
      { content: 'Raised the priority, as asked.' },
    );
    expect(comment.status).toBe(201);
    expect(comment.body.data.comment).toMatchObject({
      content: 'Raised the priority, as asked.',
    });
    const [posted] = await h.projects.commentQueries.list(
      h.projects.tx.read(),
      target.id,
    );
    expect(posted).toMatchObject({
      authorType: 'user',
      authorId: 'alice',
      via: 'agent',
      content: 'Raised the priority, as asked.',
    });
    // The direct write is the asker's executed plan, which they may undo.
    const plan = await h.projects.plans.get(alice(), planId);
    expect(plan).toMatchObject({
      status: 'executed',
      source: { kind: 'directWrite' },
      proposer: { agentId: run.agentId, conversationId: run.conversationId },
      deciderUserId: 'alice',
    });
    expect(plan.undoableUntil).not.toBeNull();
  });

  it('may do only what both the asker and the agent may do', async () => {
    const viewOnly = await conversationRun({ actions: ['pm.issues/view'] });
    const target = await issue('Fix login');
    const refused = await command(
      viewOnly,
      'issue:update',
      [target.identifier],
      { priority: 'high' },
    );
    expect(refused.status).toBe(403);
    expect(
      (await command(viewOnly, 'issue:get', [target.identifier])).status,
    ).toBe(200);

    // Bob may not see alice's project, so neither may the agent he chats with.
    const hidden = await h.projects.projects.create(alice(), {
      name: 'Secret',
      visibility: 'members',
    });
    const secret = await h.projects.issues.create(alice(), {
      title: 'Hidden',
      projectId: hidden.id,
    });
    const bobs = await conversationRun({ user: 'bob' });
    const unseen = await command(bobs, 'issue:get', [secret.identifier]);
    expect(unseen.status).toBe(404);
    const search = await command(bobs, 'issue:search', [], { q: 'Hidden' });
    expect(search.body.data).toEqual([]);

    h.roles.set('bob', 'none');
    const none = await command(bobs, 'issue:get', [secret.identifier]);
    expect(none.status).toBe(403);
    expect(none.body.error.reason).toBe('RUN_ACTION_FORBIDDEN');
  });

  it('acts as the agent itself when it works on an issue', async () => {
    const agentId = await h.createAgent({ name: 'Coder' });
    const target = await issue('Fix login');
    const current = await h.projects.issueQueries.detail(alice(), target.id);
    await h.projects.issues.update(alice(), target.id, {
      revision: current.revision,
      executor: { type: 'agent', id: agentId },
    });
    const payload = await h.claimOne();
    const posted = await command(
      { token: payload.cli.credential.content.token },
      'issue:comment:add',
      [target.identifier],
      { content: 'On it.' },
    );
    expect(posted.status).toBe(201);
    expect(posted.body.data.comment).toMatchObject({
      authorType: 'agent',
      authorId: agentId,
      via: null,
    });
  });

  it('tells the agent the rules of acting for the person', async () => {
    const run = await conversationRun();
    const system: string = run.payload.prompt.system;
    expect(system).toContain('You act for alice');
    expect(system).toContain('Projects and issues, for alice:');
    expect(system).toContain('exit code 7 (`PLAN_REQUIRED`');
    expect(system).toContain('nb-studio plan create --file plan.json');
    expect(system).toContain('Never hand the work to another agent');
    // Studio's rules, in the agents plugin's list.
    expect(system).toContain(
      '- Do not post comments on issues to answer the person: answer in the conversation.\n- Who executes an issue is changed only through an operation plan the person confirms.',
    );
    expect(system).not.toContain('Requirement intake:');
    expect(
      projectRules({
        ownerName: 'alice',
        cli: 'nb-studio',
        confirmChanges: 'always',
        intake: true,
      })
        .flat()
        .join('\n'),
    ).toMatch(/ask alice before every change[\s\S]*Requirement intake:/u);
  });
});

describe('the direct-write quota', () => {
  it('allows two distinct objects a turn and asks for a plan for the third', async () => {
    const run = await conversationRun();
    const [a, b, c] = [
      await issue('A'),
      await issue('B'),
      await issue('C'),
    ] as const;
    const update = (target: Issue, priority: string) =>
      command(run, 'issue:update', [target.identifier], { priority });

    expect((await update(a, 'high')).status).toBe(200);
    // A comment counts on its issue: still one object.
    const commented = await command(run, 'issue:comment:add', [a.identifier], {
      content: 'Done.',
    });
    expect(commented.body.meta.directWrite.quota).toEqual({ used: 1 });
    expect((await update(b, 'low')).body.meta.directWrite.quota).toEqual({
      used: 2,
    });

    const third = await update(c, 'urgent');
    expect(third.status).toBe(400);
    expect(third.body.error).toMatchObject({
      reason: 'PLAN_REQUIRED',
      metadata: { reasons: ['quota'], quota: { used: 2, limit: 2 } },
    });
    expect(
      (await h.projects.issueQueries.detail(alice(), c.id)).priority,
    ).not.toBe('urgent');
    // The same objects again are fine; a new issue is a third object.
    expect((await update(a, 'medium')).status).toBe(200);
    const created = await command(run, 'issue:create', [], { title: 'D' });
    expect(created.body.error.metadata.reasons).toEqual(['quota']);
    // Refused writes leave no plan behind.
    expect(
      (await h.projects.plans.list(alice(), { status: 'open' })).data,
    ).toEqual([]);
  });

  it('counts a new turn afresh', async () => {
    const first = await conversationRun();
    for (const title of ['A', 'B'])
      expect((await command(first, 'issue:create', [], { title })).status).toBe(
        201,
      );
    const second = await conversationRun();
    expect(
      (await command(second, 'issue:create', [], { title: 'C' })).status,
    ).toBe(201);
  });

  it('asks for a plan for what needs the person: final status, owner, agent executor, waking an agent', async () => {
    const run = await conversationRun();
    const target = await issue('A');
    const done = await command(run, 'issue:status:set', [
      target.identifier,
      'done',
    ]);
    expect(done.status).toBe(400);
    expect(done.body.error.metadata.reasons).toEqual(['finalStatus']);

    const owned = await command(run, 'issue:create', [], {
      title: 'For bob',
      ownerUserId: 'bob',
    });
    expect(owned.body.error.metadata.reasons).toEqual(['ownerChange']);

    const agentId = await h.createAgent({ name: 'Coder' });
    const toAgent = await command(run, 'issue:create', [], {
      title: 'For the coder',
      executor: { type: 'agent', id: agentId },
    });
    expect(toAgent.status).toBe(400);
    expect(toAgent.body.error.metadata.reasons).toEqual([
      'startsRun',
      'agentExecutor',
    ]);
    expect(toAgent.body.error.metadata.wakes).toEqual([
      expect.objectContaining({ principalId: agentId, started: true }),
    ]);

    // A person as the executor, or none, is fine.
    const toBob = await command(run, 'issue:create', [], {
      title: 'For bob to do',
      executor: { type: 'user', id: 'bob' },
    });
    expect(toBob.status).toBe(201);

    // A comment on an issue an agent executes would wake it.
    const busy = await h.projects.issues.create(alice(), {
      title: 'Busy',
      executor: { type: 'agent', id: agentId },
      start: false,
    });
    const comment = await command(run, 'issue:comment:add', [busy.identifier], {
      content: 'How is it going?',
    });
    expect(comment.status).toBe(400);
    expect(comment.body.error.metadata.reasons).toEqual(['startsRun']);
    expect(
      await h.agents.runs.list({ subjectKind: 'issue', subjectId: busy.id }),
    ).toEqual([]);
  });

  it('asks for a plan for everything when the agent is set to confirm every change', async () => {
    const run = await conversationRun();
    const agent = await h.agents.agents.get(run.agentId);
    await h.agents.agents.update(run.agentId, 'alice', {
      confirmChanges: 'always',
      expectedRevision: agent.revision,
    });
    const target = await issue('A');
    const refused = await command(run, 'issue:update', [target.identifier], {
      priority: 'high',
    });
    expect(refused.status).toBe(400);
    expect(refused.body.error.metadata.reasons).toEqual(['alwaysConfirm']);
    expect(run.payload.prompt.system).not.toContain('before every change');
  });

  it('asks for a plan to create a project', async () => {
    const run = await conversationRun();
    const direct = createDirectWrites({
      agents: h.agents,
      projects: () => h.projects,
    });
    await expect(
      direct.write(
        {
          conversation: {
            id: run.conversationId,
            userId: 'alice',
            agentId: run.agentId,
            title: null,
            source: 'panel',
          },
          userId: 'alice',
          runId: run.runId,
          agentId: run.agentId,
          agentName: 'PM',
          confirmChanges: 'larger',
        },
        alice(),
        {
          title: 'New project',
          rows: [{ op: 'project.create', params: { name: 'Checkout' } }],
        },
      ),
    ).rejects.toMatchObject({
      code: 'PLAN_REQUIRED',
      details: { reasons: ['createsProject'] },
    });
  });

  it('never lets two writes sent at once pass the quota together', async () => {
    const run = await conversationRun();
    const [a, b, c] = [
      await issue('A'),
      await issue('B'),
      await issue('C'),
    ] as const;
    expect(
      (
        await command(run, 'issue:update', [a.identifier], {
          priority: 'high',
        })
      ).status,
    ).toBe(200);
    const results = await Promise.all(
      [b, c].map((target) =>
        command(run, 'issue:update', [target.identifier], { priority: 'low' }),
      ),
    );
    expect(results.map((result) => result.status).sort()).toEqual([200, 400]);
    expect(
      results.find((result) => result.status === 400)?.body.error.metadata
        .reasons,
    ).toEqual(['quota']);
    const lows = [];
    for (const target of [b, c])
      if (
        (await h.projects.issueQueries.detail(alice(), target.id)).priority ===
        'low'
      )
        lows.push(target.id);
    expect(lows).toHaveLength(1);
    const ledger = await h.database
      .connection()
      .repository<{ objectKey: string }>('studioDirectWrites')
      .findMany({ filter: { runId: run.runId } });
    expect(new Set(ledger.map((row) => row.objectKey)).size).toBe(2);
    // The refused write's plan was voided, not left open.
    expect(
      (await h.projects.plans.list(alice(), { status: 'open' })).data,
    ).toEqual([]);
  });
});

describe('the nb-studio CLI', () => {
  let server: Server | undefined;
  let dir: string | undefined;
  afterEach(async () => {
    await new Promise((resolve) =>
      server ? server.close(resolve) : resolve(null),
    );
    server = undefined;
    if (dir) rmSync(dir, { recursive: true, force: true });
    dir = undefined;
  });

  /** The harness's API under `/api` on a local port, as the CLI reaches a server. */
  async function serve(): Promise<string> {
    const outer = new Hono();
    outer.route('/api', h.app);
    server = createServer(async (req, res) => {
      const chunks: Buffer[] = [];
      for await (const chunk of req) chunks.push(chunk as Buffer);
      const body = Buffer.concat(chunks);
      const response = await outer.fetch(
        new Request(`http://localhost${req.url}`, {
          method: req.method,
          headers: req.headers as Record<string, string>,
          ...(body.length > 0 ? { body } : {}),
        }),
      );
      res.writeHead(response.status, Object.fromEntries(response.headers));
      res.end(Buffer.from(await response.arrayBuffer()));
    });
    await new Promise<void>((resolve) =>
      server!.listen(0, '127.0.0.1', resolve),
    );
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('No port.');
    return `http://127.0.0.1:${address.port}`;
  }

  function studio(
    args: readonly string[],
    cwd: string,
  ): Promise<StudioCliResult> {
    return runStudioCli(args, {
      cwd,
      env: { NB_STUDIO_HOME: path.join(cwd, '.home') },
    });
  }

  it('exits with the plan-required code on the third object, and proposes the plan from a file', async () => {
    const run = await conversationRun();
    const [a, b, c] = [
      await issue('A'),
      await issue('B'),
      await issue('C'),
    ] as const;
    const origin = await serve();
    dir = mkdtempSync(path.join(os.tmpdir(), 'studio-pm-'));
    mkdirSync(path.join(dir, '.nb-studio'));
    writeFileSync(
      path.join(dir, '.nb-studio', 'run.json'),
      JSON.stringify({
        ...run.payload.cli.credential.content,
        server: origin,
        manifestUrl: '/api/cli/manifest',
      }),
    );
    writeFileSync(path.join(dir, 'change.json'), '{"priority": "high"}');

    for (const target of [a, b]) {
      const done = await studio(
        ['issue', 'update', target.identifier, '--file', 'change.json'],
        dir,
      );
      expect(done.stderr).toBe('');
      expect(done.code).toBe(0);
    }
    const third = await studio(
      ['issue', 'update', c.identifier, '--file', 'change.json'],
      dir,
    );
    expect(third.code).toBe(EXIT_CODES.planRequired);
    expect(third.stderr).toContain('PLAN_REQUIRED');

    writeFileSync(
      path.join(dir, 'plan.json'),
      JSON.stringify({
        title: 'Raise C',
        rows: [
          {
            op: 'issue.update',
            params: { issue: c.identifier, set: { priority: 'high' } },
          },
        ],
      }),
    );
    const proposed = await studio(
      ['plan', 'create', '--file', 'plan.json', '--json'],
      dir,
    );
    expect(proposed.code).toBe(0);
    expect(JSON.parse(proposed.stdout).result.data).toMatchObject({
      status: 'pending',
      source: {
        kind: 'conversation',
        key: `conversation:${run.conversationId}`,
      },
    });
  });
});

describe('plans proposed in a conversation', () => {
  it('waits for the person, and wakes the conversation with the result once they execute it', async () => {
    const run = await conversationRun();
    const [a, b, c] = [
      await issue('A'),
      await issue('B'),
      await issue('C'),
    ] as const;
    const proposed = await command(run, 'plan:create', [], {
      title: 'Raise the three',
      description: 'They block the release.',
      rows: [a, b, c].map((target) => ({
        op: 'issue.update',
        params: { issue: target.identifier, set: { priority: 'high' } },
      })),
    });
    expect(proposed.status).toBe(201);
    expect(proposed.body.data).toMatchObject({
      status: 'pending',
      source: {
        kind: 'conversation',
        key: `conversation:${run.conversationId}`,
      },
      deciderUserId: 'alice',
    });
    expect(proposed.body.meta.message).toContain(
      'waiting for them to execute it',
    );
    const planId = proposed.body.data.id as string;
    // Proposing changes nothing yet, and counts nothing against the quota.
    expect(
      (await h.projects.issueQueries.detail(alice(), a.id)).priority,
    ).not.toBe('high');
    const listed = await command(run, 'plan:list', [], { status: 'open' });
    expect(listed.body.data.map((plan: any) => plan.id)).toEqual([planId]);

    const plan = await h.projects.plans.get(alice(), planId);
    expect(plan.proposer).toMatchObject({
      agentId: run.agentId,
      runId: run.runId,
      conversationId: run.conversationId,
    });
    const executed = await h.projects.plans.execute(alice(), planId, {
      revision: plan.revision,
    });
    expect(executed.status).toBe('executed');

    const detail = await h.agents.runs.detail(run.runId);
    const decided = detail.inputs.find((input) => input.type === 'planDecided');
    expect(decided).toMatchObject({
      actor: { kind: 'user', id: 'alice' },
      payload: {
        trigger: 'planDecided',
        planId,
        outcome: 'executed',
        rows: [
          expect.objectContaining({ op: 'issue.update', ok: true }),
          expect.anything(),
          expect.anything(),
        ],
      },
    });
    expect(decided!.text).toContain('it was executed');
    expect(decided!.text).toContain(`on ${a.identifier} A`);
    const messages = await h.agents.conversations.messages(
      'alice',
      run.conversationId,
      {},
    );
    expect(messages.items.at(-1)).toMatchObject({
      role: 'system',
      metadata: {
        notice: {
          code: 'news',
          type: 'planDecided',
          title: 'The plan "Raise the three" was executed.',
          params: { planId, outcome: 'executed', title: 'Raise the three' },
        },
      },
    });
  });

  it("lists this conversation's plans by default, and every plan of the person with all", async () => {
    const run = await conversationRun();
    const target = await issue('A');
    await h.projects.plans.create(alice(), {
      title: 'Elsewhere',
      source: { kind: 'manual', key: 'manual:1' },
      rows: [
        {
          op: 'issue.update',
          params: { issue: target.identifier, set: { priority: 'low' } },
        },
      ],
    });
    const proposed = await command(run, 'plan:create', [], {
      title: 'Here',
      rows: [
        {
          op: 'issue.update',
          params: { issue: target.identifier, set: { priority: 'high' } },
        },
      ],
    });
    const mine = await command(run, 'plan:list');
    expect(mine.body.data.map((plan: any) => plan.title)).toEqual(['Here']);
    const all = await command(run, 'plan:list', [], { all: 'true' });
    expect(all.body.data.map((plan: any) => plan.title).sort()).toEqual([
      'Elsewhere',
      'Here',
    ]);
    const got = await command(run, 'plan:get', [proposed.body.data.id]);
    expect(got.status).toBe(200);
    expect(got.body.data.title).toBe('Here');
  });

  it('refuses a plan from an agent working on an issue, and asks a person for its source', async () => {
    const agentId = await h.createAgent({ actions: PM_ACTIONS });
    const target = await issue('Fix login');
    const current = await h.projects.issueQueries.detail(alice(), target.id);
    await h.projects.issues.update(alice(), target.id, {
      revision: current.revision,
      executor: { type: 'agent', id: agentId },
    });
    const payload = await h.claimOne();
    const rows = [
      {
        op: 'issue.update',
        params: { issue: target.identifier, set: { priority: 'high' } },
      },
    ];
    const refused = await command(
      { token: payload.cli.credential.content.token as string },
      'plan:create',
      [],
      { title: 'Raise', rows },
    );
    expect(refused.status).toBe(403);
    expect(refused.body.error.reason).toBe('PLAN_SOURCE_FORBIDDEN');

    const unsourced = await h.request('POST', '/projects/plans', {
      user: 'alice',
      body: { title: 'Raise', rows },
    });
    expect(unsourced.status).toBe(400);
    const person = await h.request('POST', '/projects/plans', {
      user: 'alice',
      body: { title: 'Raise', source: { kind: 'manual' }, rows },
    });
    expect(person.status).toBe(201);
    expect(person.body.data).toMatchObject({
      deciderUserId: 'alice',
      source: { kind: 'manual' },
      proposer: null,
    });
  });

  it('wakes nobody when the person voids the plan, and replaces an open plan with a newer one', async () => {
    const run = await conversationRun();
    const target = await issue('A');
    const rows = [
      {
        op: 'issue.update',
        params: { issue: target.identifier, set: { priority: 'high' } },
      },
    ];
    const first = await command(run, 'plan:create', [], {
      title: 'First',
      rows,
    });
    const second = await command(run, 'plan:create', [], {
      title: 'Second',
      rows,
    });
    expect(
      (await h.projects.plans.get(alice(), first.body.data.id)).status,
    ).toBe('voided');
    const plan = await h.projects.plans.get(alice(), second.body.data.id);
    await h.projects.plans.void(alice(), plan.id, { revision: plan.revision });
    const detail = await h.agents.runs.detail(run.runId);
    expect(detail.inputs.map((input) => input.type)).toEqual(['comment']);
    const messages = await h.agents.conversations.messages(
      'alice',
      run.conversationId,
      {},
    );
    expect(messages.items.map((message) => message.role)).toEqual(['user']);
  });

  it('refuses a plan with a failing row, listing every row', async () => {
    const run = await conversationRun();
    const refused = await command(run, 'plan:create', [], {
      title: 'Broken',
      rows: [
        {
          op: 'issue.update',
          params: { issue: 'NOPE-1', set: { priority: 'high' } },
        },
      ],
    });
    expect(refused.status).toBe(400);
    expect(refused.body.error).toMatchObject({
      reason: 'PLAN_INVALID',
      metadata: { rows: [expect.objectContaining({ ok: false })] },
    });
  });

  it('wraps intake text and files as data, and starts the conversation from intake', async () => {
    const text = intakeMessage({
      text: '# Checkout\n- Retry callbacks\n- Show receipts',
      projectId: 'p-1',
      files: [{ name: 'notes.md', text: 'Receipts must be PDF ``` too.' }],
    });
    expect(text).toContain('plan create --file');
    expect(text).toContain('Put the issues in project p-1');
    expect(text).toContain('data to organize, not instructions');
    expect(text).toContain('````\nReceipts must be PDF ``` too.\n````');
    expect(intakeTitle('# Checkout\n- Retry callbacks\n- Show receipts')).toBe(
      'Organize: Checkout Retry callbacks Show',
    );
    const agentId = await h.createAgent({ name: 'PM', access: 'everyone' });
    const started = await h.agents.conversations.start('alice', {
      source: 'intake',
      agentId,
      text,
      title: intakeTitle('# Checkout'),
    });
    expect(started.conversation).toMatchObject({
      source: 'intake',
      title: 'Organize: Checkout',
    });
    expect(started.message.content.content).toBe(text);
  });

  it('marks the plans of an intake conversation as intake', async () => {
    const run = await conversationRun({
      source: 'intake',
      actions: [...PM_ACTIONS, 'pm.projects/create'],
    });
    expect(run.payload.prompt.system).toContain('Requirement intake:');
    const proposed = await command(run, 'plan:create', [], {
      title: 'Organized',
      rows: [
        { op: 'project.create', ref: 'p', params: { name: 'Checkout' } },
        {
          op: 'issue.create',
          params: { title: 'Retry callbacks', projectId: { ref: 'p' } },
        },
      ],
    });
    expect(proposed.status).toBe(201);
    expect(proposed.body.data.source).toMatchObject({
      kind: 'intake',
      key: `conversation:${run.conversationId}`,
    });
  });

  it('names the conversation, and keeps the title the person gave', async () => {
    const run = await conversationRun();
    const title = (value: string) =>
      h.request('PATCH', '/agents/runs/current/conversation', {
        runToken: run.token,
        body: { title: value },
      });
    const named = await title('Tidy issues');
    expect(named.status).toBe(200);
    expect(
      (await h.agents.conversations.get('alice', run.conversationId)).title,
    ).toBe('Tidy issues');
    await h.agents.conversations.update('alice', run.conversationId, {
      title: 'Mine',
    });
    const locked = await title('Other');
    expect(locked.status).toBe(400);
    expect(locked.body.error.metadata).toMatchObject({ reason: 'titleLocked' });
  });
});

describe('reading for the person', () => {
  it('searches issues, lists projects, the roster and the inbox', async () => {
    const run = await conversationRun();
    await issue('Retry callbacks');
    await issue('Show receipts');
    const found = await command(run, 'issue:search', [], { q: 'Retry' });
    expect(found.body.data).toEqual([
      expect.objectContaining({ title: 'Retry callbacks', statusKey: 'todo' }),
    ]);
    await h.projects.projects.create(alice(), { name: 'Checkout' });
    const projects = await command(run, 'project:list');
    expect(projects.body.data).toEqual([
      expect.objectContaining({
        name: 'Checkout',
        issueCounts: expect.objectContaining({ total: 0 }),
      }),
    ]);
    await h.createAgent({ name: 'Designer', description: 'Good at CSS.' });
    await h.createAgent({
      name: 'Bobs',
      access: 'ownerOnly',
      ownerUserId: 'bob',
    });
    const roster = await h.request('GET', '/agents/available', {
      runToken: run.token,
    });
    expect(roster.body.data.map((agent: any) => agent.name).sort()).toEqual([
      'Designer',
      'PM',
    ]);
    expect(
      roster.body.data.find((agent: any) => agent.name === 'Designer'),
    ).toMatchObject({ goodAt: 'Good at CSS.', online: true, busy: 0 });

    h.inbox.set('alice', [
      {
        id: 'n1',
        kind: 'decision',
        type: 'approval_requested',
        title: 'Approve PM-1',
        body: 'Bob asks to close PM-1.',
        read: false,
        pending: true,
        issueIdentifier: 'PM-1',
        url: '/issues/PM-1',
        createdAt: new Date().toISOString(),
      },
    ]);
    const inbox = await command(run, 'inbox:list', [], { unread: 'true' });
    expect(inbox.body.data).toEqual([
      expect.objectContaining({ id: 'n1', pending: true, issue: 'PM-1' }),
    ]);
  });

  it('resolves the page context as the person sees it', async () => {
    const agentId = await h.createAgent({ name: 'PM', actions: PM_ACTIONS });
    const visible = await issue('Visible');
    const hidden = await h.projects.projects.create(alice(), {
      name: 'Secret',
      visibility: 'members',
    });
    const secret = await h.projects.issues.create(alice(), {
      title: 'Hidden',
      projectId: hidden.id,
    });
    const open = await h.projects.projects.create(alice(), {
      name: 'Open',
    });
    h.inbox.set('bob', [
      {
        id: 'mine',
        kind: 'info',
        type: 'commented',
        title: 'A comment on PM-1',
        body: '',
        read: true,
        pending: false,
        issueIdentifier: visible.identifier,
        url: `/issues/${visible.identifier}`,
        createdAt: new Date().toISOString(),
      },
    ]);
    const conversation = await h.agents.conversations.create('bob', {
      agentId,
    });
    const sent = await h.agents.conversations.send('bob', conversation.id, {
      content: 'What about these?',
      context: {
        route: '/issues',
        items: [
          { kind: 'issue', id: visible.identifier },
          { kind: 'issue', id: secret.id },
          { kind: 'project', id: open.id },
          { kind: 'project', id: hidden.id },
          { kind: 'inboxItem', id: 'mine' },
          { kind: 'inboxItem', id: 'alices' },
        ],
      },
    });
    expect(sent.message.workContext).toMatchObject({
      items: [
        {
          kind: 'issue',
          id: visible.identifier,
          title: 'Visible',
          key: visible.identifier,
          url: `/issues/${visible.identifier}`,
        },
        {
          kind: 'project',
          id: open.id,
          title: 'Open',
          url: `/projects/${open.id}`,
        },
        {
          kind: 'inboxItem',
          id: 'mine',
          title: 'A comment on PM-1',
          key: visible.identifier,
        },
      ],
      dropped: 3,
    });
  });
});
