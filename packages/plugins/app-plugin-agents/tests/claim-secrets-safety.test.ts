import { afterEach, expect, it, vi } from 'vitest';

import { findRunRecord, runsRepo } from '../server/core/runs/run.store.js';
import { requeueRun } from '../server/core/runs/transitions.js';
import { claim, createHarness, type Harness } from './harness.js';

let h: Harness;
afterEach(async () => {
  vi.restoreAllMocks();
  await h?.close();
});

const waitOf = async (id: string) =>
  (await h.services.runs.workload({ subjectKind: 'sample' })).runs.find(
    (run) => run.id === id,
  )?.wait?.reason;

it('skips a candidate whose authorization throws and takes the next run, with one refusal notice', async () => {
  h = await createHarness();
  const secretAgent = await h.createAgent();
  const plainAgent = await h.createAgent();
  await h.services.variables.set(
    { scope: 'agent', scopeId: secretAgent },
    'TOKEN',
    'synthetic',
    'owner',
  );
  const refused = await h.enqueue(secretAgent, '1', { actorUserId: 'bob' });
  const next = await h.enqueue(plainAgent, '2', { actorUserId: 'bob' });
  const runner = await h.registerRunner({
    trust: 'ownerOnly',
    ownerUserId: 'bob',
  });
  h.services.secretTrust.setAgentEditors(async () => {
    throw new Error('Authorization unavailable');
  });
  const notices: string[] = [];
  h.services.events.on('notice', ({ notice }) => {
    notices.push(notice.type);
  });
  expect((await claim(h, runner)).map((payload) => payload.run.id)).toEqual([
    next,
  ]);
  expect(await waitOf(refused)).toBe('secretsNotAllowed');
  expect(notices).toEqual(['run_secrets_not_allowed']);
  await claim(h, runner);
  expect(notices).toHaveLength(1);
});

it('gives back a delivery whose permission check throws, restores fields, and discards prepared git access', async () => {
  h = await createHarness();
  const agentId = await h.createAgent();
  h.services.scopes.register({
    key: 'team',
    title: { key: 'team', ns: 'test' },
    access: async () => ({ visible: true, manage: true }),
  });
  h.scopes = [{ scope: 'team', scopeId: '1' }];
  h.dirs = [
    {
      kind: 'repo',
      url: 'https://example.test/repo.git',
      defaultBranch: 'main',
      branch: 'agent/test',
      path: 'repo',
    },
  ];
  await h.services.variables.set(h.scopes[0], 'TOKEN', 'synthetic', 'owner');
  const id = await h.enqueue(agentId);
  const before = (await findRunRecord(h.services.tx.read(), id))!;
  const runner = await h.registerRunner({
    trust: 'ownerOnly',
    ownerUserId: 'owner',
  });
  const prepared = { token: 'synthetic-git-token' };
  const discard = vi.fn(async () => undefined);
  h.services.repoAccess.register({
    key: 'test',
    prepare: async () => prepared,
    forRun: async () => ({
      credentials: [
        {
          url: 'https://example.test/repo.git',
          username: 'test',
          password: prepared.token,
        },
      ],
    }),
    discard,
  });
  const check = h.services.secretTrust.mayReceive.bind(h.services.secretTrust);
  vi.spyOn(h.services.secretTrust, 'mayReceive')
    .mockImplementationOnce(check)
    .mockRejectedValueOnce(new Error('Scope lookup unavailable'));
  expect(await claim(h, runner)).toEqual([]);
  const after = (await findRunRecord(h.services.tx.read(), id))!;
  for (const field of [
    'tool',
    'modelService',
    'model',
    'effort',
    'requires',
    'payloadFingerprint',
    'directoryKey',
  ] as const)
    expect(after[field]).toEqual(before[field]);
  expect(after.status).toBe('queued');
  expect(after.claimFailures).toBe(0);
  expect(await waitOf(id)).toBe('secretsNotAllowed');
  expect(discard).toHaveBeenCalledWith(
    expect.objectContaining({ id }),
    prepared,
  );
  expect(
    (await h.services.runs.detail(id)).inputs.every(
      (input) => !input.deliveredAt,
    ),
  ).toBe(true);
  const tokens = await h.services.tx
    .read()
    .repository<{ revokedAt: string | null }>('agRunTokens')
    .findMany({ filter: { runId: id } });
  expect(tokens).not.toHaveLength(0);
  expect(tokens.every((token) => token.revokedAt !== null)).toBe(true);
});

it('never opens a scope that first gains variables after the held scope snapshot', async () => {
  h = await createHarness();
  const agentId = await h.createAgent();
  h.scopes = [{ scope: 'team', scopeId: 'untrusted' }];
  await h.services.variables.set(
    { scope: 'agent', scopeId: agentId },
    'OWN_TOKEN',
    'own',
    'owner',
  );
  await h.enqueue(agentId);
  const runner = await h.registerRunner({
    trust: 'ownerOnly',
    ownerUserId: 'owner',
  });
  const check = h.services.secretTrust.mayReceive.bind(h.services.secretTrust);
  let calls = 0;
  vi.spyOn(h.services.secretTrust, 'mayReceive').mockImplementation(
    async (conn, who, targets) => {
      const allowed = await check(conn, who, targets);
      if (++calls === 2)
        await h.services.variables.set(
          h.scopes[0],
          'LATE_TOKEN',
          'late',
          'owner',
        );
      return allowed;
    },
  );
  const [payload] = await claim(h, runner);
  expect(
    payload.workspace.env.map((value: { name: string }) => value.name),
  ).toEqual(['OWN_TOKEN']);
  expect(
    (await h.services.variables.audits(h.scopes[0])).some(
      (audit) => audit.action === 'deliver',
    ),
  ).toBe(false);
});

it('does no assembly or permission query while the runner has no slots', async () => {
  h = await createHarness();
  const agentId = await h.createAgent();
  const runner = await h.registerRunner({
    trust: 'ownerOnly',
    ownerUserId: 'owner',
    slots: 1,
  });
  await h.enqueue(agentId, '1');
  await claim(h, runner);
  await h.enqueue(agentId, '2');
  const assemble = vi.spyOn(
    h.services.subjects.get('sample')!.context,
    'assemble',
  );
  const trust = vi.spyOn(h.services.secretTrust, 'mayReceive');
  expect(await claim(h, runner)).toEqual([]);
  expect(assemble).not.toHaveBeenCalled();
  expect(trust).not.toHaveBeenCalled();
});

it('reuses the online runner snapshot across availability checks and skips variables when tools cannot fit', async () => {
  h = await createHarness();
  const agents = await Promise.all([h.createAgent(), h.createAgent()]);
  await h.registerRunner({ tools: [{ kind: 'codex', authenticated: true }] });
  const online = vi.spyOn(h.services.runners, 'online');
  const holding = vi.spyOn(h.services.variables, 'holding');
  const result = await h.services.availability(
    h.services.tx.read(),
    await Promise.all(agents.map((id) => h.services.agents.get(id))),
    'owner',
  );
  expect([...result.values()].every((entry) => !entry.online)).toBe(true);
  expect(online).toHaveBeenCalledTimes(1);
  expect(holding).not.toHaveBeenCalled();
});

it('rejects enqueue when only an untrusted personal runner is configured, but allows an offline team runner', async () => {
  h = await createHarness();
  const agentId = await h.createAgent();
  await h.services.variables.set(
    { scope: 'agent', scopeId: agentId },
    'TOKEN',
    'synthetic',
    'owner',
  );
  await h.registerRunner({ trust: 'ownerOnly', ownerUserId: 'bob' });
  await expect(
    h.enqueue(agentId, '1', { actorUserId: 'bob' }),
  ).rejects.toMatchObject({ code: 'SECRETS_NOT_ALLOWED' });
  const team = await h.registerRunner();
  await h.services.tx
    .read()
    .repository('agRunners')
    .updateMany({
      filter: { id: team.runnerId },
      values: { status: 'offline' },
    });
  expect(
    (
      await h.services.runs.get(
        await h.enqueue(agentId, '1', { actorUserId: 'bob' }),
      )
    ).status,
  ).toBe('queued');
});

it('rechecks permission errors in eligibility without blocking the other fitting runners', async () => {
  h = await createHarness();
  const agentId = await h.createAgent();
  await h.services.variables.set(
    { scope: 'agent', scopeId: agentId },
    'TOKEN',
    'synthetic',
    'owner',
  );
  await h.registerRunner({ trust: 'ownerOnly', ownerUserId: 'bob' });
  const team = await h.registerRunner();
  h.services.secretTrust.setAgentEditors(async () => {
    throw new Error('Permission failure');
  });
  expect(
    (
      await h.services.eligibility.runnersFor(
        h.services.tx.read(),
        await h.services.agents.get(agentId),
        { actorUserId: 'bob' },
      )
    ).map((runner) => runner.id),
  ).toEqual([team.runnerId]);
});

it('retries in its actor identity even when another identity has queued work on the same key', async () => {
  h = await createHarness();
  const agentId = await h.createAgent();
  const id = await h.enqueue(agentId);
  await h.services.runs.cancel(id, 'owner');
  await h.enqueue(agentId, '1', { actorUserId: 'bob' });
  const retry = await h.services.runs.retry(id, 'owner');
  expect(retry.actorUserId).toBe('owner');
  expect(retry.status).toBe('queued');
});

it('clears stale refusal records when new inputs arrive and when a dispatched run is requeued', async () => {
  h = await createHarness();
  const agentId = await h.createAgent();
  const id = await h.enqueue(agentId);
  await runsRepo(h.services.tx.read()).updateMany({
    filter: { id },
    values: { secretsRefusedBy: ['old'] },
  });
  await h.enqueue(agentId);
  expect(
    (await findRunRecord(h.services.tx.read(), id))?.secretsRefusedBy,
  ).toBeNull();
  const runner = await h.registerRunner();
  await claim(h, runner);
  await runsRepo(h.services.tx.read()).updateMany({
    filter: { id },
    values: { secretsRefusedBy: ['old'] },
  });
  await h.services.tx.run(async (unit) => {
    await requeueRun(
      unit,
      { clock: h.clock, subjects: h.services.subjects },
      (await findRunRecord(unit.conn, id))!,
      'runnerOffline',
    );
  });
  expect(
    (await findRunRecord(h.services.tx.read(), id))?.secretsRefusedBy,
  ).toBeNull();
});
