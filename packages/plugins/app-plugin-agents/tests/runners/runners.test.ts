import {
  MIN_PROTOCOL_VERSION,
  PROTOCOL_VERSION,
} from '@nocobase/agent-protocol';
import { afterEach, describe, expect, it } from 'vitest';

import type { RunnerNotice } from '../../server/tokens.js';
import { claim, createHarness, type Harness } from './harness.js';

const registration = (token: string) => ({
  registrationToken: token,
  name: 'laptop',
  hostname: 'laptop.local',
  os: 'darwin',
  arch: 'arm64',
  version: '0.0.1',
  protocolVersion: PROTOCOL_VERSION,
  features: ['input'],
  tools: [{ kind: 'claude', authenticated: true }],
});

const heartbeat = {
  version: '0.0.2',
  features: ['input', 'steer'],
  tools: [{ kind: 'claude', authenticated: true }],
  active: [],
  load: { slots: 1, free: 1 },
};

describe('runners', () => {
  let h: Harness;
  afterEach(async () => {
    await h?.close();
  });

  it('registers once with a one-time token, keeping its trust, owner and reported tools', async () => {
    h = await createHarness();
    const token = await h.services.runners.createRegistrationToken('alice', {
      trust: 'ownerOnly',
    });
    const first = await h.request('POST', '/agents/runners/register', {
      body: registration(token.token),
    });
    expect(first.status).toBe(200);
    expect(first.body.data.runnerKey).toMatch(/^fgk_/u);
    const runner = await h.services.runners.get(first.body.data.runnerId);
    expect(runner).toMatchObject({
      trust: 'ownerOnly',
      ownerUserId: 'alice',
      tools: [{ kind: 'claude', authenticated: true }],
      status: 'online',
    });
    expect(runner).not.toHaveProperty('labels');

    const again = await h.request('POST', '/agents/runners/register', {
      body: registration(token.token),
    });
    expect(again.status).toBe(401);
    expect(again.body.error.reason).toBe('REGISTRATION_TOKEN_INVALID');
  });

  it('gives the runner the coding tools its token enables, whatever it reports', async () => {
    h = await createHarness();
    const register = async (input: {
      enabledTools?: readonly ('claude' | 'codex' | 'opencode' | 'pi')[] | null;
    }) => {
      const token = await h.services.runners.createRegistrationToken(
        'alice',
        input,
      );
      const response = await h.request('POST', '/agents/runners/register', {
        body: {
          ...registration(token.token),
          tools: [
            { kind: 'claude', authenticated: true },
            { kind: 'codex', authenticated: true },
          ],
        },
      });
      return { token, runnerId: response.body.data.runnerId as string };
    };

    const only = await register({ enabledTools: ['codex'] });
    expect(only.token.enabledTools).toEqual(['codex']);
    const runner = await h.services.runners.get(only.runnerId);
    expect(runner.enabledTools).toEqual(['codex']);
    // Every reported tool stays visible, enabled or not.
    expect(runner.tools.map((tool) => tool.kind)).toEqual(['claude', 'codex']);

    // No choice offers every tool.
    const plain = await h.services.runners.createRegistrationToken('alice', {});
    expect(plain.enabledTools).toBeNull();
    expect(
      (await h.services.runners.get((await register({})).runnerId))
        .enabledTools,
    ).toBeNull();
    // Choosing every tool is the same as not choosing: a tool added later is offered too.
    expect(
      (
        await h.services.runners.get(
          (
            await register({
              enabledTools: ['pi', 'opencode', 'codex', 'claude'],
            })
          ).runnerId,
        )
      ).enabledTools,
    ).toBeNull();
  });

  it('gives the runner the slots its token carries unless it names its own', async () => {
    h = await createHarness();
    const register = async (
      tokenSlots: number | null | undefined,
      slots?: number,
    ) => {
      const token = await h.services.runners.createRegistrationToken(
        'alice',
        tokenSlots === undefined ? {} : { slots: tokenSlots },
      );
      expect(token.slots).toBe(tokenSlots ?? null);
      const response = await h.request('POST', '/agents/runners/register', {
        body: {
          ...registration(token.token),
          ...(slots === undefined ? {} : { slots }),
        },
      });
      expect(response.body.data.slots).toBeDefined();
      const runner = await h.services.runners.get(response.body.data.runnerId);
      expect(response.body.data.slots).toBe(runner.slots);
      return runner.slots;
    };
    expect(await register(4)).toBe(4);
    expect(await register(4, 2)).toBe(2);
    expect(await register(null)).toBe(1);
    expect(await register(undefined, 3)).toBe(3);

    const created = await h.request(
      'POST',
      '/agents/runners/registrationTokens',
      { user: 'alice', body: { slots: 5 } },
    );
    expect(created.status).toBe(201);
    expect(created.body.data.slots).toBe(5);
    for (const slots of [0, 65, 1.5])
      expect(
        (
          await h.request('POST', '/agents/runners/registrationTokens', {
            user: 'alice',
            body: { slots },
          })
        ).status,
      ).toBe(400);
  });

  it('keeps the tool choice across heartbeats and changes it on request', async () => {
    h = await createHarness();
    const runner = await h.registerRunner({ enabledTools: ['codex'] });
    await h.request('POST', '/agents/runners/heartbeat', {
      runnerKey: runner.key,
      body: heartbeat,
    });
    expect(
      (await h.services.runners.get(runner.runnerId)).enabledTools,
    ).toEqual(['codex']);
    const updated = await h.services.runners.update(runner.runnerId, {
      enabledTools: ['codex', 'claude'],
    });
    expect(updated.enabledTools).toEqual(['claude', 'codex']);
    expect(
      (await h.services.runners.update(runner.runnerId, { enabledTools: [] }))
        .enabledTools,
    ).toEqual([]);
    expect(
      (await h.services.runners.update(runner.runnerId, { enabledTools: null }))
        .enabledTools,
    ).toBeNull();
  });

  it('shows whoever sees a runner what it takes work for and what it holds', async () => {
    h = await createHarness();
    const runner = await h.registerRunner();
    const agentId = await h.createAgent();
    const runId = await h.enqueue(agentId);
    await claim(h, runner);
    const list = await h.request('GET', '/agents/runners', {
      user: 'owner',
    });
    expect(list.body.data[0].takes).toEqual([{ id: agentId, name: 'Coder' }]);
    const work = await h.request(
      'GET',
      `/agents/runners/${runner.runnerId}/work`,
      { user: 'owner' },
    );
    expect(work.body.data).toEqual([
      expect.objectContaining({
        id: runId,
        kind: 'run',
        path: '/samples/1',
      }),
    ]);
    expect(
      (
        await h.request('GET', `/agents/runners/${runner.runnerId}/work`, {
          user: 'stranger',
        })
      ).status,
    ).toBe(404);
  });

  it('shows the host name and tool paths to the owner, the managers of runners and those who may use an agent', async () => {
    h = await createHarness();
    await h.createAgent({ access: 'users', userIds: ['user'] });
    const runner = await h.registerRunner({
      tools: [
        {
          kind: 'claude',
          version: '2.1.0',
          path: '/Users/alice/.local/bin/claude',
          authenticated: true,
        },
      ],
    });
    const view = async (user: string, can: readonly string[] = []) =>
      (
        await h.request('GET', `/agents/runners/${runner.runnerId}`, {
          user,
          can,
        })
      ).body.data;

    for (const manager of [
      await view('owner'),
      await view('admin', ['agents.runners/manage']),
      await view('user', ['agents.runners/read']),
    ]) {
      expect(manager.hostname).toBe('host');
      expect(manager.tools).toEqual([
        expect.objectContaining({ path: '/Users/alice/.local/bin/claude' }),
      ]);
    }
    const reader = await view('reader', ['agents.agents/read']);
    expect(reader).toMatchObject({ name: 'runner', canManage: false });
    expect(reader.hostname).toBeNull();
    expect(reader.tools).toEqual([
      { kind: 'claude', version: '2.1.0', authenticated: true },
    ]);
    expect(JSON.stringify(reader)).not.toContain('/Users/alice');
    const list = await h.request('GET', '/agents/runners', {
      user: 'reader',
      can: ['agents.runners/read'],
    });
    expect(list.body.data[0].hostname).toBeNull();
    expect(JSON.stringify(list.body.data)).not.toContain('/Users/alice');
    const usersList = await h.request('GET', '/agents/runners', {
      user: 'user',
      can: ['agents.runners/read'],
    });
    expect(usersList.body.data[0].hostname).toBe('host');
  });

  it('lists a runner’s latest runs, newest first, whatever their status', async () => {
    h = await createHarness();
    const runner = await h.registerRunner();
    const agentId = await h.createAgent();
    const runId = await h.enqueue(agentId);
    await claim(h, runner);
    const runs = await h.request(
      'GET',
      `/agents/runners/${runner.runnerId}/runs`,
      { user: 'owner' },
    );
    expect(runs.status).toBe(200);
    expect(runs.body.data).toEqual([
      expect.objectContaining({
        id: runId,
        title: 'Coder',
        status: 'dispatched',
        path: '/samples/1',
      }),
    ]);
    expect(
      (
        await h.request('GET', `/agents/runners/${runner.runnerId}/runs`, {
          user: 'stranger',
        })
      ).status,
    ).toBe(404);
  });

  it('says whether the application gives runners jobs', async () => {
    h = await createHarness();
    await h.registerRunner();
    const offers = async () =>
      (await h.request('GET', '/agents/runners', { user: 'owner' })).body
        .data[0].offersJobs;
    expect(await offers()).toBe(false);
    h.services.jobs.register('preview.build', { executor: 'build' });
    expect(await offers()).toBe(true);
  });

  it('refuses an expired token', async () => {
    h = await createHarness();
    const token = await h.services.runners.createRegistrationToken(null, {});
    h.clock.advance(11 * 60_000);
    const late = await h.request('POST', '/agents/runners/register', {
      body: registration(token.token),
    });
    expect(late.status).toBe(401);
  });

  it('keeps a runner of an unsupported protocol connected as upgrade_required, gives it no work, and tells its owner once', async () => {
    h = await createHarness();
    const notices: RunnerNotice[] = [];
    h.services.events.on('notice', (event) => notices.push(event.notice));
    const cleared: unknown[] = [];
    h.services.events.on('notice.cleared', (event) =>
      cleared.push(event.notice),
    );
    await h.enqueue(await h.createAgent());
    const old = MIN_PROTOCOL_VERSION - 1;
    const headers = { 'x-nocobase-protocol': String(old) };

    // It registers, with features this application does not know dropped rather than refused.
    const token = await h.services.runners.createRegistrationToken('alice', {
      trust: 'team',
    });
    const registered = await h.request('POST', '/agents/runners/register', {
      headers,
      body: {
        ...registration(token.token),
        protocolVersion: old,
        features: ['input', 'environments'],
        labels: ['gpu'],
      },
    });
    expect(registered.status).toBe(200);
    const key = registered.body.data.runnerKey as string;
    const id = registered.body.data.runnerId as string;
    expect(await h.services.runners.get(id)).toMatchObject({
      status: 'upgrade_required',
      protocolVersion: old,
      features: ['input'],
    });
    expect(notices).toEqual([
      expect.objectContaining({
        type: 'runner_upgrade_required',
        userIds: ['alice'],
        subject: { kind: 'runner', id, label: 'laptop' },
        params: expect.objectContaining({
          protocolVersion: old,
          minProtocolVersion: MIN_PROTOCOL_VERSION,
          maxProtocolVersion: PROTOCOL_VERSION,
          runnerVersion: '0.0.1',
        }),
      }),
    ]);

    // Heartbeats are answered with the verdict; whatever it holds is released.
    const beat = await h.request('POST', '/agents/runners/heartbeat', {
      runnerKey: key,
      headers,
      body: { ...heartbeat, active: [{ runId: 'r1' }], extra: true },
    });
    expect(beat.status).toBe(200);
    expect(beat.body.data).toMatchObject({
      ok: true,
      compatibility: {
        status: 'upgradeRequired',
        runnerProtocolVersion: old,
        minProtocolVersion: MIN_PROTOCOL_VERSION,
        protocolVersion: PROTOCOL_VERSION,
      },
      release: ['r1'],
    });
    // Claims find no work, and run reports are refused.
    const claimed = await h.request('POST', '/agents/runners/claim', {
      runnerKey: key,
      headers,
      body: { free: 1 },
    });
    expect(claimed.body.data).toEqual({ runs: [] });
    const report = await h.request('POST', '/agents/runners/runs/r1/lease', {
      runnerKey: key,
      headers,
      body: {},
    });
    expect(report.status).toBe(400);
    expect(report.body.error.reason).toBe('PROTOCOL_UNSUPPORTED');
    // The runtimes page says what it needs.
    const listed = await h.request('GET', `/agents/runners/${id}`, {
      user: 'alice',
    });
    expect(listed.body.data).toMatchObject({
      status: 'upgrade_required',
      protocolVersion: old,
      requiredProtocol: { min: MIN_PROTOCOL_VERSION, max: PROTOCOL_VERSION },
    });
    // Silent, it goes offline; calling again it is still told, but its owner is not told twice.
    h.clock.advance(200_000);
    await h.services.runners.markOffline(
      new Date(h.clock.now().getTime() - 150_000),
    );
    expect((await h.services.runners.get(id)).status).toBe('offline');
    await h.request('POST', '/agents/runners/heartbeat', {
      runnerKey: key,
      headers,
      body: heartbeat,
    });
    expect((await h.services.runners.get(id)).status).toBe('upgrade_required');
    expect(new Set(notices.map((notice) => notice.key)).size).toBe(1);

    // Upgraded, it is online and takes the queued run.
    const upgraded = await h.request('POST', '/agents/runners/claim', {
      runnerKey: key,
      body: { free: 1 },
    });
    expect(upgraded.body.data.runs).toHaveLength(1);
    expect(await h.services.runners.get(id)).toMatchObject({
      status: 'online',
      protocolVersion: PROTOCOL_VERSION,
    });
    // Its owner's notice is over, once.
    expect(cleared).toEqual([
      {
        type: 'runner_upgrade_required',
        subject: { kind: 'runner', id, label: 'laptop' },
      },
    ]);
    await h.request('POST', '/agents/runners/heartbeat', {
      runnerKey: key,
      body: heartbeat,
    });
    expect(cleared).toHaveLength(1);
  });

  it('refuses a runner whose owner can no longer act, until they can again', async () => {
    h = await createHarness();
    const disabled = new Set<string>(['alice']);
    h.services.people.provide({
      names: () => Promise.resolve(new Map()),
      list: () => Promise.resolve([]),
      inactive: (_conn, ids) =>
        Promise.resolve(new Set(ids.filter((id) => disabled.has(id)))),
    });
    const runner = await h.registerRunner({ ownerUserId: 'alice' });
    const refused = await h.request('POST', '/agents/runners/heartbeat', {
      runnerKey: runner.key,
      body: heartbeat,
    });
    expect(refused.status).toBe(401);
    expect(refused.body.error.reason).toBe('RUNNER_OWNER_DISABLED');
    disabled.clear();
    const accepted = await h.request('POST', '/agents/runners/heartbeat', {
      runnerKey: runner.key,
      body: heartbeat,
    });
    expect(accepted.status).toBe(200);
  });

  it('takes heartbeats, then refuses a revoked runner', async () => {
    h = await createHarness();
    const runner = await h.registerRunner();
    const beat = await h.request('POST', '/agents/runners/heartbeat', {
      runnerKey: runner.key,
      body: heartbeat,
    });
    expect(beat.status).toBe(200);
    expect(beat.body.data).toMatchObject({
      ok: true,
      cancelRequested: [],
      release: [],
    });
    expect(await h.services.runners.get(runner.runnerId)).toMatchObject({
      version: '0.0.2',
      features: ['input', 'steer'],
    });

    const unknown = await h.request('POST', '/agents/runners/heartbeat', {
      runnerKey: 'fgk_nope',
      body: heartbeat,
    });
    expect(unknown.status).toBe(401);
    expect(unknown.body.error.reason).toBe('RUNNER_KEY_INVALID');

    await h.services.runners.revoke(runner.runnerId);
    const revoked = await h.request('POST', '/agents/runners/heartbeat', {
      runnerKey: runner.key,
      body: heartbeat,
    });
    expect(revoked.status).toBe(401);
    expect(revoked.body.error.reason).toBe('RUNNER_REVOKED');
  });

  it('marks silent runners offline and brings them back when they call', async () => {
    h = await createHarness();
    const runner = await h.registerRunner();
    h.clock.advance(151_000);
    expect((await h.services.sweeper.sweep()).runnersOffline).toBe(1);
    expect((await h.services.runners.get(runner.runnerId)).status).toBe(
      'offline',
    );
    await h.request('POST', '/agents/runners/heartbeat', {
      runnerKey: runner.key,
      body: heartbeat,
    });
    expect((await h.services.runners.get(runner.runnerId)).status).toBe(
      'online',
    );
  });
});
