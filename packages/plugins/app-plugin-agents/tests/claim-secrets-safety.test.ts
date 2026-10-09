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

const markTeamOnly = (scope: string, scopeId: string, name: string) =>
  h.services.variables.set({ scope, scopeId }, name, 'synthetic', 'owner', {
    teamRunnersOnly: true,
  });

it('does not deliver a variable marked team-only just before the claim transaction', async () => {
  h = await createHarness();
  const agentId = await h.createAgent();
  h.scopes = [{ scope: 'team', scopeId: 't-1' }];
  await h.services.variables.set(
    h.scopes[0],
    'API_TOKEN',
    'synthetic-test-value',
    'owner',
  );
  await h.enqueue(agentId);
  const runner = await h.registerRunner({
    trust: 'ownerOnly',
    ownerUserId: 'owner',
  });
  let marked = false;
  h.services.briefs.sections.register({
    key: 'mark-team-only',
    prepare: async () => {
      await h.services.variables.set(
        h.scopes[0],
        'API_TOKEN',
        undefined,
        'owner',
        { teamRunnersOnly: true },
      );
      marked = true;
      return null;
    },
    section: () => null,
  });
  const delivered = await claim(h, runner);
  expect(marked).toBe(true);
  expect(delivered).toEqual([]);
  expect(
    (await h.services.variables.audits(h.scopes[0])).some(
      (audit) => audit.action === 'deliver',
    ),
  ).toBe(false);
});

it('decides by the scope the real run inputs select', async () => {
  h = await createHarness();
  const agentId = await h.createAgent();
  await h.services.variables.set(
    { scope: 'team', scopeId: 't-1' },
    'API_TOKEN',
    'synthetic-test-value',
    'owner',
    { teamRunnersOnly: true },
  );
  const provider = h.services.subjects.get('sample')!.context;
  const assemble = provider.assemble.bind(provider);
  provider.assemble = async (conn, context) => ({
    ...(await assemble(conn, context)),
    scopes: context.inputs.length ? [{ scope: 'team', scopeId: 't-1' }] : [],
  });
  await h.enqueue(agentId);
  const personal = await h.registerRunner({
    trust: 'ownerOnly',
    ownerUserId: 'owner',
  });
  expect(await claim(h, personal)).toEqual([]);
  const [payload] = await claim(h, await h.registerRunner());
  expect(payload.workspace.env).toEqual([
    { name: 'API_TOKEN', value: 'synthetic-test-value' },
  ]);
});

it('passes over a team-only run on a personal runner and takes the next one, telling people once', async () => {
  h = await createHarness();
  const secretAgent = await h.createAgent();
  const plainAgent = await h.createAgent();
  await markTeamOnly('agent', secretAgent, 'TOKEN');
  const refused = await h.enqueue(secretAgent, '1', { actorUserId: 'bob' });
  const next = await h.enqueue(plainAgent, '2', { actorUserId: 'bob' });
  const runner = await h.registerRunner({
    trust: 'ownerOnly',
    ownerUserId: 'bob',
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

it('leaves a refused run as it was queued and discards the git access prepared for it', async () => {
  h = await createHarness();
  const agentId = await h.createAgent();
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
  await markTeamOnly('team', '1', 'TOKEN');
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
    'runnerId',
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
  // The transaction rolled back: no run token was left behind.
  expect(
    await h.services.tx
      .read()
      .repository('agRunTokens')
      .findMany({ filter: { runId: id } }),
  ).toHaveLength(0);
});

it('does no assembly while the runner has no slots', async () => {
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
  const teamOnly = vi.spyOn(h.services.variables, 'teamOnly');
  expect(await claim(h, runner)).toEqual([]);
  expect(assemble).not.toHaveBeenCalled();
  expect(teamOnly).not.toHaveBeenCalled();
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

it('queues team-only work whatever runners exist, and answers mayQueue for callers that ask first', async () => {
  h = await createHarness();
  const agentId = await h.createAgent();
  await markTeamOnly('agent', agentId, 'TOKEN');
  const agent = await h.services.agents.get(agentId);
  const asBob = { actorUserId: 'bob' };
  await h.registerRunner({ trust: 'ownerOnly', ownerUserId: 'bob' });
  expect(
    await h.services.eligibility.mayQueue(h.services.tx.read(), agent, asBob),
  ).toBe(false);
  const queued = await h.enqueue(agentId, '1', { actorUserId: 'bob' });
  expect((await h.services.runs.get(queued)).status).toBe('queued');
  // An offline team runner could still take it later.
  const team = await h.registerRunner();
  await h.services.tx
    .read()
    .repository('agRunners')
    .updateMany({
      filter: { id: team.runnerId },
      values: { status: 'offline' },
    });
  expect(
    await h.services.eligibility.mayQueue(h.services.tx.read(), agent, asBob),
  ).toBe(true);
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

it('clears the team-only variables noted on a run when new input arrives, when it is taken and when it is requeued', async () => {
  h = await createHarness();
  const agentId = await h.createAgent();
  const id = await h.enqueue(agentId);
  const note = () =>
    runsRepo(h.services.tx.read()).updateMany({
      filter: { id },
      values: {
        teamOnlyVariables: [{ scope: 'agent', scopeId: agentId, name: 'OLD' }],
      },
    });
  const noted = async () =>
    (await findRunRecord(h.services.tx.read(), id))?.teamOnlyVariables ?? null;
  await note();
  await h.enqueue(agentId);
  expect(await noted()).toBeNull();
  await note();
  const runner = await h.registerRunner();
  await claim(h, runner);
  expect(await noted()).toBeNull();
  await note();
  await h.services.tx.run(async (unit) => {
    await requeueRun(
      unit,
      { clock: h.clock, subjects: h.services.subjects },
      (await findRunRecord(unit.conn, id))!,
      'runnerOffline',
    );
  });
  expect(await noted()).toBeNull();
});
