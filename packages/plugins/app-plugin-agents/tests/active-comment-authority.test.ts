import { afterEach, describe, expect, it } from 'vitest';
import { claim, createHarness, type Harness } from './harness.js';
import { runsRepo, inputsRepo } from '../server/core/runs/run.store.js';

const features = [
  'workspaceKey',
  'input',
  'steer',
  'checkout',
  'directories',
  'attachments',
  'skills',
  'secrets',
] as const;
describe('active comment source authority', () => {
  let h: Harness;
  afterEach(async () => h?.close());
  it('preserves authorized requester steering within the same root without granting owner execution', async () => {
    h = await createHarness();
    h.services.subjects.register({
      ...h.services.subjects.get('sample')!,
      kind: 'requester-sample',
      responsibleUserId: async () => 'owner',
      commentOwnerKey: async () => 'assignment',
      actsAs: async () => ({ actorUserId: 'owner' }),
    });
    const manager = await h.createAgent({ name: 'manager' });
    const worker = await h.createAgent({ name: 'worker' });
    const runner = await h.registerRunner({
      trust: 'ownerOnly',
      ownerUserId: 'bob',
      features,
    });
    await h.registerRunner({
      trust: 'ownerOnly',
      ownerUserId: 'owner',
      features,
    });
    const requested = await h.services.runs.enqueue({
      agentId: manager,
      subject: { kind: 'requester-sample', id: '1' },
      actorUserId: 'bob',
      ownerUserId: 'owner',
      comment: { ownerKey: 'assignment' },
      input: {
        type: 'comment',
        actor: { kind: 'user', id: 'bob', name: 'Requester' },
        text: 'Discuss',
        payload: { commentId: 'source' },
      },
    });
    const [permission] = await h.services.runs.requests.list({
      userId: 'owner',
      status: 'pending',
    });
    expect(permission).toMatchObject({ commentRootRunId: requested.runId });
    await h.services.runs.requests.reject(permission.id, 'owner');
    const { run: source } = await h.services.runs.requests.runAsRequester(
      permission.id,
      'bob',
    );
    await runsRepo(h.database.connection()).updateMany({
      filter: { id: source.runId! },
      values: { status: 'completed' },
    });
    const dispatch = (commentId: string, preferActive = false) =>
      h.services.runs.enqueue({
        agentId: worker,
        subject: { kind: 'requester-sample', id: '1' },
        actorUserId: 'bob',
        ownerUserId: 'owner',
        causedByRunId: source.runId!,
        preferActive,
        input: {
          type: 'comment',
          actor: { kind: 'agent', id: manager, name: 'Manager' },
          text: 'Discuss further',
          payload: { commentId },
        },
      });
    const original = await dispatch('original');
    const [payload] = await claim(h, runner);
    expect(payload.run.id).toBe(original.runId);
    await h.services.reports.start({ id: runner.runnerId }, payload.run.id, {
      workDir: '/work',
      acceptsInput: true,
    });
    expect(await dispatch('follow-up', true)).toMatchObject({
      runId: original.runId,
      outcome: 'appended',
    });
    expect(
      await runsRepo(h.database.connection()).findOne({
        filter: { id: original.runId! },
      }),
    ).toMatchObject({
      actorUserId: 'bob',
      commentExecution: 'requester',
      commentRootRunId: source.runId,
    });
  });
  it.each([
    'owner',
    'confirmed-source',
    'foreign-source',
    'owner-key',
    'mode',
    'pending-source',
    'rejected-source',
  ] as const)(
    'checks %s before crossing authorization roots',
    async (scenario) => {
      h = await createHarness();
      let key = 'assignment-1';
      const sample = h.services.subjects.get('sample')!;
      h.services.subjects.register({
        ...sample,
        kind: 'authorized-sample',
        actsAs: async () => ({ actorUserId: 'owner' }),
        responsibleUserId: async () => 'owner',
        commentOwnerKey: async () => key,
      });
      const manager = await h.createAgent({ name: 'manager' });
      const worker = await h.createAgent({ name: 'worker' });
      const foreign = [
        'confirmed-source',
        'foreign-source',
        'pending-source',
        'rejected-source',
      ].includes(scenario);
      const personal = await h.registerRunner({
        features,
        trust: 'ownerOnly',
        ownerUserId: 'owner',
      });
      const source = await h.services.runs.enqueue({
        agentId: manager,
        subject: { kind: 'authorized-sample', id: '1' },
        actorUserId: foreign ? 'bob' : 'owner',
        ownerUserId: 'owner',
        comment: { ownerKey: key },
        input: {
          type: 'comment',
          actor: {
            kind: 'user',
            id: foreign ? 'bob' : 'owner',
            name: 'Source',
          },
          text: 'Arrange work',
          payload: { commentId: 'source' },
        },
      });
      if (scenario === 'confirmed-source') {
        const requests = await h.services.runs.requests.list({
          userId: 'owner',
          status: 'pending',
        });
        await h.services.runs.requests.confirm(
          requests.find((r) => r.commentRootRunId === source.runId)!.id,
          'owner',
        );
      }
      await runsRepo(h.database.connection()).updateMany({
        filter: { id: source.runId! },
        values: { status: 'completed' },
      });
      const original = await h.services.runs.enqueue({
        agentId: worker,
        subject: { kind: 'authorized-sample', id: '1' },
        actorUserId: 'owner',
        ownerUserId: 'owner',
        comment: { ownerKey: key },
        input: {
          type: 'comment',
          actor: { kind: 'user', id: 'owner', name: 'Owner' },
          text: 'Do work',
          payload: { commentId: 'original' },
        },
      });
      const [payload] = await claim(h, personal);
      expect(payload.run.id).toBe(original.runId);
      await h.services.reports.start(
        { id: personal.runnerId },
        payload.run.id,
        { workDir: '/work', acceptsInput: true },
      );
      if (scenario === 'owner-key') key = 'assignment-2';
      if (scenario === 'mode')
        await runsRepo(h.database.connection()).updateMany({
          filter: { id: original.runId! },
          values: { commentExecution: 'requester' },
        });
      if (scenario === 'pending-source' || scenario === 'rejected-source') {
        const requests = await h.services.runs.requests.list({
          userId: 'owner',
          status: 'pending',
        });
        expect(requests.some((r) => r.commentRootRunId === source.runId)).toBe(
          true,
        );
        if (scenario === 'rejected-source')
          await h.services.runs.requests.reject(
            requests.find((r) => r.commentRootRunId === source.runId)!.id,
            'owner',
          );
      }
      const added = await h.services.runs.enqueue({
        agentId: worker,
        subject: { kind: 'authorized-sample', id: '1' },
        actorUserId: 'owner',
        ownerUserId: 'owner',
        causedByRunId: source.runId!,
        preferActive: true,
        comment: { ownerKey: key },
        input: {
          type: 'comment',
          actor: { kind: 'agent', id: manager, name: 'Manager' },
          text: 'Follow up',
          payload: { commentId: 'follow-up' },
        },
      });
      if (scenario === 'owner' || scenario === 'confirmed-source') {
        expect(added).toMatchObject({
          runId: original.runId,
          outcome: 'appended',
        });
        expect(
          (
            await inputsRepo(h.database.connection()).findMany({
              filter: { id: added.inputId! },
            })
          )[0]?.payload,
        ).toMatchObject({
          commentId: 'follow-up',
          commentRootRunId: original.runId,
        });
      } else {
        expect(added.runId).not.toBe(original.runId);
        expect(
          await inputsRepo(h.database.connection()).findMany({
            filter: { runId: original.runId! },
          }),
        ).toHaveLength(1);
      }
    },
  );
});
