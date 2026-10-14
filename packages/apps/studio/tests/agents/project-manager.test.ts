// @vitest-environment node
/**
 * The project manager (`server/agents/manager/`): its settings at `/projectManager`, handing it an issue to go on
 * (`/projectManager/issues/:issueId/start`), what an issue waits for (`/issueProgress/:issueId`), when it is woken, the
 * statuses it may move an issue between, and the comment run limit with its continuation (`/issueCommentRuns`).
 */
import { RUNNER_ROUTES } from '@nocobase/agent-protocol';
import identitySeed from '../../database/main/seeds/202610250010_studio_project_manager_identity.js';
import type { Issue } from '@nocobase/app-plugin-projects/shared/issues';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { API } from '../git/helpers.js';
import {
  ensureRepo,
  insertLink,
  upsertPullRequest,
} from '../../server/git/store.js';
import { BUILT_IN_PRINCIPLES } from '../../server/agents/manager/texts.js';
import {
  DEFAULT_COMMENT_RUN_LIMIT,
  PROJECT_MANAGER_ID,
} from '../../shared/project-manager.js';
import { createBridgeHarness, type BridgeHarness } from './bridge-harness.js';

let h: BridgeHarness;
let coder: string;
let planned: { type: string; [key: string]: unknown }[];
beforeEach(async () => {
  h = await createBridgeHarness();
  planned = [];
  h.projects.events.on('notice.planned', (event) => {
    planned.push(event.notice as never);
  });
  for (const id of ['alice', 'bob', 'root']) await h.addUser(id);
  h.roles.set('root', 'admin');
  coder = await h.createAgent({
    name: 'Coder',
    description: 'Implements changes well.',
  });
});
afterEach(() => h.close());

const alice = () => h.viewer('alice');
const asAgent = (agentId: string) => ({
  ...alice(),
  actor: { type: 'agent', id: agentId },
});
const MANAGED = { type: 'agent', id: PROJECT_MANAGER_ID } as const;

const create = (input: Record<string, unknown> = {}) =>
  h.projects.issues.create(alice(), { title: 'Export the list', ...input });

async function update(
  issue: Issue,
  patch: Record<string, unknown>,
  viewer = alice(),
): Promise<Issue> {
  const current = await h.projects.issueQueries.detail(alice(), issue.id);
  return h.projects.issues.update(viewer as never, issue.id, {
    revision: current.revision,
    ...patch,
  });
}

const runsOf = (issueId: string) =>
  h.agents.runs.list({ subjectKind: 'issue', subjectId: issueId });

async function triggersOf(issueId: string): Promise<string[]> {
  const triggers: string[] = [];
  for (const run of await runsOf(issueId))
    for (const input of (await h.agents.runs.detail(run.id)).inputs)
      triggers.push(
        String((input.payload as { trigger?: unknown } | null)?.trigger),
      );
  return triggers;
}

/** The harness runner takes the next run and starts it: it counts as executed. */
async function claimAndStart(): Promise<string> {
  const payload = await h.claimOne();
  const runId = payload.run.id as string;
  await h.runner(RUNNER_ROUTES.start, runId, {
    workDir: '/tmp/w',
    adapter: { kind: 'claude' },
    acceptsInput: true,
  });
  return runId;
}

const progress = async (issueId: string) => {
  const answer = await h.request('GET', `/issueProgress/${issueId}`, {
    user: 'alice',
  });
  expect(answer.status).toBe(200);
  return answer.body.data;
};

describe('the project manager’s settings', () => {
  it('shows current identities on old comments, activities, executors and completed runs after Chinese upgrade and two renames', async () => {
    const issue = await create();
    const comment = await h.projects.comments.create(
      asAgent(PROJECT_MANAGER_ID),
      issue.id,
      { content: 'Historical Project manager body' },
    );
    const queued = await h.agents.runs.enqueue({
      agentId: PROJECT_MANAGER_ID,
      subject: { kind: 'issue', id: issue.id },
      actorUserId: 'alice',
      input: {
        type: 'comment',
        actor: {
          kind: 'agent',
          id: PROJECT_MANAGER_ID,
          name: 'Project manager',
        },
        text: 'Historical Project manager input',
      },
    });
    const conn = h.database.connection();
    await conn.query
      .updateTable('agRuns')
      .set({ status: 'completed' })
      .where('id', '=', queued.runId)
      .execute();
    await conn.query
      .updateTable('studioSettings')
      .set({
        value: JSON.stringify({
          firstChoiceAgentId: coder,
          unknown: 'preserved',
        }),
      })
      .where('key', '=', 'projectManager')
      .execute();
    await identitySeed.run({
      query: conn.query,
      repository: (name: string) => conn.repository(name),
      config: { get: () => 'zh-CN' },
    } as never);
    await h.manager.sync();
    for (const name of ['项目经理', 'Team lead', '负责人']) {
      if (name !== '项目经理') await h.manager.update('root', { name });
      const comments = await h.request(
        'GET',
        `/projects/issues/${issue.id}/comments`,
        { user: 'alice' },
      );
      expect(comments.body.data[0].root).toMatchObject({
        authorName: name,
        content: 'Historical Project manager body',
      });
      expect(
        (await h.projects.issueQueries.detail(alice(), issue.id)).executorName,
      ).toBe(name);
      const activities = (
        await h.projects.issueQueries.activities(alice(), issue.id, {})
      ).data.filter((activity) => activity.actorId === PROJECT_MANAGER_ID);
      expect(activities.length).toBeGreaterThan(0);
      expect(activities.every((activity) => activity.actorName === name)).toBe(
        true,
      );
      const run = await h.request('GET', `/issueRuns/${queued.runId}`, {
        user: 'root',
      });
      expect(run.status).toBe(200);
      expect(run.body.data.inputs[0].actor).toBe(name);
      expect(
        (await h.agents.runs.detail(queued.runId)).inputs[0].actor.name,
      ).toBe(name);
    }
    expect(comment.comment.content).toBe('Historical Project manager body');
    const stored = await conn.query
      .selectFrom('agRunInputs')
      .select('actorName')
      .where('runId', '=', queued.runId)
      .executeTakeFirstOrThrow();
    expect(stored.actorName).toBe('Project manager');
    const settings = await conn
      .repository('studioSettings')
      .findOne({ filter: { key: 'projectManager' } });
    const raw =
      typeof settings?.value === 'string'
        ? (JSON.parse(settings.value) as Record<string, unknown>)
        : settings?.value;
    expect(raw).toMatchObject({ unknown: 'preserved' });
  });
  it('keeps renamed identities and cleared descriptions through repeated saves and startup', async () => {
    await h.manager.update('root', {
      fallbackAfterSeconds: 137,
      delegationQueueTimeoutSeconds: 731,
    });
    for (const name of ['Team lead', '项目负责人']) {
      const result = await h.request('PATCH', '/projectManager', {
        user: 'root',
        body: { name: ` ${name} `, description: '' },
      });
      expect(result.status).toBe(200);
      expect(result.body.data).toMatchObject({ name, description: null });
      await h.manager.ready();
      await h.request('PATCH', '/projectManager', {
        user: 'root',
        body: { commentRunLimit: 10 },
      });
      expect(await h.agents.agents.get(PROJECT_MANAGER_ID)).toMatchObject({
        name,
        description: null,
        nameText: null,
      });
      expect((await h.agents.agents.get(coder)).name).toBe('Coder');
      expect(await h.manager.settings()).toMatchObject({
        fallbackAfterSeconds: 137,
        delegationQueueTimeoutSeconds: 731,
      });
    }
    for (const description of [null, '', '   ']) {
      expect(
        (
          await h.request('PATCH', '/projectManager', {
            user: 'root',
            body: { description },
          })
        ).body.data.description,
      ).toBeNull();
      await h.manager.ready();
      expect((await h.manager.settings()).description).toBeNull();
    }
    for (const name of [null, '', '  ', 'a'.repeat(201)])
      expect(
        (
          await h.request('PATCH', '/projectManager', {
            user: 'root',
            body: { name },
          })
        ).status,
      ).toBe(400);
    expect(
      (
        await h.request('PATCH', '/projectManager', {
          user: 'root',
          body: { description: 'a'.repeat(10_001) },
        })
      ).status,
    ).toBe(400);
  });
  it('keeps six enabled configurations and settings through repeated startup synchronization', async () => {
    const ids: string[] = [];
    const models = [
      'claude-fable-5-1',
      'claude-opus-5-5',
      'claude-sonnet-5',
      'gpt-6.1-sol',
      'gpt-6-astra',
      'gpt-6-luna',
    ];
    for (let i = 0; i < 6; i += 1)
      ids.push(
        await h.createAgent({
          name: `Fixture ${i}`,
          description: `Description ${i}`,
          tool: i < 3 ? 'claude' : 'codex',
          model: models[i]!,
          modelEntries: [
            {
              tool: i < 3 ? 'claude' : 'codex',
              model: models[i]!,
              effort: 'high',
            },
          ],
          instructions: `Retained fixture instructions ${i}`,
        }),
      );
    await h.manager.update('root', {
      firstChoiceAgentId: ids[3]!,
      fallbackAgentId: ids[4]!,
      principles: 'Fixture allocation principles.',
      commentRunLimit: 4,
    });
    const snapshot = async () => ({
      agents: await Promise.all(
        ids.map(async (id) => {
          const agent = await h.agents.agents.get(id);
          return {
            id: agent.id,
            name: agent.name,
            description: agent.description,
            modelEntries: agent.modelEntries,
            status: agent.status,
            instructions: agent.instructions,
            toolPolicy: agent.toolPolicy,
            history: await h.agents.agents.history(id),
          };
        }),
      ),
      settings: await h.manager.settings(),
      chat: await h.agents.chat.settings(),
    });
    const before = await snapshot();
    await h.manager.ready();
    await h.manager.ready();
    expect(await snapshot()).toEqual(before);
    for (const id of ids)
      expect((await h.agents.agents.get(id)).actions).toContain(
        'studio.reports/read',
      );
    expect(
      await h.agents.agents.applyDefaults({ preserveInstructions: true }),
    ).toBe(0);
  });
  it('reads them for anyone signed in, editable by a manager of agents', async () => {
    const member = await h.request('GET', '/projectManager', { user: 'alice' });
    expect(member.status).toBe(200);
    expect(member.body.data).toMatchObject({
      firstChoiceAgentId: coder,
      fallbackAgentId: null,
      principles: null,
      commentRunLimit: DEFAULT_COMMENT_RUN_LIMIT,
      builtInPrinciples: BUILT_IN_PRINCIPLES,
      choices: [
        {
          id: coder,
          name: 'Coder',
          description: 'Implements changes well.',
          online: false,
        },
      ],
      canEdit: false,
    });
    const admin = await h.request('GET', '/projectManager', { user: 'root' });
    expect(admin.body.data.canEdit).toBe(true);
    expect((await h.request('GET', '/projectManager')).status).toBe(401);
  });

  it('lets only a manager of agents change them', async () => {
    const answer = await h.request('PATCH', '/projectManager', {
      user: 'alice',
      body: { commentRunLimit: 5 },
    });
    expect(answer.status).toBe(403);
    expect((await h.manager.settings()).commentRunLimit).toBe(
      DEFAULT_COMMENT_RUN_LIMIT,
    );
  });

  it('holds an API key to its scope: a manager’s key changes them only with agents in it at write', async () => {
    const keyed = (groups: unknown, commentRunLimit: number) =>
      h.request('PATCH', '/projectManager', {
        user: 'root',
        headers: { 'x-test-key-scope': JSON.stringify(groups) },
        body: { commentRunLimit },
      });
    expect(
      (await keyed({ 'agents.agents': { level: 'read' } }, 5)).status,
    ).toBe(403);
    expect(
      (await keyed({ 'releases.apps': { level: 'admin' } }, 5)).status,
    ).toBe(403);
    expect((await h.manager.settings()).commentRunLimit).toBe(
      DEFAULT_COMMENT_RUN_LIMIT,
    );
    const allowed = await keyed({ 'agents.agents': { level: 'write' } }, 7);
    expect(allowed.status).toBe(200);
    expect((await h.manager.settings()).commentRunLimit).toBe(7);
  });

  it('runs with the first choice then the fallback, which must be other enabled agents discovered from runners', async () => {
    const reviewer = await h.createAgent({
      name: 'Reviewer',
      tool: 'codex',
      model: 'gpt-test',
      description: 'Reviews well.',
    });
    const patch = (body: unknown) =>
      h.request('PATCH', '/projectManager', { user: 'root', body });

    const saved = await patch({ fallbackAgentId: reviewer });
    expect(saved.status).toBe(200);
    expect(saved.body.data).toMatchObject({
      firstChoiceAgentId: coder,
      fallbackAgentId: reviewer,
      canEdit: true,
    });
    const manager = await h.agents.agents.get(PROJECT_MANAGER_ID);
    expect(manager.modelEntries.map((entry) => entry.tool)).toEqual([
      'claude',
      'codex',
    ]);

    const same = await patch({ fallbackAgentId: coder });
    expect(same.status).toBe(400);
    expect(same.body.error.reason).toBe('PROJECT_MANAGER_AGENT_INVALID');

    // The project manager itself is the application's own, not one discovered from runners.
    const self = await patch({ firstChoiceAgentId: PROJECT_MANAGER_ID });
    expect(self.status).toBe(400);
    expect(self.body.error.reason).toBe('PROJECT_MANAGER_AGENT_INVALID');

    const unknown = await patch({ firstChoiceAgentId: 'nobody' });
    expect(unknown.status).toBe(400);

    const disabled = await h.agents.agents.get(reviewer);
    await h.agents.agents.update(reviewer, 'root', {
      enabled: false,
      expectedRevision: disabled.revision,
    });
    const notEnabled = await patch({ firstChoiceAgentId: reviewer });
    expect(notEnabled.status).toBe(400);
    expect(notEnabled.body.error.reason).toBe('PROJECT_MANAGER_AGENT_INVALID');

    expect((await patch({ commentRunLimit: 0 })).status).toBe(400);
    for (const value of [0, 86401, 1.5])
      expect(
        (await patch({ delegationQueueTimeoutSeconds: value })).status,
      ).toBe(400);
    expect(
      (await patch({ delegationQueueTimeoutSeconds: 86400 })).body.data
        .delegationQueueTimeoutSeconds,
    ).toBe(86400);
    await patch({ delegationQueueTimeoutSeconds: 600 });
    expect((await patch({ fallbackAfterSeconds: 0 })).status).toBe(400);
    expect((await patch({ fallbackAfterSeconds: 3601 })).status).toBe(400);
    expect((await patch({ fallbackAfterSeconds: 1.5 })).status).toBe(400);
    expect(
      (await patch({ fallbackAfterSeconds: 3600 })).body.data
        .fallbackAfterSeconds,
    ).toBe(3600);
    expect((await patch({ approvals: true })).status).toBe(400);
  });

  it('makes the first choice the default chat agent', async () => {
    const other = await h.createAgent({ name: 'Other', model: 'other-model' });
    await h.request('PATCH', '/projectManager', {
      user: 'root',
      body: { firstChoiceAgentId: other },
    });
    expect((await h.agents.chat.settings()).defaultAgentId).toBe(other);
    const manager = await h.agents.agents.get(PROJECT_MANAGER_ID);
    expect(manager.modelEntries).toEqual([
      expect.objectContaining({ tool: 'claude', model: 'other-model' }),
    ]);
  });

  it('keeps the built-in principles as null, and instructs the project manager with edited ones', async () => {
    const patch = (principles: string | null) =>
      h.request('PATCH', '/projectManager', {
        user: 'root',
        body: { principles },
      });
    expect(
      (await patch(`  ${BUILT_IN_PRINCIPLES}\n`)).body.data.principles,
    ).toBeNull();
    expect((await patch('')).body.data.principles).toBeNull();

    const edited = '## Who does what\n\nGive every step to the Coder.';
    expect((await patch(edited)).body.data.principles).toBe(edited);
    const instructions = (await h.agents.agents.get(PROJECT_MANAGER_ID))
      .instructions;
    expect(instructions).toContain('You are the project manager of the issue');
    expect(instructions).toContain('Give every step to the Coder.');
    expect(instructions).not.toContain('## When to ask for a short approach');

    expect((await patch(null)).body.data.principles).toBeNull();
    expect(
      (await h.agents.agents.get(PROJECT_MANAGER_ID)).instructions,
    ).toContain('## When to ask for a short approach');
  });
});

describe('when the project manager is woken', () => {
  it('executes every new issue, starting when it is given one in progress', async () => {
    const issue = await create({ statusKey: 'in_progress' });
    expect(issue.executor).toEqual(MANAGED);
    expect(await runsOf(issue.id)).toEqual([
      expect.objectContaining({
        agentId: PROJECT_MANAGER_ID,
        status: 'queued',
      }),
    ]);
    expect(await triggersOf(issue.id)).toEqual(['assigned']);
  });

  it('waits in backlog, and starts when a person moves the issue to in progress', async () => {
    const issue = await create();
    expect(issue.statusKey).toBe('backlog');
    expect(await runsOf(issue.id)).toEqual([]);
    await update(issue, { statusKey: 'in_progress' });
    expect(await triggersOf(issue.id)).toEqual(['started']);
  });

  it('is not woken by a comment on a finished or cancelled issue', async () => {
    for (const statusKey of ['done', 'cancelled']) {
      const issue = await create();
      await update(issue, { statusKey });
      expect(await runsOf(issue.id)).toEqual([]);
      await h.projects.comments.create(alice(), issue.id, {
        content: 'One more thing.',
      });
      expect(await h.claimOne()).toBeUndefined();
      expect(await runsOf(issue.id)).toEqual([]);
    }
  });

  it('hears a person move the issue while it works on it', async () => {
    const issue = await create({ statusKey: 'in_progress' });
    await update(issue, { statusKey: 'in_review' });
    await update(issue, { statusKey: 'in_progress' });
    expect(await triggersOf(issue.id)).toEqual([
      'assigned',
      'statusChange',
      'statusChange',
    ]);
  });

  it('withdraws its queued work when a person finishes the issue', async () => {
    const issue = await create({ statusKey: 'in_progress' });
    await update(issue, { statusKey: 'done' });
    expect(await runsOf(issue.id)).toEqual([
      expect.objectContaining({ status: 'cancelled' }),
    ]);
  });

  it('is not claimed once the issue went back to backlog', async () => {
    const issue = await create({ statusKey: 'in_progress' });
    await update(issue, { statusKey: 'backlog' });
    expect(await h.claimOne()).toBeUndefined();
    const [run] = await runsOf(issue.id);
    expect(run).toMatchObject({ status: 'cancelled' });
    expect(run.failureDetail).toMatch(/^dormant/u);
  });
});

describe('the statuses agents may move an issue between', () => {
  it('lets the project manager move it among the open ones, never to done', async () => {
    const issue = await create({ statusKey: 'in_progress' });
    const manager = asAgent(PROJECT_MANAGER_ID);
    expect(
      (await update(issue, { statusKey: 'blocked' }, manager)).statusKey,
    ).toBe('blocked');
    expect(
      (await update(issue, { statusKey: 'in_review' }, manager)).statusKey,
    ).toBe('in_review');
    await expect(
      update(issue, { statusKey: 'done' }, manager),
    ).rejects.toThrow();
    // Its own moves wake nobody.
    expect(await triggersOf(issue.id)).toEqual(['assigned']);
  });

  it('lets an agent doing a step move nothing', async () => {
    const issue = await create({ statusKey: 'in_progress' });
    await expect(
      update(issue, { statusKey: 'in_review' }, asAgent(coder)),
    ).rejects.toThrow();
  });

  it('refuses any other agent as an executor', async () => {
    await expect(
      create({ executor: { type: 'agent', id: coder } }),
    ).rejects.toMatchObject({ code: 'INVALID_EXECUTOR' });
  });
});

describe('handing an issue to the project manager', () => {
  const start = (issueId: string, user = 'alice') =>
    h.request('POST', `/projectManager/issues/${issueId}/start`, { user });

  it('starts it on an open issue it never worked on', async () => {
    const issue = await create({ statusKey: 'in_progress', start: false });
    expect(await runsOf(issue.id)).toEqual([]);
    expect(await progress(issue.id)).toMatchObject({
      state: 'idle',
      handOver: true,
    });

    const answer = await start(issue.id);
    expect(answer.status).toBe(200);
    const [run] = await runsOf(issue.id);
    expect(answer.body.data).toEqual({ runId: run.id });
    expect(await triggersOf(issue.id)).toEqual(['started']);
    expect(await progress(issue.id)).toMatchObject({
      state: 'queued',
      handOver: false,
    });
  });

  it('refuses an issue it does not execute, or one in backlog', async () => {
    const unmanaged = await create({
      statusKey: 'in_progress',
      executor: null,
    });
    const refused = await start(unmanaged.id);
    expect(refused.status).toBe(400);
    expect(refused.body.error).toMatchObject({
      reason: 'PROJECT_MANAGER_NOT_STARTED',
    });

    const dormant = await start((await create()).id);
    expect(dormant.status).toBe(400);
    expect(dormant.body.error.reason).toBe('PROJECT_MANAGER_NOT_STARTED');
  });

  it('lets only a person who may edit the issue hand it over', async () => {
    const issue = await create({ statusKey: 'in_progress', start: false });
    h.roles.set('bob', 'none');
    expect((await start(issue.id, 'bob')).status).toBe(403);
    expect(await runsOf(issue.id)).toEqual([]);
  });
});

describe('what an issue waits for', () => {
  it('is not started in backlog, and finished once done or cancelled', async () => {
    const issue = await create();
    expect(await progress(issue.id)).toEqual({
      state: 'notStarted',
      personalRunnerRequests: [],
      agent: null,
      step: null,
      since: null,
      runner: null,
      pullRequest: null,
      question: null,
      next: null,
      handOver: false,
    });
    await update(issue, { statusKey: 'cancelled' });
    expect((await progress(issue.id)).state).toBe('finished');
  });

  it('names the agent working on the step it was handed, before the project manager', async () => {
    const issue = await create({ statusKey: 'in_progress' });
    expect(await progress(issue.id)).toMatchObject({
      state: 'queued',
      agent: { id: PROJECT_MANAGER_ID, name: 'Project manager' },
      step: null,
    });
    await h.claimOne();
    expect(await progress(issue.id)).toMatchObject({
      state: 'working',
      agent: { id: PROJECT_MANAGER_ID },
      runner: 'runner',
    });

    await h.projects.comments.create(asAgent(PROJECT_MANAGER_ID), issue.id, {
      content: `Next: once the Coder reports, ask for a review.\n\n[@Coder](mention://agent/${coder}) Implement the export of the list.\n\nReply with the pull request.`,
    });
    expect(await progress(issue.id)).toMatchObject({
      state: 'working',
      agent: { id: PROJECT_MANAGER_ID },
      next: 'once the Coder reports, ask for a review.',
    });
    await h.claimOne();
    const working = await progress(issue.id);
    expect(working).toMatchObject({
      state: 'working',
      agent: { id: coder, name: 'Coder' },
      runner: 'runner',
      next: 'once the Coder reports, ask for a review.',
    });
    // The step is the hand-over's first line after the project manager's "Next" line.
    expect(working.step).toBe('Implement the export of the list.');
    expect(working.since).toEqual(expect.any(String));
  });

  it('waits for the checks of a linked open pull request', async () => {
    const issue = await create({ statusKey: 'in_progress', start: false });
    const conn = h.projects.tx.read();
    const repo = await ensureRepo(conn, API, 'acme/app');
    const { pr } = await upsertPullRequest(
      conn,
      repo.id,
      {
        repo: 'acme/app',
        number: 12,
        url: 'https://github.com/acme/app/pull/12',
        title: 'Export',
        body: null,
        state: 'open',
        draft: false,
        headRef: `agent/${issue.identifier}`,
        baseRef: 'main',
        headSha: 'a'.repeat(40),
        authorLogin: 'octo',
        mergeableState: 'clean',
        mergedAt: null,
        mergedByLogin: null,
        mergeCommitSha: null,
        closedAt: null,
      },
      { ciState: 'pending' },
    );
    await insertLink(conn, {
      issueId: issue.id,
      pullRequestId: pr.id,
      linkedByType: 'user',
      linkedById: 'alice',
    });
    expect(await progress(issue.id)).toMatchObject({
      state: 'checksPending',
      pullRequest: { number: 12, url: 'https://github.com/acme/app/pull/12' },
    });
  });

  it('needs a decision on a blocked issue: the project manager’s question, and its "Next" line', async () => {
    const issue = await create({ statusKey: 'in_progress', start: false });
    await h.projects.comments.create(asAgent(PROJECT_MANAGER_ID), issue.id, {
      content:
        'Next: once you choose, hand the change to the Coder.\nNeeds you: Should the export include **deleted** issues?\n\nPlease confirm the scope.',
    });
    await update(issue, { statusKey: 'blocked' }, asAgent(PROJECT_MANAGER_ID));
    expect(await progress(issue.id)).toMatchObject({
      state: 'needsDecision',
      question: 'Should the export include **deleted** issues?',
      next: 'once you choose, hand the change to the Coder.',
    });
  });

  it('keeps the blocked source through later dispatch reports, clears it on resume, and reads only the latest Next', async () => {
    const issue = await create({ statusKey: 'in_progress', start: false });
    const { comment: source } = await h.projects.comments.create(
      asAgent(PROJECT_MANAGER_ID),
      issue.id,
      {
        content:
          'Next: wait for the disk to recover.\n需要你：Restore the execution machine.\n\nThe disk is full. Run `df -h`.',
      },
    );
    await update(issue, { statusKey: 'blocked' }, asAgent(PROJECT_MANAGER_ID));
    await h.projects.comments.create(asAgent(PROJECT_MANAGER_ID), issue.id, {
      content: 'The report was received. No question here.',
    });
    expect(await progress(issue.id)).toMatchObject({
      question: 'Restore the execution machine.',
      blockedComment: { id: source.id },
      next: null,
    });
    await update(issue, { statusKey: 'in_progress' });
    expect(await progress(issue.id)).toMatchObject({
      question: null,
      next: null,
    });
    expect((await progress(issue.id)).blockedComment).toBeUndefined();
    const { comment: second } = await h.projects.comments.create(
      asAgent(PROJECT_MANAGER_ID),
      issue.id,
      { content: 'Next: wait for a decision.\n\nThe checkout failed.' },
    );
    await update(issue, { statusKey: 'blocked' }, asAgent(PROJECT_MANAGER_ID));
    expect(await progress(issue.id)).toMatchObject({
      question: null,
      blockedComment: { id: second.id, content: second.content },
    });
  });

  it('is in review, idle, and reads a "Next" line written in Chinese', async () => {
    const issue = await create({ statusKey: 'in_progress', start: false });
    expect((await progress(issue.id)).state).toBe('idle');
    await h.projects.comments.create(asAgent(PROJECT_MANAGER_ID), issue.id, {
      content: '接下来：等你验收。\n\n改动已就绪。',
    });
    await update(
      issue,
      { statusKey: 'in_review' },
      asAgent(PROJECT_MANAGER_ID),
    );
    expect(await progress(issue.id)).toMatchObject({
      state: 'inReview',
      next: '等你验收。',
    });
  });

  it('refuses a caller who may not view issues', async () => {
    const issue = await create();
    h.roles.set('bob', 'none');
    expect(
      (await h.request('GET', `/issueProgress/${issue.id}`, { user: 'bob' }))
        .status,
    ).toBe(403);
  });
});

describe('the comment run limit', () => {
  it('holds an agent’s comment back past the limit, until a person continues it', async () => {
    await h.request('PATCH', '/projectManager', {
      user: 'root',
      body: { commentRunLimit: 1 },
    });
    const issue = await create({ statusKey: 'in_progress', start: false });
    // A coder's reply wakes the project manager, which executes the issue.
    await h.projects.comments.create(asAgent(coder), issue.id, {
      content: 'Done: the export works.',
    });
    expect(await triggersOf(issue.id)).toEqual(['comment']);
    await claimAndStart();
    await h.projects.comments.create(asAgent(coder), issue.id, {
      content: 'One more finding.',
    });
    expect(await triggersOf(issue.id)).toEqual(['comment']);
    await expect
      .poll(() => planned.map((notice) => notice.type))
      .toContain('comment_runs_limited');
    expect(
      planned.find((notice) => notice.type === 'comment_runs_limited'),
    ).toMatchObject({ userIds: ['alice'], params: { limit: '1' } });

    const pending = await h.request('GET', `/issueCommentRuns/${issue.id}`, {
      user: 'alice',
    });
    expect(pending.status).toBe(200);
    expect(pending.body.data).toMatchObject({ maxRuns: 1, windowHours: 24 });
    const token = pending.body.data.token as string;

    const stale = await h.request(
      'POST',
      `/issueCommentRuns/${issue.id}/continue`,
      { user: 'alice', body: { token: crypto.randomUUID() } },
    );
    expect(stale.status).toBe(400);

    const continued = await h.request(
      'POST',
      `/issueCommentRuns/${issue.id}/continue`,
      { user: 'alice', body: { token } },
    );
    expect(continued.status).toBe(200);
    expect(continued.body.data.runIds).toHaveLength(1);
    const again = await h.request(
      'POST',
      `/issueCommentRuns/${issue.id}/continue`,
      { user: 'alice', body: { token } },
    );
    expect(again.status).toBe(400);
    expect(
      (
        await h.request('GET', `/issueCommentRuns/${issue.id}`, {
          user: 'alice',
        })
      ).body.data,
    ).toBeNull();
  });

  it('starts counting again after a person’s own comment', async () => {
    await h.request('PATCH', '/projectManager', {
      user: 'root',
      body: { commentRunLimit: 1 },
    });
    const issue = await create({ statusKey: 'in_progress', start: false });
    await h.projects.comments.create(asAgent(coder), issue.id, {
      content: 'First.',
    });
    await claimAndStart();
    await h.projects.comments.create(alice(), issue.id, {
      content: 'Go on.',
    });
    await h.projects.comments.create(asAgent(coder), issue.id, {
      content: 'Second.',
    });
    // The person's comment woke the project manager too; the second reply joined its queued run.
    expect(await triggersOf(issue.id)).toEqual([
      'comment',
      'comment',
      'comment',
    ]);
  });
});
