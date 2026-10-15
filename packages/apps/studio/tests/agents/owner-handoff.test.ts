// @vitest-environment node
import { mkdtempSync, rmSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { Hono } from 'hono';
import { runStudioCli } from '../fixtures/nb-studio-cli.js';
import { RUNNER_ROUTES } from '@nocobase/agent-protocol';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createBridgeHarness, type BridgeHarness } from './bridge-harness.js';
import { readOwnerHandoff } from '../../server/issues/owner-handoff.js';
import { createAgentWork } from '../../server/agents/work.js';
import {
  ownerHandoffNoticeRule,
  OWNER_HANDOFF_NOTICE,
} from '../../server/issues/owner-handoff-notices.js';
import { connectedRepo } from '../git/helpers.js';
import { PROJECT_MANAGER_ID } from '../../shared/project-manager.js';

let h: BridgeHarness;
beforeEach(async () => {
  h = await createBridgeHarness();
  for (const id of ['alice', 'bob', 'carol']) {
    await h.addUser(id);
    h.roles.set(id, 'admin');
  }
  await h.createAgent();
});
afterEach(async () => h.close());
const runs = (id: string) =>
  h.agents.runs.list({ subjectKind: 'issue', subjectId: id });
const task = (statusKey = 'in_progress') =>
  h.projects.issues.create(h.viewer('alice'), {
    title: 'Handoff',
    statusKey,
    start: false,
  });
async function transfer(id: string, to = 'bob', by = 'alice') {
  const issue = await h.projects.issueQueries.detail(h.viewer(by), id);
  return h.projects.issues.update(h.viewer(by), id, {
    revision: issue.revision,
    ownerUserId: to,
  });
}
async function decide(
  id: string,
  decision: 'accept' | 'reject',
  user = 'bob',
  key?: string,
) {
  const handoff = await readOwnerHandoff(h.projects.tx.read(), id);
  return h.request('POST', `/issueOwnerHandoffs/${id}/${decision}`, {
    user,
    body: { notificationKey: key ?? handoff!.notificationKey },
  });
}

describe('owner acceptance', () => {
  it('withdraws all queued work, stops held work, skips comments and release events, and resumes only the manager with comment delta', async () => {
    const issue = await task();
    await h.request('POST', `/projectManager/issues/${issue.id}/start`, {
      user: 'alice',
    });
    const original = await h.claimOne();
    const worker = await h.createAgent({ name: 'Worker' });
    await h.projects.comments.create(h.viewer('alice'), issue.id, {
      content: `[@Worker](mention://agent/${worker}) queued step`,
    });
    const before = await runs(issue.id);
    await transfer(issue.id);
    expect(
      (await h.agents.runs.get(original.run.id)).cancelRequestedAt,
    ).not.toBeNull();
    expect(
      (await runs(issue.id)).filter((run) => run.status === 'queued'),
    ).toEqual([]);
    await h.projects.comments.create(h.viewer('carol'), issue.id, {
      content: `[@Worker](mention://agent/${worker}) waiting-period-comment`,
    });
    const current = await h.projects.issueQueries.detail(
      h.viewer('bob'),
      issue.id,
    );
    const work = createAgentWork({
      agents: h.agents,
      projects: () => h.projects,
    });
    await h.projects.tx.run(async (tx) => {
      expect(
        await work.onUnblocked!(tx, { issue: current, releasedBy: current }),
      ).toMatchObject([{ skipped: 'waitingOwner' }]);
      expect(
        await work.onSubtasksFinished!(tx, {
          parent: current,
          stage: null,
          childIssueIds: [],
        }),
      ).toMatchObject([{ skipped: 'waitingOwner' }]);
    });
    expect(await runs(issue.id)).toHaveLength(before.length);
    expect(
      (
        await h.request('POST', `/projectManager/issues/${issue.id}/start`, {
          user: 'bob',
        })
      ).body.error.reason,
    ).toBe('ISSUE_OWNER_HANDOFF_PENDING');
    expect(
      (await h.request('GET', `/issueProgress/${issue.id}`, { user: 'alice' }))
        .body.data.waiting,
    ).toMatchObject({ reason: 'waitingOwner', owner: { id: 'bob' } });
    expect(
      current.activities.some(
        (activity) =>
          activity.action === 'work_skipped' &&
          activity.details.reason === 'waitingOwner',
      ),
    ).toBe(true);
    await expect(
      h.agents.runs.retry(
        before.find((run) => run.status === 'queued')!.id,
        'bob',
      ),
    ).rejects.toBeDefined();
    expect((await decide(issue.id, 'accept')).status).toBe(200);
    expect((await decide(issue.id, 'accept')).status).toBe(409);
    const newRuns = (await runs(issue.id)).filter(
      (run) => run.status === 'queued',
    );
    expect(newRuns).toHaveLength(1);
    expect(newRuns[0]).toMatchObject({
      agentId: PROJECT_MANAGER_ID,
      actorUserId: 'bob',
    });
    await h.runner(RUNNER_ROUTES.cancelAck, original.run.id, {});
    const claimed = await h.claimOne();
    expect(claimed.run.id).toBe(newRuns[0].id);
    expect(JSON.stringify(claimed)).toContain('waiting-period-comment');
  });

  it('keeps rejection paused and notifies the original owner and actual transfer user', async () => {
    const issue = await task();
    const events: Parameters<
      ReturnType<typeof ownerHandoffNoticeRule>
    >[0]['events'][number][] = [];
    h.projects.events.on('work.announced', (event) => {
      if (event.kind === OWNER_HANDOFF_NOTICE) events.push(event);
    });
    await transfer(issue.id, 'bob', 'carol');
    expect((await decide(issue.id, 'reject')).status).toBe(200);
    expect(
      await readOwnerHandoff(h.projects.tx.read(), issue.id),
    ).toMatchObject({
      waiting: true,
      ownerUserId: 'bob',
      rejectedAt: expect.any(String),
    });
    await h.projects.comments.create(h.viewer('alice'), issue.id, {
      content: 'Do not resume yet',
    });
    expect(await runs(issue.id)).toEqual([]);
    const notices = await h.projects.tx.run((tx) =>
      ownerHandoffNoticeRule()({
        tx,
        events,
        subscribers: async () => [],
        nameOf: async () => null,
      }),
    );
    expect(
      notices.find((notice) => notice.type === 'owner_handoff')?.userIds,
    ).toEqual(['bob']);
    expect(
      notices.find((notice) => notice.type === 'owner_handoff_rejected')
        ?.userIds,
    ).toEqual(['alice', 'carol']);
    expect(h.port.settled).toContainEqual({
      decisionKey: `owner-handoff:${(await readOwnerHandoff(h.projects.tx.read(), issue.id))!.notificationKey}`,
      outcome: 'rejected',
    });
  });

  it('checks authentication, issue permission, actual human identity and stale notices including ABA', async () => {
    const issue = await task();
    await transfer(issue.id);
    const first = (await readOwnerHandoff(h.projects.tx.read(), issue.id))!;
    expect(
      (
        await h.request('POST', `/issueOwnerHandoffs/${issue.id}/accept`, {
          body: { notificationKey: first.notificationKey },
        })
      ).status,
    ).toBe(401);
    expect((await decide(issue.id, 'accept', 'alice')).status).toBe(403);
    h.roles.set('bob', 'none');
    expect((await decide(issue.id, 'accept')).status).toBe(403);
    h.roles.set('bob', 'admin');
    const other = await h.projects.issues.create(h.viewer('bob'), {
      title: 'Actual Bob run',
      statusKey: 'in_progress',
      start: false,
    });
    await h.request('POST', `/projectManager/issues/${other.id}/start`, {
      user: 'bob',
    });
    const claimed = await h.claimOne();
    expect(
      (
        await h.request('POST', `/issueOwnerHandoffs/${issue.id}/accept`, {
          runToken: claimed.cli.credential.content.token,
          body: { notificationKey: first.notificationKey },
        })
      ).status,
    ).toBe(403);
    await transfer(issue.id, 'carol');
    await transfer(issue.id, 'bob');
    expect(
      (await decide(issue.id, 'accept', 'bob', first.notificationKey)).status,
    ).toBe(409);
    expect(
      (await readOwnerHandoff(h.projects.tx.read(), issue.id))!.waiting,
    ).toBe(true);
  });

  it('does not replace the first start when accepting or claiming a backlog task', async () => {
    const issue = await task('backlog');
    await transfer(issue.id);
    const pending = await h.projects.issueQueries.detail(
      h.viewer('bob'),
      issue.id,
    );
    await expect(
      h.projects.issues.update(h.viewer('bob'), issue.id, {
        revision: pending.revision,
        statusKey: 'in_progress',
      }),
    ).rejects.toMatchObject({ reason: 'ISSUE_OWNER_HANDOFF_PENDING' });
    expect(
      (await h.projects.issueQueries.detail(h.viewer('bob'), issue.id))
        .statusKey,
    ).toBe('backlog');
    expect((await decide(issue.id, 'accept')).status).toBe(200);
    await h.projects.comments.create(h.viewer('bob'), issue.id, {
      content: 'Still requires start',
    });
    expect(await runs(issue.id)).toEqual([]);
    await transfer(issue.id, 'alice', 'alice');
    expect(
      (await readOwnerHandoff(h.projects.tx.read(), issue.id))!.waiting,
    ).toBe(false);
    expect(await runs(issue.id)).toEqual([]);
  });

  it('allows a human owner to claim their already assigned, rejected handoff', async () => {
    const issue = await task();
    await transfer(issue.id);
    await decide(issue.id, 'reject');
    await transfer(issue.id, 'bob', 'bob');
    expect(await runs(issue.id)).toHaveLength(1);
    expect(
      (await readOwnerHandoff(h.projects.tx.read(), issue.id))!.waiting,
    ).toBe(false);
    await h.projects.comments.create(h.viewer('alice'), issue.id, {
      content: 'Continue after the claim',
    });
    expect((await runs(issue.id))[0]).toMatchObject({
      agentId: PROJECT_MANAGER_ID,
      actorUserId: 'bob',
    });
  });

  it.each(['pending', 'rejected'] as const)(
    'clears an unassigned %s handoff on a human claim and resumes only the owner manager',
    async (state) => {
      const issue = await task();
      await h.projects.issues.update(h.viewer('alice'), issue.id, {
        revision: issue.revision,
        ownerUserId: 'bob',
        executor: null,
      });
      if (state === 'rejected') await decide(issue.id, 'reject');
      const before = await h.projects.issueQueries.detail(
        h.viewer('bob'),
        issue.id,
      );
      const response = await h.request(
        'PATCH',
        `/projects/issues/${issue.id}`,
        {
          user: 'bob',
          body: { revision: before.revision, ownerUserId: 'bob' },
        },
      );
      expect(response.status).toBe(200);
      const returned = response.body.data.issue;
      const stored = await h.projects.issueQueries.detail(
        h.viewer('bob'),
        issue.id,
      );
      expect(returned.revision).toBe(stored.revision);
      expect(returned.executor).toEqual(stored.executor);
      const edited = await h.request('PATCH', `/projects/issues/${issue.id}`, {
        user: 'bob',
        body: { revision: returned.revision, title: 'Immediate edit' },
      });
      expect(edited.status).toBe(200);
      expect(
        await readOwnerHandoff(h.projects.tx.read(), issue.id),
      ).toMatchObject({ waiting: false, rejectedAt: null });
      const after = await h.projects.issueQueries.detail(
        h.viewer('bob'),
        issue.id,
      );
      expect(after.executor).toEqual({ type: 'agent', id: PROJECT_MANAGER_ID });
      expect(await runs(issue.id)).toMatchObject([
        { agentId: PROJECT_MANAGER_ID, actorUserId: 'bob', status: 'queued' },
      ]);
      expect(await runs(issue.id)).toHaveLength(1);
      expect((await decide(issue.id, 'accept')).status).toBe(409);
      await transfer(issue.id, 'bob', 'bob');
      expect(await runs(issue.id)).toHaveLength(1);
    },
  );

  it('does not let another person or an agent claim an unassigned handoff for its owner', async () => {
    const issue = await task();
    await h.projects.issues.update(h.viewer('alice'), issue.id, {
      revision: issue.revision,
      ownerUserId: 'bob',
      executor: null,
    });
    for (const viewer of [
      h.viewer('alice'),
      {
        ...h.viewer('bob'),
        actor: { type: 'user', id: 'bob', via: 'agent' } as const,
      },
    ]) {
      const current = await h.projects.issueQueries.detail(
        h.viewer('bob'),
        issue.id,
      );
      await h.projects.issues.update(viewer, issue.id, {
        revision: current.revision,
        ownerUserId: 'bob',
      });
      expect(
        await readOwnerHandoff(h.projects.tx.read(), issue.id),
      ).toMatchObject({ waiting: true });
      expect(await runs(issue.id)).toEqual([]);
    }
  });

  it('clears an unassigned backlog handoff without replacing the first start', async () => {
    const issue = await task('backlog');
    await h.projects.issues.update(h.viewer('alice'), issue.id, {
      revision: issue.revision,
      ownerUserId: 'bob',
      executor: null,
    });
    await transfer(issue.id, 'bob', 'bob');
    expect(
      await readOwnerHandoff(h.projects.tx.read(), issue.id),
    ).toMatchObject({ waiting: false, rejectedAt: null });
    expect(await runs(issue.id)).toEqual([]);
    await h.projects.comments.create(h.viewer('bob'), issue.id, {
      content: 'Still not started',
    });
    expect(await runs(issue.id)).toEqual([]);
  });

  it('keeps the pause when the executor is cleared and restores the manager on acceptance', async () => {
    const issue = await task();
    await h.projects.issues.update(h.viewer('alice'), issue.id, {
      revision: issue.revision,
      ownerUserId: 'bob',
      executor: null,
    });
    await h.projects.comments.create(h.viewer('alice'), issue.id, {
      content: 'Comment with no executor',
    });
    const before = await h.projects.issueQueries.detail(
      h.viewer('bob'),
      issue.id,
    );
    expect(
      before.activities.some(
        (activity) =>
          activity.action === 'work_skipped' &&
          activity.details.reason === 'waitingOwner',
      ),
    ).toBe(true);
    expect((await decide(issue.id, 'accept')).status).toBe(200);
    const after = await h.projects.issueQueries.detail(
      h.viewer('bob'),
      issue.id,
    );
    expect(after.executor).toEqual({ type: 'agent', id: PROJECT_MANAGER_ID });
    expect((await runs(issue.id))[0]).toMatchObject({
      actorUserId: 'bob',
      agentId: PROJECT_MANAGER_ID,
    });
  });

  it('refuses a legacy queued attempt returned after transfer at claim time', async () => {
    const issue = await task();
    await h.request('POST', `/projectManager/issues/${issue.id}/start`, {
      user: 'alice',
    });
    const [run] = await runs(issue.id);
    await transfer(issue.id);
    await h.database
      .connection()
      .repository('agRuns')
      .updateOne({
        filter: { id: run.id },
        values: {
          status: 'queued',
          attempt: 2,
          dispatchedAt: new Date().toISOString(),
        },
      });
    expect(await h.claimOne()).toBeUndefined();
    expect((await h.agents.runs.get(run.id)).status).toBe('cancelled');
  });

  it('keeps CI and PR signals in activity while skipping agent work', async () => {
    const issue = await task();
    const repo = await connectedRepo(h, 'acme/handoff');
    h.github.addPull('acme/handoff', {
      number: 1,
      head: { ref: `agent/${issue.identifier}`, sha: 'head1' },
    });
    await h.git.link(
      h.viewer('alice'),
      issue.id,
      'https://github.com/acme/handoff/pull/1',
      { type: 'user', id: 'alice' },
    );
    await transfer(issue.id);
    h.github.setStatus('acme/handoff', 'head1', 'failure');
    await h.git.pollRepo(repo);
    h.github.pull('acme/handoff', 1).mergeable_state = 'dirty';
    await h.git.pollRepo(repo);
    h.github.setStatus('acme/handoff', 'head1', 'success');
    await h.git.pollRepo(repo);
    expect(
      (await runs(issue.id)).filter((run) => run.status === 'queued'),
    ).toEqual([]);
    const detail = await h.projects.issueQueries.detail(
      h.viewer('bob'),
      issue.id,
    );
    expect(
      detail.activities.filter(
        (activity) =>
          activity.action === 'work_skipped' &&
          activity.details.reason === 'waitingOwner',
      ).length,
    ).toBeGreaterThanOrEqual(3);
  });
});

describe('owner handoff CLI', () => {
  let server: Server;
  let dir: string;
  let origin: string;
  let seen: string[];
  let replaceOnDecision: (() => Promise<void>) | undefined;
  beforeEach(async () => {
    dir = mkdtempSync(path.join(os.tmpdir(), 'studio-handoff-cli-'));
    seen = [];
    replaceOnDecision = undefined;
    const outer = new Hono().route('/api', h.app);
    server = createServer(async (req, res) => {
      const chunks: Buffer[] = [];
      for await (const chunk of req) chunks.push(chunk as Buffer);
      const body = Buffer.concat(chunks);
      const headers = req.headers as Record<string, string>;
      if (headers['x-api-key']) headers['x-test-user'] = headers['x-api-key'];
      if (req.url?.includes('/issueOwnerHandoffs/')) {
        seen.push(`${req.method} ${req.url}`);
        if (req.method === 'POST' && replaceOnDecision) {
          const replace = replaceOnDecision;
          replaceOnDecision = undefined;
          await replace();
        }
      }
      const response = await outer.fetch(
        new Request(`http://localhost${req.url}`, {
          method: req.method,
          headers,
          ...(body.length ? { body } : {}),
        }),
      );
      res.writeHead(response.status, Object.fromEntries(response.headers));
      res.end(Buffer.from(await response.arrayBuffer()));
    });
    await new Promise<void>((resolve) =>
      server.listen(0, '127.0.0.1', resolve),
    );
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('No port.');
    origin = `http://127.0.0.1:${address.port}`;
  });
  afterEach(async () => {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
    rmSync(dir, { recursive: true, force: true });
  });
  const cli = (decision: string, issue: string, user = 'bob', json = true) =>
    runStudioCli(
      ['issue', 'handoff', decision, issue, ...(json ? ['--json'] : [])],
      {
        cwd: dir,
        env: {
          NB_STUDIO_SERVER: origin,
          NB_STUDIO_API_KEY: user,
          NB_STUDIO_HOME: path.join(dir, '.home'),
          NB_STUDIO_KEYCHAIN: 'off',
        },
      },
    );
  it.each(['accept', 'reject'])(
    'gets the handoff and runs %s with one read before the decision',
    async (decision) => {
      const issue = await task();
      await transfer(issue.id);
      const got = await cli('get', issue.identifier);
      expect(got.code).toBe(0);
      expect(JSON.parse(got.stdout).result.data).toMatchObject({
        handoff: {
          waiting: true,
          ownerUserId: 'bob',
          previousOwnerUserId: 'alice',
          transferredByUserId: 'alice',
          transferredAt: expect.any(String),
        },
        canDecide: true,
      });
      seen = [];
      const result = await cli(decision, issue.identifier);
      expect(result.code).toBe(0);
      expect(JSON.parse(result.stdout).result.data.handoff.waiting).toBe(
        decision === 'reject',
      );
      expect(seen).toEqual([
        `GET /api/issueOwnerHandoffs/${issue.identifier}`,
        `POST /api/issueOwnerHandoffs/${issue.identifier}/${decision}`,
      ]);
      expect(
        (await runs(issue.id)).filter((run) => run.status === 'queued'),
      ).toHaveLength(decision === 'accept' ? 1 : 0);
      const repeated = await cli(decision, issue.identifier, 'bob', false);
      expect(repeated.code).not.toBe(0);
      expect(repeated.stderr).toContain('Refresh');
    },
  );
  it.each(['accept', 'reject'])(
    'refuses %s from another owner or without editing permission',
    async (decision) => {
      const issue = await task();
      await transfer(issue.id);
      const other = await cli(decision, issue.id, 'alice');
      expect(other.code).toBe(3);
      h.roles.set('bob', 'none');
      const unpermitted = await cli(decision, issue.id);
      expect(unpermitted.code).toBe(3);
      expect(await runs(issue.id)).toEqual([]);
    },
  );
  it('stops without a handoff and never retries a superseded handoff', async () => {
    const issue = await task();
    const missing = await cli('accept', issue.id, 'alice');
    expect(JSON.parse(missing.stdout).error).toMatchObject({
      code: 'READ_BINDING_MISSING',
      message: expect.stringContaining('missing or expired'),
    });
    expect(seen).toHaveLength(1);
    await transfer(issue.id);
    replaceOnDecision = async () => {
      await transfer(issue.id, 'carol');
      await transfer(issue.id, 'bob');
    };
    seen = [];
    const stale = await cli('accept', issue.id);
    expect(JSON.parse(stale.stdout).error).toMatchObject({
      code: 'ISSUE_OWNER_HANDOFF_STALE',
      message: expect.stringContaining('Refresh'),
    });
    expect(seen).toHaveLength(2);
    expect(await runs(issue.id)).toEqual([]);
  });
});
