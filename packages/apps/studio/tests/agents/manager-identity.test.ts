// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  HEADERS,
  PROTOCOL_VERSION,
  RUNNER_ROUTES,
} from '@nocobase/agent-protocol';
import { createBridgeHarness, type BridgeHarness } from './bridge-harness.js';
import { PROJECT_MANAGER_ID as PM } from '../../shared/project-manager.js';
import { runTriggerActor } from '../../client/agents/run-trigger.js';

let h: BridgeHarness;
beforeEach(async () => {
  h = await createBridgeHarness();
  await h.addUser('alice');
  await h.addUser('bob');
  h.roles.set('bob', 'admin');
  await h.createAgent();
});
afterEach(async () => {
  vi.restoreAllMocks();
  await h.close();
});
const runs = (id: string) =>
  h.agents.runs.list({ subjectKind: 'issue', subjectId: id });
const issue = () =>
  h.projects.issues.create(h.viewer('alice'), {
    title: 'Owner identity',
    statusKey: 'in_progress',
    start: false,
  });
const mention = (id: string) => `[@Agent](mention://agent/${id}) do the step`;

describe('manager and delegated identities', () => {
  it('keeps three handled retries and their subsequent delegation in the manager chain at enqueue and claim', async () => {
    const task = await issue();
    const worker = await h.createAgent({ name: 'Worker' });
    const next = await h.createAgent({ name: 'Next' });
    await h.projects.comments.create(
      { ...h.viewer('bob'), actor: { type: 'agent', id: PM } },
      task.id,
      { content: mention(worker) },
    );
    let [run] = await runs(task.id);
    await h.agents.runs.cancel(run.id, 'bob');
    for (let n = 0; n < 3; n++) {
      await h.database
        .connection()
        .repository('agRunInputs')
        .updateMany({
          filter: { runId: run.id },
          values: { handledAt: new Date().toISOString() },
        });
      run = await h.agents.runs.retry(run.id, 'bob');
      expect(run.actorUserId).toBe('alice');
      // Legacy incorrect actors must also be corrected by claim admission.
      await h.database
        .connection()
        .repository('agRuns')
        .updateMany({
          filter: { id: run.id },
          values: { actorUserId: 'bob' },
        });
      expect((await h.claimOne()).run.id).toBe(run.id);
      expect((await h.agents.runs.get(run.id)).actorUserId).toBe('alice');
      if (n < 2) {
        await h.agents.runs.cancel(run.id, 'bob');
        await h.runner(RUNNER_ROUTES.cancelAck, run.id, {});
      }
    }
    await h.projects.comments.create(
      {
        ...h.viewer('bob'),
        actor: { type: 'agent', id: worker, trace: { runId: run.id } },
      },
      task.id,
      { content: mention(next) },
    );
    const step = (await runs(task.id)).find((item) => item.agentId === next)!;
    expect(step.actorUserId).toBe('alice');
    expect((await h.claimOne()).run.id).toBe(step.id);
    expect((await h.agents.runs.get(step.id)).actorUserId).toBe('alice');
  });

  it('selects this retry actor while retaining the earlier unhandled retry input', async () => {
    const task = await issue();
    await h.projects.comments.create(h.viewer('alice'), task.id, {
      content: 'Please work',
    });
    const [original] = await runs(task.id);
    await h.agents.runs.cancel(original.id, 'alice');
    const first = await h.agents.runs.retry(original.id, 'bob');
    await h.agents.runs.cancel(first.id, 'bob');
    const second = await h.agents.runs.retry(first.id, 'alice');
    const detail = await h.agents.runs.detail(second.id);
    expect(
      detail.inputs
        .filter((input) => input.type === 'retry')
        .map((input) => input.actor.id),
    ).toEqual(['bob', 'alice']);
    expect(runTriggerActor(detail)?.id).toBe('alice');
  });

  it('preserves the retrying person for a direct worker through repeated handled retries', async () => {
    const task = await issue();
    const worker = await h.createAgent({ name: 'Direct worker' });
    await h.projects.comments.create(h.viewer('bob'), task.id, {
      content: mention(worker),
    });
    let run = (await runs(task.id)).find((item) => item.agentId === worker)!;
    for (let n = 0; n < 3; n++) {
      await h.agents.runs.cancel(run.id, 'bob');
      await h.database
        .connection()
        .repository('agRunInputs')
        .updateMany({
          filter: { runId: run.id },
          values: { handledAt: new Date().toISOString() },
        });
      run = await h.agents.runs.retry(run.id, 'bob');
      expect(run.actorUserId).toBe('bob');
    }
  });

  it('stops cyclic retry provenance and ignores a manager run on another subject', async () => {
    const task = await issue();
    const worker = await h.createAgent({ name: 'Direct worker' });
    await h.projects.comments.create(h.viewer('bob'), task.id, {
      content: mention(worker),
    });
    const original = (await runs(task.id)).find(
      (item) => item.agentId === worker,
    )!;
    const lookup = vi
      .spyOn(h.agents.runs, 'identityInputs')
      .mockImplementation(async (_conn, id) => ({
        run: {
          ...original,
          id,
          retryOfRunId: id === 'first' ? 'second' : 'first',
        },
        inputs: [],
      }));
    const resolve = h.agents.subjects.get('issue')!.actsAs!;
    const work = {
      subjectId: task.id,
      agentId: worker,
      inputs: [
        {
          actor: { kind: 'user' as const, id: 'bob', name: 'Bob' },
          payload: { retryOfRunId: 'first' },
        },
      ],
    };
    expect(await resolve(h.database.connection(), work)).toBeUndefined();
    expect(lookup).toHaveBeenCalledTimes(2);
    lookup.mockResolvedValue({
      run: {
        ...original,
        agentId: PM,
        subject: { ...original.subject, id: 'another-issue' },
      },
      inputs: [],
    });
    expect(await resolve(h.database.connection(), work)).toBeUndefined();
    lookup.mockResolvedValue({
      run: {
        ...original,
        agentId: PM,
        subject: { ...original.subject, kind: 'conversation' },
      },
      inputs: [],
    });
    expect(await resolve(h.database.connection(), work)).toBeUndefined();
  });

  it('requires the owner to start, then uses the owner for others commenting and retrying', async () => {
    const task = await issue();
    expect(
      (
        await h.request('POST', `/projectManager/issues/${task.id}/start`, {
          user: 'bob',
        })
      ).status,
    ).toBe(403);
    expect(await runs(task.id)).toHaveLength(0);
    expect(
      (
        await h.request('POST', `/projectManager/issues/${task.id}/start`, {
          user: 'alice',
        })
      ).status,
    ).toBe(200);
    await h.projects.comments.create(h.viewer('bob'), task.id, {
      content: 'Please check this',
    });
    const [run] = await runs(task.id);
    expect(run).toMatchObject({
      agentId: PM,
      actorUserId: 'alice',
      requestedByUserId: 'alice',
      ownerUserId: 'alice',
    });
    expect(
      (await h.agents.runs.detail(run.id)).inputs.map(
        (input) => input.actor.id,
      ),
    ).toEqual(['alice', 'bob']);
    await h.agents.runs.cancel(run.id, 'bob');
    const retried = await h.agents.runs.retry(run.id, 'bob');
    expect(retried).toMatchObject({
      actorUserId: 'alice',
      requestedByUserId: 'bob',
    });
    const claimed = await h.claimOne();
    h.roles.set('alice', 'none');
    expect(
      (await h.request('GET', `/projects/issues/${task.id}`, { user: 'bob' }))
        .status,
    ).toBe(200);
    expect(
      (
        await h.request('GET', `/projects/issues/${task.id}`, {
          runToken: claimed.cli.credential.content.token,
        })
      ).status,
    ).not.toBe(200);
  });

  it('never queues backlog comments, including owner and worker mentions', async () => {
    const task = await h.projects.issues.create(h.viewer('alice'), {
      title: 'Not started',
      statusKey: 'backlog',
      start: false,
    });
    const worker = await h.createAgent({ name: 'Worker' });
    for (const user of ['alice', 'bob'])
      await h.projects.comments.create(h.viewer(user), task.id, {
        content: mention(worker),
      });
    expect(await runs(task.id)).toEqual([]);
  });

  it('rejects a non-owner status start and rolls back the issue change', async () => {
    const task = await h.projects.issues.create(h.viewer('alice'), {
      title: 'Owner starts',
      statusKey: 'backlog',
      start: false,
    });
    await expect(
      h.projects.issues.update(h.viewer('bob'), task.id, {
        revision: task.revision,
        statusKey: 'in_progress',
        start: true,
      }),
    ).rejects.toMatchObject({ reason: 'ISSUE_OWNER_START_REQUIRED' });
    expect(
      (await h.projects.issueQueries.detail(h.viewer('alice'), task.id))
        .statusKey,
    ).toBe('backlog');
    expect(await runs(task.id)).toEqual([]);
  });

  it('covers the delegated chain but preserves direct human worker mentions', async () => {
    const task = await issue();
    const worker = await h.createAgent({ name: 'Worker' });
    const next = await h.createAgent({ name: 'Next' });
    await h.projects.comments.create(h.viewer('bob'), task.id, {
      content: mention(worker),
    });
    expect(
      (await runs(task.id)).find((run) => run.agentId === worker)?.actorUserId,
    ).toBe('bob');
    const delegated = await h.projects.comments.create(
      { ...h.viewer('bob'), actor: { type: 'agent', id: PM } },
      task.id,
      { content: mention(next) },
    );
    const chain = (await runs(task.id)).find((run) => run.agentId === next)!;
    expect(chain.actorUserId).toBe('alice');
    await h.projects.comments.create(
      {
        ...h.viewer('alice'),
        actor: { type: 'agent', id: next, trace: { runId: chain.id } },
      },
      task.id,
      { parentId: delegated.comment.id, content: mention(worker) },
    );
    expect(
      (await runs(task.id)).find(
        (run) => run.agentId === worker && run.actorUserId === 'alice',
      ),
    ).toBeDefined();
    await h.addUser('carol');
    const current = await h.projects.issueQueries.detail(
      h.viewer('bob'),
      task.id,
    );
    await h.projects.issues.update(h.viewer('bob'), task.id, {
      revision: current.revision,
      ownerUserId: 'carol',
    });
    const switched = await runs(task.id);
    expect(
      switched.find(
        (run) => run.agentId === worker && run.actorUserId === 'bob',
      ),
    ).toBeDefined();
    expect(switched.every((run) => run.status === 'cancelled')).toBe(true);
    expect(switched.find((run) => run.id === chain.id)?.actorUserId).toBe(
      'alice',
    );
  });

  it('corrects legacy delegated data at claim and requests cancellation on transfer', async () => {
    const task = await issue();
    const worker = await h.createAgent({ name: 'Worker' });
    await h.projects.comments.create(
      { ...h.viewer('bob'), actor: { type: 'agent', id: PM } },
      task.id,
      { content: mention(worker) },
    );
    const [run] = await runs(task.id);
    const original = (await h.agents.runs.detail(run.id)).inputs;
    // Simulate a pre-upgrade hand-over, without the new identity marker.
    await h.database
      .connection()
      .repository('agRuns')
      .updateMany({ filter: { id: run.id }, values: { actorUserId: 'bob' } });
    await h.database
      .connection()
      .repository('agRunInputs')
      .updateMany({
        filter: { runId: run.id },
        values: {
          payload: {
            commentId: (original[0].payload as { commentId: string }).commentId,
          },
        },
      });
    const payload = await h.claimOne();
    expect(payload.run.id).toBe(run.id);
    expect((await h.agents.runs.get(run.id)).actorUserId).toBe('alice');
    const current = await h.projects.issueQueries.detail(
      h.viewer('bob'),
      task.id,
    );
    await h.projects.issues.update(h.viewer('bob'), task.id, {
      revision: current.revision,
      ownerUserId: 'bob',
      start: false,
    });
    expect((await h.agents.runs.get(run.id)).actorUserId).toBe('alice');
    expect((await h.agents.runs.get(run.id)).cancelRequestedAt).not.toBeNull();
    expect(
      (await h.agents.runs.detail(run.id)).inputs.at(-1)?.payload,
    ).toMatchObject({ trigger: 'ownerChanged' });
    expect(await runs(task.id)).toHaveLength(1);
    expect((await h.runner(RUNNER_ROUTES.cancelAck, run.id, {})).status).toBe(
      200,
    );
  });

  it('withdraws every queued agent on transfer, retains inputs and stops held work even when the executor is cleared', async () => {
    const task = await issue();
    await h.request('POST', `/projectManager/issues/${task.id}/start`, {
      user: 'alice',
    });
    const payload = await h.claimOne();
    const worker = await h.createAgent({ name: 'Direct worker' });
    await h.projects.comments.create(h.viewer('bob'), task.id, {
      content: mention(worker),
    });
    const before = await runs(task.id);
    const queued = before.filter((run) => run.status === 'queued');
    expect(queued.length).toBeGreaterThan(0);
    const inputs = await Promise.all(
      queued.map((run) => h.agents.runs.detail(run.id)),
    );
    const current = await h.projects.issueQueries.detail(
      h.viewer('bob'),
      task.id,
    );
    await h.projects.issues.update(h.viewer('bob'), task.id, {
      revision: current.revision,
      ownerUserId: 'bob',
      start: false,
      executor: null,
    });
    const after = await runs(task.id);
    expect(after).toHaveLength(before.length);
    for (const previous of inputs) {
      const now = await h.agents.runs.detail(previous.id);
      expect(now.status).toBe('cancelled');
      expect(now.actorUserId).toBe(previous.actorUserId);
      expect(now.inputs.slice(0, previous.inputs.length)).toEqual(
        previous.inputs,
      );
    }
    expect(await h.agents.runs.get(payload.run.id)).toMatchObject({
      actorUserId: 'alice',
      status: 'dispatched',
      cancelRequestedAt: expect.any(String),
    });
    expect(
      (await h.agents.runs.detail(payload.run.id)).inputs.at(-1)?.actor.id,
    ).toBe('bob');
    const acknowledged = await h.runner(
      RUNNER_ROUTES.cancelAck,
      payload.run.id,
      {},
    );
    expect(acknowledged.status).toBe(200);
    expect((await h.agents.runs.get(payload.run.id)).status).toBe('cancelled');
    await expect(
      h.agents.runs.authenticateToken(payload.cli.credential.content.token),
    ).rejects.toMatchObject({ code: 'RUN_TOKEN_INVALID' });
    expect(await runs(task.id)).toHaveLength(before.length);
  });

  it('follows recorded run provenance for user-approved steps and legacy queued inputs', async () => {
    const task = await issue();
    const worker = await h.createAgent({ name: 'Worker' });
    const next = await h.createAgent({ name: 'Next' });
    await h.projects.comments.create(
      { ...h.viewer('bob'), actor: { type: 'agent', id: PM } },
      task.id,
      { content: mention(worker) },
    );
    const cause = (await runs(task.id)).find((run) => run.agentId === worker)!;
    const result = await h.projects.comments.create(
      {
        ...h.viewer('bob'),
        actor: {
          type: 'user',
          id: 'bob',
          via: 'agent',
          trace: { runId: cause.id, agentId: worker },
        },
      },
      task.id,
      { content: mention(next) },
    );
    const step = (await runs(task.id)).find((run) => run.agentId === next)!;
    expect(step.actorUserId).toBe('alice');
    await h.database
      .connection()
      .repository('agRunInputs')
      .updateMany({
        filter: { runId: step.id },
        values: { payload: { commentId: result.comment.id } },
      });
    await h.addUser('carol');
    const current = await h.projects.issueQueries.detail(
      h.viewer('bob'),
      task.id,
    );
    await h.projects.issues.update(h.viewer('bob'), task.id, {
      revision: current.revision,
      ownerUserId: 'carol',
    });
    expect(await h.agents.runs.get(step.id)).toMatchObject({
      actorUserId: 'alice',
      status: 'cancelled',
    });
  });

  it('retains the system source and reports no runner and inactive owner waiting', async () => {
    const task = await issue();
    await h.agents.runs.enqueue({
      agentId: PM,
      subject: { kind: 'issue', id: task.id },
      actorUserId: 'alice',
      input: {
        type: 'signal',
        actor: { kind: 'system', id: 'system', name: 'Studio' },
        text: 'PR checks passed',
        payload: { trigger: 'prChecksPassed' },
      },
    });
    const [run] = await runs(task.id);
    expect(run.actorUserId).toBe('alice');
    expect((await h.agents.runs.detail(run.id)).inputs[0].actor.kind).toBe(
      'system',
    );
    const queued = await h.request('GET', `/issueProgress/${task.id}`, {
      user: 'bob',
    });
    expect(queued.body.data.waiting.reason).toBe('noRunner');
    const manager = await h.agents.agents.findWorkable(
      h.database.connection(),
      PM,
    );
    const registration = await h.agents.runners.createRegistrationToken('bob', {
      trust: 'ownerOnly',
    });
    const registered = await h.request('POST', '/agents/runners/register', {
      body: {
        registrationToken: registration.token,
        name: 'Bob team runner',
        hostname: 'test',
        os: 'linux',
        arch: 'x64',
        version: '0.0.1',
        protocolVersion: PROTOCOL_VERSION,
        slots: 1,
        features: ['input', 'checkout', 'directories', 'skills', 'secrets'],
        tools: [
          {
            kind: 'claude',
            authenticated: true,
            models: [{ id: manager!.modelEntries[0].model }],
          },
        ],
      },
    });
    expect(registered.status).toBe(200);
    expect(
      (await h.request('GET', `/issueProgress/${task.id}`, { user: 'bob' }))
        .body.data.waiting.reason,
    ).toBe('ownerHasNoRunner');
    const settings = await h.manager.settings();
    await h.manager.update('bob', {
      firstChoiceAgentId: null,
      fallbackAgentId: null,
    });
    expect(
      (await h.request('GET', `/issueProgress/${task.id}`, { user: 'bob' }))
        .body.data.waiting.reason,
    ).toBe('notConfigured');
    await h.manager.update('bob', {
      firstChoiceAgentId: settings.firstChoiceAgentId,
      fallbackAgentId: settings.fallbackAgentId,
    });
    await h.database
      .connection()
      .repository('user')
      .updateMany({
        filter: { id: 'alice' },
        values: { disabledAt: new Date().toISOString() },
      });
    const invalid = await h.request('GET', `/issueProgress/${task.id}`, {
      user: 'bob',
    });
    expect(invalid.body.data.waiting.reason).toBe('noOwner');
    await h.projects.comments.create(h.viewer('bob'), task.id, {
      content: 'Try again',
    });
    const activities = (
      await h.projects.issueQueries.activities(h.viewer('bob'), task.id, {})
    ).data;
    expect(activities).toContainEqual(
      expect.objectContaining({
        action: 'studio_execution_wait',
        details: expect.objectContaining({ reason: 'noOwner' }),
      }),
    );
    const claim = await h.request('POST', '/agents/runners/claim', {
      headers: { [HEADERS.runnerKey]: registered.body.data.runnerKey },
      body: { free: 1 },
    });
    expect(claim.status).toBe(200);
    expect(claim.body.data.runs).toEqual([]);
    expect((await h.agents.runs.get(run.id)).failureDetail).toBe('noOwner');
  });

  it('retries a delegated step as the new owner even when every original input was handled', async () => {
    const task = await issue();
    const worker = await h.createAgent({ name: 'Worker' });
    await h.projects.comments.create(
      { ...h.viewer('bob'), actor: { type: 'agent', id: PM } },
      task.id,
      { content: mention(worker) },
    );
    const [previous] = await runs(task.id);
    await h.agents.runs.cancel(previous.id, 'bob');
    await h.database
      .connection()
      .repository('agRunInputs')
      .updateMany({
        filter: { runId: previous.id },
        values: { handledAt: new Date().toISOString() },
      });
    const current = await h.projects.issueQueries.detail(
      h.viewer('bob'),
      task.id,
    );
    await h.projects.issues.update(h.viewer('bob'), task.id, {
      revision: current.revision,
      ownerUserId: 'bob',
      start: false,
    });
    const retry = await h.agents.runs.retry(previous.id, 'bob');
    expect(retry.actorUserId).toBe('bob');
    expect(
      (await h.agents.runs.detail(retry.id)).inputs.map((input) => input.type),
    ).toEqual(['retry']);
    const claimed = await h.claimOne();
    expect(claimed.run.id).toBe(retry.id);
    expect((await h.agents.runs.get(retry.id)).actorUserId).toBe('bob');
  });

  it('checks owner invocation permission and records denial without fallback', async () => {
    const task = await issue();
    const invoke = vi
      .spyOn(h.agents.agents, 'mayInvoke')
      .mockImplementation((_agent, userId) => userId !== 'alice');
    const started = await h.request(
      'POST',
      `/projectManager/issues/${task.id}/start`,
      { user: 'alice' },
    );
    expect(started.status).toBe(400);
    expect(await runs(task.id)).toEqual([]);
    expect(invoke).toHaveBeenCalledWith(
      expect.objectContaining({ id: PM }),
      'alice',
    );
    const now = await h.request('GET', `/issueProgress/${task.id}`, {
      user: 'bob',
    });
    expect(now.body.data.waiting.reason).toBe('notAllowed');
    expect(
      (await h.projects.issueQueries.activities(h.viewer('bob'), task.id, {}))
        .data,
    ).toContainEqual(
      expect.objectContaining({
        action: 'studio_execution_wait',
        actorId: 'alice',
        details: expect.objectContaining({ reason: 'notAllowed' }),
      }),
    );
  });
});
