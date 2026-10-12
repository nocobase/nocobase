// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HEADERS, PROTOCOL_VERSION } from '@nocobase/agent-protocol';
import { createBridgeHarness, type BridgeHarness } from './bridge-harness.js';
import { PROJECT_MANAGER_ID as PM } from '../../shared/project-manager.js';

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
  it('uses the owner for another user starting, commenting and retrying, with separate audit', async () => {
    const task = await issue();
    expect(
      (
        await h.request('POST', `/projectManager/issues/${task.id}/start`, {
          user: 'bob',
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
      requestedByUserId: 'bob',
      ownerUserId: 'alice',
    });
    expect(
      (await h.agents.runs.detail(run.id)).inputs.map(
        (input) => input.actor.id,
      ),
    ).toEqual(['bob', 'bob']);
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
    expect(switched.find((run) => run.id === chain.id)?.actorUserId).toBe(
      'carol',
    );
  });

  it('preserves queued inputs on owner changes and corrects legacy delegated data at claim', async () => {
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
    });
    expect((await h.agents.runs.get(run.id)).actorUserId).toBe('alice');
    expect(
      (await h.agents.runs.detail(run.id)).inputs.at(-1)?.payload,
    ).toMatchObject({ trigger: 'ownerChanged' });
    await h.projects.comments.create(
      {
        ...h.viewer('alice'),
        actor: { type: 'agent', id: PM, trace: { runId: run.id } },
      },
      task.id,
      { content: mention(worker) },
    );
    const following = (await runs(task.id)).find(
      (item) => item.id !== run.id && item.agentId === worker,
    )!;
    expect(following.actorUserId).toBe('bob');
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
    expect((await h.agents.runs.get(step.id)).actorUserId).toBe('carol');
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

  it('checks the owner permission, records denial and does not use the administrator who triggers it', async () => {
    const task = await issue();
    const invoke = vi
      .spyOn(h.agents.agents, 'mayInvoke')
      .mockImplementation((_agent, userId) => userId !== 'alice');
    const started = await h.request(
      'POST',
      `/projectManager/issues/${task.id}/start`,
      { user: 'bob' },
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
        actorId: 'bob',
        details: expect.objectContaining({ reason: 'notAllowed' }),
      }),
    );
  });
});
