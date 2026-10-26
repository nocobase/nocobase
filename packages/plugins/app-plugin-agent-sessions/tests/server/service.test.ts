import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { BridgeSession } from '@nocobase/acp-bridge';
import { BRIDGE_PROTOCOL_VERSION } from '@nocobase/acp-bridge/protocol';
import type {
  BridgeEvent,
  RegisterRequest,
  ReplyRequest,
  ReportRequest,
} from '@nocobase/acp-bridge/protocol';
import type { DatabaseManager } from '@nocobase/db';
import { describe, expect, vi } from 'vitest';

import type { AgentSessionsChange } from '../../shared/api.js';
import {
  AgentSessionsService,
  type LinkResolver,
} from '../../server/service.js';
import { test } from '../helpers/database.js';
import { bridgeReport } from '../helpers/bridge-report.js';

const T0 = Date.parse('2026-10-13T08:00:00.000Z');
const owner = { userId: 'u1', locale: 'en-US' };
const stranger = { userId: 'u2' };
const signal = new AbortController().signal;
const text = (value: string) => [{ type: 'text' as const, text: value }];

function setup(database: DatabaseManager) {
  const clock = { now: T0 };
  const changes: [string, AgentSessionsChange][] = [];
  const service = new AgentSessionsService({
    database,
    now: () => clock.now,
    publish: (userId, change) => changes.push([userId, change]),
  });
  const register = (
    userId = 'u1',
    overrides: Partial<RegisterRequest> = {},
    keyed = false,
  ) =>
    service.register(
      userId,
      {
        protocol: BRIDGE_PROTOCOL_VERSION,
        computerId: null,
        bridgeStartedAt: 'bridge-1',
        computer: {
          name: 'Laptop',
          platform: 'darwin',
          arch: 'arm64',
          host: 'nb-studio 1.0.0',
          home: '/home/zhou',
          roots: ['/home/zhou'],
          agents: [
            { id: 'codex', name: 'Codex', version: '2.2.2' },
            {
              id: 'opencode',
              name: 'OpenCode',
              version: null,
              problem: 'notInstalled',
            },
          ],
        },
        ...overrides,
      },
      keyed,
    );
  let batch = 0;
  const report = (
    computerId: string,
    sessionId: string,
    events: BridgeEvent[],
    extra: Partial<ReportRequest> = {},
  ) =>
    bridgeReport(service, 'u1', {
      computerId,
      sessionId,
      batch: ++batch,
      bridgeStartedAt: 'bridge-1',
      events,
      state: null,
      ...extra,
    });
  const take = (computerId: string) =>
    service
      .poll(
        'u1',
        {
          computerId,
          wait: false,
          protocol: BRIDGE_PROTOCOL_VERSION,
          bridgeStartedAt: 'bridge-1',
        },
        signal,
      )
      .then((r) => r.commands);
  async function started() {
    const { computerId } = await register();
    const session = await service.createSession(owner, {
      computerId,
      agentId: 'codex',
      cwd: '/home/zhou/code',
      content: text('Fix the board\nand more'),
    });
    return { computerId, session };
  }
  return { service, clock, changes, register, report, take, started };
}

const at = '2026-10-13T08:00:01.000Z';
const chunk = (value: string): BridgeEvent => ({
  kind: 'update',
  at,
  update: {
    sessionUpdate: 'agent_message_chunk',
    messageId: 'm1',
    content: { type: 'text', text: value },
  },
});

describe('AgentSessionsService', () => {
  for (const connection of ['connected', 'reopened', 'invalid']) {
    test(`persists acknowledged dependent choices through ${connection} model changes and reopening`, async ({
      database,
    }) => {
      const { service, register, report, take } = setup(database);
      const root = await mkdtemp(path.join(os.tmpdir(), 'session-settings-'));
      const log = path.join(root, 'trace.jsonl');
      const { computerId } = await register('u1', {
        computer: {
          name: 'Test',
          platform: process.platform,
          arch: process.arch,
          host: 'Test',
          home: root,
          roots: [root],
          agents: [{ id: 'fake', name: 'Fake', version: null }],
        },
      });
      const created = await service.createSession(owner, {
        computerId,
        agentId: 'fake',
        cwd: root,
        settings: {
          model: connection === 'invalid' ? 'second' : 'first',
          effort: 'low',
          mode: 'full',
        },
        content: text('first'),
      });
      let bridge: BridgeSession | undefined;
      let reports = Promise.resolve();
      const events: BridgeEvent[] = [];
      const run = async () => {
        for (const command of await take(computerId)) {
          if (!('session' in command))
            throw new Error('Expected session command');
          bridge ??= new BridgeSession(command.session, {
            client: { name: 'test', version: '0' },
            server: 'https://example.invalid',
            env: { ...process.env, FAKE_VARIANT: 'dependent', FAKE_LOG: log },
            roots: [root],
            resolve: async () => ({
              spec: {
                id: 'fake',
                name: 'Fake',
                launchers: [],
                modes: ['full'],
                signIn: 'fake login',
              },
              command: process.execPath,
              args: [
                path.resolve(
                  import.meta.dirname,
                  '../../../../libs/acp-bridge/tests/fixtures/fake-agent.mjs',
                ),
              ],
            }),
            emit: (event) => {
              events.push(event);
              enqueue([event]);
            },
            stateChanged: () => enqueue([]),
          });
          bridge.handle(command);
        }
      };
      const enqueue = (added: BridgeEvent[]) => {
        const state = bridge?.state ?? null;
        reports = reports.then(async () => {
          await report(computerId, created.id, added, { state });
        });
      };
      const completed = async (count: number) => {
        await vi.waitFor(
          () =>
            expect(
              events.filter((event) => event.kind === 'turnEnded'),
            ).toHaveLength(count),
          { timeout: 10000 },
        );
        await reports;
      };
      try {
        await run();
        await completed(1);
        if (connection === 'invalid') {
          expect(
            events.filter((event) => event.kind === 'turnEnded'),
          ).toMatchObject([
            { error: expect.stringContaining('no longer supports') },
          ]);
          const saved = await service.getSession(owner, created.id);
          expect(saved.settings).toEqual({
            model: 'second',
            effort: 'low',
            mode: 'full',
          });
          expect(saved.state).toBeNull();
          expect(
            (await readFile(log, 'utf8'))
              .split('\n')
              .filter((line) => line && JSON.parse(line).method === 'prompt'),
          ).toEqual([]);
          return;
        }
        if (connection === 'reopened') {
          await bridge?.close();
          bridge = undefined;
        }
        await service.choose(owner, created.id, {
          choiceId: 'model',
          value: 'second',
        });
        // Desired changes are not saved before the agent acknowledges the full resulting configuration.
        expect((await service.getSession(owner, created.id)).settings).toEqual({
          model: 'first',
          effort: 'low',
          mode: 'full',
        });
        await run();
        await vi.waitFor(
          async () => {
            await reports;
            expect(
              (await service.getSession(owner, created.id)).settings,
            ).toEqual({ model: 'second', effort: 'high', mode: 'full' });
          },
          { timeout: 10000 },
        );
        await bridge?.close();
        bridge = undefined;
        await service.prompt(owner, created.id, text('continue'));
        await run();
        await completed(2);
        expect(
          events.filter((event) => event.kind === 'turnEnded'),
        ).toMatchObject([{ error: null }, { error: null }]);
        const trace = (await readFile(log, 'utf8'))
          .trim()
          .split('\n')
          .map(
            (line) =>
              JSON.parse(line) as {
                method: string;
                pid: number;
                params: { configId?: string; value?: string };
              },
          );
        const prompts = trace.filter((entry) => entry.method === 'prompt');
        expect(prompts).toHaveLength(2);
        const reopening = trace.filter(
          (entry) => entry.pid === prompts[1]!.pid,
        );
        expect(reopening).toContainEqual(
          expect.objectContaining({
            method: 'set',
            params: expect.objectContaining({
              configId: 'model',
              value: 'second',
            }),
          }),
        );
        expect(
          reopening.findIndex(
            (entry) =>
              entry.method === 'set' &&
              entry.params.configId === 'model' &&
              entry.params.value === 'second',
          ),
        ).toBeLessThan(
          reopening.findIndex((entry) => entry.method === 'prompt'),
        );
        expect((await service.getSession(owner, created.id)).settings).toEqual({
          model: 'second',
          effort: 'high',
          mode: 'full',
        });
      } finally {
        await bridge?.close();
        await reports;
        await rm(root, { recursive: true, force: true });
      }
    });
  }

  test('publishes registration changes and recovery, but not an unchanged scan', async ({
    database,
  }) => {
    const { service, register, clock, changes } = setup(database);
    const { computerId } = await register();
    changes.length = 0;
    await register('u1', { computerId }, true);
    expect(changes).toEqual([]);
    await register('u1', { computerId, bridgeStartedAt: 'bridge-2' });
    expect(
      changes.filter(([, change]) => change.kind === 'computers'),
    ).toHaveLength(1);
    changes.length = 0;
    clock.now += 120_000;
    await register('u1', { computerId, bridgeStartedAt: 'bridge-2' });
    expect(
      changes.filter(([, change]) => change.kind === 'computers'),
    ).toHaveLength(1);
    expect((await service.listComputers('u1'))[0]?.online).toBe(true);
  });

  test('ignores discovered agent key order but publishes changed values', async ({
    database,
  }) => {
    const { service, register, changes } = setup(database);
    const computer = {
      name: 'Laptop',
      platform: 'linux',
      arch: 'x64',
      host: 'test-bridge',
      roots: ['/workspace'],
      agents: [{ id: 'codex', name: 'Codex', version: '1.0.0' }],
    };
    const { computerId } = await register('u1', { computer });
    changes.length = 0;
    await register(
      'u1',
      {
        computerId,
        computer: {
          ...computer,
          agents: [{ version: '1.0.0', name: 'Codex', id: 'codex' }],
        },
      },
      true,
    );
    expect(changes).toEqual([]);
    await register(
      'u1',
      {
        computerId,
        computer: {
          ...computer,
          agents: [{ version: '2.0.0', name: 'Codex', id: 'codex' }],
        },
      },
      true,
    );
    expect(changes).toEqual([['u1', { kind: 'computers' }]]);
    expect((await service.listComputers('u1'))[0]?.agents[0]?.version).toBe(
      '2.0.0',
    );
  });

  test('stops waiting after discovery cancellation without assuming the queued command was cancelled', async ({
    database,
  }) => {
    const { service, register, take } = setup(database);
    const { computerId } = await register();
    const stop = new AbortController();
    const pending = service.discoverChoices(
      'u1',
      computerId,
      { agentId: 'codex', cwd: '/home/zhou', settings: {} },
      stop.signal,
    );
    const rejected = pending.catch((error: unknown) => error);
    let queued:
      import('@nocobase/acp-bridge/protocol').BridgeCommand | undefined;
    await vi.waitFor(async () => {
      [queued] = await take(computerId);
      expect(queued?.type).toBe('discoverChoices');
    });
    stop.abort();
    expect(await rejected).toMatchObject({ name: 'AbortError' });
    expect(queued?.type).toBe('discoverChoices');
  });

  test('discovers a fresh computer without a Studio session and carries settings to the first prompt', async ({
    database,
  }) => {
    const { service, register, take } = setup(database);
    const { computerId } = await register();
    const input = {
      agentId: 'codex',
      cwd: '/home/zhou/code/../code',
      settings: { model: 'actual' },
    };
    const pending = service.discoverChoices('u1', computerId, input);
    let command:
      import('@nocobase/acp-bridge/protocol').BridgeCommand | undefined;
    await vi.waitFor(async () => {
      [command] = await take(computerId);
      expect(command?.type).toBe('discoverChoices');
    });
    if (command?.type !== 'discoverChoices')
      throw new Error('Missing discovery command');
    expect(command).toMatchObject({
      cwd: '/home/zhou/code',
      settings: input.settings,
    });
    const discovery = {
      status: 'available' as const,
      choices: [
        {
          id: 'model',
          category: 'model',
          name: 'Model',
          currentValue: 'actual',
          options: [{ value: 'actual', name: 'Actual' }],
        },
      ],
    };
    await service.reply('u1', {
      computerId,
      requestId: command.requestId,
      listing: null,
      error: null,
      discovery,
    });
    expect(await pending).toEqual(discovery);
    expect(
      (await service.listSessions(owner, { archived: false, pageSize: 50 }))
        .sessions,
    ).toEqual([]);
    expect((await service.listComputers('u1'))[0]?.choices).toEqual({});
    const session = await service.createSession(owner, {
      computerId,
      ...input,
      content: text('first'),
    });
    expect(await take(computerId)).toMatchObject([
      {
        type: 'prompt',
        session: { id: session.id, settings: { model: 'actual' } },
      },
    ]);
  });

  test('names the new session a discovery is for, so its bridge keeps the agent for that session', async ({
    database,
  }) => {
    const { service, register, take } = setup(database);
    const { computerId } = await register();
    const sessionId = '0f6f4bb5-3a7c-4d22-9c55-6f6c2d1a9b10';
    const input = { agentId: 'codex', cwd: '/home/zhou/code', settings: {} };
    void service
      .discoverChoices('u1', computerId, { ...input, sessionId })
      .catch(() => undefined);
    await vi.waitFor(async () =>
      expect(await take(computerId)).toMatchObject([
        { type: 'discoverChoices', sessionId },
      ]),
    );
    // A message sent from those choices creates the session with that id.
    const session = await service.createSession(owner, {
      submissionId: sessionId,
      computerId,
      ...input,
      content: text('first'),
    });
    expect(session.id).toBe(sessionId);
    expect(await take(computerId)).toMatchObject([
      { type: 'prompt', session: { id: sessionId, acpSessionId: null } },
    ]);
  });

  test('lists only the viewer’s sessions tied to one record', async ({
    database,
  }) => {
    const { service, register, started } = setup(database);
    const { computerId, session: tied } = await started();
    const other = await service.createSession(owner, {
      computerId,
      agentId: 'codex',
      cwd: '/home/zhou/code',
      content: text('Something else'),
    });
    await service.link(tied.id, 'issue', '42');
    await service.link(other.id, 'issue', '7');
    // Another person's session tied to the same record is not theirs to see.
    const { computerId: theirs } = await register('u2');
    const strangers = await service.createSession(stranger, {
      computerId: theirs,
      agentId: 'codex',
      cwd: '/home/zhou/code',
      content: text('Theirs'),
    });
    await service.link(strangers.id, 'issue', '42');
    const linked = (value: string) =>
      service
        .listSessions(owner, { archived: false, pageSize: 20, linked: value })
        .then((page) => page.sessions.map((session) => session.id));
    expect(await linked('issue:42')).toEqual([tied.id]);
    expect(await linked('issue:404')).toEqual([]);
    expect(
      (
        await service.listSessions(stranger, {
          archived: false,
          pageSize: 20,
          linked: 'issue:42',
        })
      ).sessions.map((session) => session.id),
    ).toEqual([strangers.id]);
    await service.updateSession(owner, tied.id, { archived: true });
    expect(await linked('issue:42')).toEqual([]);
  });

  test('shows what the bridge is doing to open the agent until it is open', async ({
    database,
  }) => {
    const { service, report, started } = setup(database);
    const { computerId, session } = await started();
    expect(session.startup).toBeNull();
    await report(computerId, session.id, [], { startup: 'starting' });
    expect((await service.getSession(owner, session.id)).startup).toBe(
      'starting',
    );
    // A report that does not say, as from an older bridge, leaves it.
    await report(computerId, session.id, []);
    expect((await service.getSession(owner, session.id)).startup).toBe(
      'starting',
    );
    await report(computerId, session.id, [], { startup: null });
    expect((await service.getSession(owner, session.id)).startup).toBeNull();
  });

  test('checks discovery ownership, installation, offline state and allowed directories before queueing', async ({
    database,
  }) => {
    const { service, register, take, clock } = setup(database);
    const { computerId } = await register();
    const input = { agentId: 'codex', cwd: '/home/zhou/code', settings: {} };
    await expect(
      service.discoverChoices('u2', computerId, input),
    ).rejects.toMatchObject({ key: 'computerNotFound' });
    await expect(
      service.discoverChoices('u1', computerId, {
        ...input,
        agentId: 'opencode',
      }),
    ).rejects.toMatchObject({ key: 'agentUnavailable' });
    await service.updateComputer('u1', computerId, {
      folders: ['/home/zhou/code'],
    });
    for (const cwd of ['/etc', '/home/zhou/other', 'code'])
      await expect(
        service.discoverChoices('u1', computerId, { ...input, cwd }),
      ).rejects.toMatchObject({ key: 'directoryNotAllowed' });
    clock.now += 61_000;
    await expect(
      service.discoverChoices('u1', computerId, input),
    ).rejects.toMatchObject({ key: 'computerOffline' });
    expect(await take(computerId)).toEqual([]);
  });
  test('registers a computer once per bridge, and anew for someone else', async ({
    database,
  }) => {
    const { service, register } = setup(database);
    const { computerId, key } = await register();
    // Registered by its owner signed in, the computer gets a new key each time.
    const again = await register('u1', { computerId });
    expect(again).toEqual({ computerId, key: expect.stringMatching(/^nbc_/u) });
    expect(again.key).not.toBe(key);
    const theirs = await register('u2', { computerId });
    expect(theirs.computerId).not.toBe(computerId);
    await expect(service.listComputers('u1')).resolves.toMatchObject([
      { id: computerId, online: true },
    ]);
    await expect(register('u1', { protocol: 99 })).rejects.toMatchObject({
      key: 'upgradeRequired',
    });
  });

  test('starts a session with its first message queued for the computer', async ({
    database,
  }) => {
    const { started, take } = setup(database);
    const { computerId, session } = await started();
    expect(session).toMatchObject({
      title: 'Fix the board',
      titleSource: 'message',
      lastSeq: 1,
      running: false,
    });

    const [command] = await take(computerId);
    expect(command).toMatchObject({
      type: 'prompt',
      content: text('Fix the board\nand more'),
      session: {
        id: session.id,
        agentId: 'codex',
        cwd: '/home/zhou/code',
        acpSessionId: null,
        settings: {},
      },
    });
    await expect(take(computerId)).resolves.toEqual([]);
  });

  test('refuses what the computer cannot run', async ({ database }) => {
    const { service, clock, register } = setup(database);
    const { computerId } = await register();
    const input = {
      computerId,
      agentId: 'codex',
      cwd: '/home/zhou',
      content: text('hi'),
    };
    await expect(
      service.createSession(owner, { ...input, agentId: 'opencode' }),
    ).rejects.toMatchObject({
      key: 'agentUnavailable',
    });
    await expect(
      service.createSession(owner, { ...input, cwd: '/etc' }),
    ).rejects.toMatchObject({
      key: 'directoryNotAllowed',
    });
    await expect(service.createSession(stranger, input)).rejects.toMatchObject({
      key: 'computerNotFound',
    });
    clock.now += 2 * 60_000;
    await expect(service.createSession(owner, input)).rejects.toMatchObject({
      key: 'computerOffline',
    });
  });

  test('wakes a waiting poll as soon as a command is queued', async ({
    database,
  }) => {
    const { service, started, take } = setup(database);
    const { computerId, session } = await started();
    const first = (
      await service.listEvents('u1', session.id, { after: 0, limit: 10 })
    )[0]!;
    if (first.kind !== 'prompt') throw new Error('Expected prompt');
    await service.claim('u1', {
      computerId,
      sessionId: session.id,
      seq: first.seq,
      promptId: first.promptId,
      protocol: BRIDGE_PROTOCOL_VERSION,
      bridgeStartedAt: 'bridge-1',
    });
    await take(computerId);
    const waiting = service.poll(
      'u1',
      {
        computerId,
        wait: true,
        protocol: BRIDGE_PROTOCOL_VERSION,
        bridgeStartedAt: 'bridge-1',
      },
      signal,
    );
    setTimeout(() => void service.cancel('u1', session.id, first.promptId), 50);
    const before = Date.now();
    await expect(waiting).resolves.toMatchObject({
      commands: [{ type: 'cancel' }],
    });
    expect(Date.now() - before).toBeLessThan(2_000);
  });

  test('appends what the bridge reports, once, growing a streamed message in place', async ({
    database,
  }) => {
    const { service, started, report } = setup(database);
    const { computerId, session } = await started();
    await report(computerId, session.id, [
      { kind: 'turnStarted', at, promptId: 'p1' },
      chunk('Hel'),
    ]);
    await report(computerId, session.id, [chunk('lo')], {
      state: {
        acpSessionId: 'acp-1',
        agent: 'Codex 2.2.2',
        choices: [],
        commands: [],
        title: 'Board fixes',
        context: null,
      },
    });
    // The same report again, as a retry after a lost answer.
    await service.report('u1', {
      computerId,
      sessionId: session.id,
      batch: 2,
      bridgeStartedAt: 'bridge-1',
      events: [chunk('lo')],
      state: null,
    });

    const events = await service.listEvents('u1', session.id, {
      after: 0,
      limit: 10,
    });
    expect(events.map((event) => event.kind)).toEqual([
      'prompt',
      'turnStarted',
      'update',
    ]);
    expect(events[2]).toMatchObject({
      seq: 3,
      update: { content: { text: 'Hello' } },
    });
    await expect(service.getSession(owner, session.id)).resolves.toMatchObject({
      running: true,
      title: 'Board fixes',
      titleSource: 'agent',
      state: { acpSessionId: 'acp-1' },
    });

    await report(computerId, session.id, [
      {
        kind: 'turnEnded',
        at,
        promptId: 'p1',
        stopReason: 'end_turn',
        usage: null,
        error: null,
      },
    ]);
    await expect(service.getSession(owner, session.id)).resolves.toMatchObject({
      running: false,
      lastSeq: 4,
    });
  });

  test('stores the transcript without the secrets in it', async ({
    database,
  }) => {
    const { service, clock, register, report } = setup(database);
    const { computerId } = await register();
    const image = {
      type: 'image' as const,
      mimeType: 'image/png',
      data: 'iVBORw0KGgo',
    };
    const session = await service.createSession(owner, {
      computerId,
      agentId: 'codex',
      cwd: '/home/zhou',
      content: [
        ...text('Use ghp_abcdefghijklmnopqrstuvwxyz0123456789 for it'),
        image,
      ],
    });
    clock.now += 1_000;
    // A secret split between two streamed pieces, reported apart.
    await report(computerId, session.id, [chunk('key: sk-proj-abc123def4')]);
    await report(computerId, session.id, [chunk('56ghi789jkl012 done')]);

    const [prompt, answer] = await service.listEvents('u1', session.id, {
      after: 0,
      limit: 10,
    });
    expect(prompt).toMatchObject({
      content: [{ text: 'Use [REDACTED] for it' }, image],
    });
    expect(answer).toMatchObject({
      update: { content: { text: 'key: [REDACTED] done' } },
    });
    expect(session.title).toBe('Use [REDACTED] for it');

    // Codex titles a session with its first message.
    await report(computerId, session.id, [], {
      state: {
        acpSessionId: 'acp-1',
        agent: 'Codex',
        choices: [],
        commands: [],
        context: null,
        title: 'Use ghp_abcdefghijklmnopqrstuvwxyz0123456789 for it',
      },
    });
    await expect(service.getSession(owner, session.id)).resolves.toMatchObject({
      title: 'Use [REDACTED] for it',
      titleSource: 'agent',
    });
  });

  test('passes a person’s answer to a permission request to the computer', async ({
    database,
  }) => {
    const { service, started, report, take } = setup(database);
    const { computerId, session } = await started();
    await take(computerId);
    await report(computerId, session.id, [
      {
        kind: 'permissionRequested',
        at,
        requestId: 'r1',
        toolCall: { title: 'Run rm' },
        options: [],
      },
    ]);
    await expect(service.getSession(owner, session.id)).resolves.toMatchObject({
      waiting: true,
    });
    await expect(
      service.answer('u1', session.id, { requestId: 'r9', optionId: 'yes' }),
    ).rejects.toMatchObject({
      key: 'permissionRequestNotFound',
    });

    await service.answer('u1', session.id, {
      requestId: 'r1',
      optionId: 'yes',
    });
    await expect(service.getSession(owner, session.id)).resolves.toMatchObject({
      waiting: false,
    });
    await expect(take(computerId)).resolves.toMatchObject([
      { type: 'permission', requestId: 'r1', optionId: 'yes' },
    ]);
    await expect(
      service.answer('u1', session.id, { requestId: 'r1', optionId: 'no' }),
    ).rejects.toMatchObject({
      key: 'permissionRequestNotFound',
    });
  });

  test('keeps a choice for the session and sends it to the computer', async ({
    database,
  }) => {
    const { service, started, report, take } = setup(database);
    const { computerId, session } = await started();
    await take(computerId);
    await report(computerId, session.id, [], {
      state: {
        acpSessionId: 'acp-1',
        agent: 'Codex',
        commands: [],
        title: null,
        context: null,
        choices: [
          {
            id: 'mode',
            name: 'Mode',
            category: 'mode',
            currentValue: 'agent-full-access',
            options: [
              { value: 'read-only', name: 'Read-only' },
              { value: 'agent-full-access', name: 'Full access' },
            ],
          },
        ],
      },
    });
    await expect(
      service.choose(owner, session.id, { choiceId: 'mode', value: 'root' }),
    ).rejects.toMatchObject({
      key: 'choiceNotFound',
    });
    await expect(
      service.choose(owner, session.id, {
        choiceId: 'mode',
        value: 'read-only',
      }),
    ).resolves.toMatchObject({
      settings: { mode: 'agent-full-access' },
    });
    await expect(take(computerId)).resolves.toMatchObject([
      {
        type: 'choose',
        choiceId: 'mode',
        value: 'read-only',
        session: {
          acpSessionId: 'acp-1',
          settings: { mode: 'agent-full-access' },
        },
      },
    ]);
  });

  test('offers a new session what the agent offered in the latest one on the computer', async ({
    database,
  }) => {
    const { service, started, report, take } = setup(database);
    const { computerId, session } = await started();
    await take(computerId);
    const effort = {
      id: 'effort',
      name: 'Reasoning effort',
      category: 'thought_level',
      currentValue: 'low',
      options: [
        { value: 'low', name: 'Low' },
        { value: 'high', name: 'High' },
      ],
    };
    const commands = [{ name: 'review', description: 'Review the changes' }];
    const state = {
      acpSessionId: 'acp-1',
      agent: 'Codex',
      commands,
      title: null,
      context: null,
      choices: [effort],
    };
    await report(computerId, session.id, [], { state });
    const [computer] = await service.listComputers('u1');
    expect(computer).toMatchObject({
      home: '/home/zhou',
      choices: { codex: [effort] },
      commands: { codex: commands },
    });

    const input = {
      computerId,
      agentId: 'codex',
      cwd: '/home/zhou',
      content: text('next'),
    };
    const next = await service.createSession(owner, {
      ...input,
      settings: { effort: 'high' },
    });
    await expect(take(computerId)).resolves.toMatchObject([
      {
        type: 'prompt',
        session: { id: next.id, settings: { effort: 'high' } },
      },
    ]);
  });

  test('answers only its owner', async ({ database }) => {
    const { service, started, register } = setup(database);
    const { computerId, session } = await started();
    await expect(
      service.getSession(stranger, session.id),
    ).rejects.toMatchObject({ key: 'sessionNotFound' });
    await expect(
      service.prompt(stranger, session.id, text('hi')),
    ).rejects.toMatchObject({ key: 'sessionNotFound' });
    const theirs = await register('u2');
    await expect(
      service.report('u2', {
        computerId: theirs.computerId,
        sessionId: session.id,
        batch: 1,
        bridgeStartedAt: 'b',
        events: [],
        state: null,
      }),
    ).rejects.toMatchObject({ key: 'sessionNotFound' });
    await expect(
      service.removeComputer('u2', computerId),
    ).rejects.toMatchObject({ key: 'computerNotFound' });
  });

  test('stops an archived session and takes no more messages for it', async ({
    database,
  }) => {
    const { service, started, report, take } = setup(database);
    const { computerId, session } = await started();
    await take(computerId);
    await expect(
      service.updateSession(owner, session.id, {
        archived: true,
        title: ' Board ',
      }),
    ).resolves.toMatchObject({
      title: 'Board',
      titleSource: 'owner',
    });
    await expect(take(computerId)).resolves.toEqual([
      { type: 'close', sessionId: session.id },
    ]);
    await expect(
      service.prompt(owner, session.id, text('more')),
    ).rejects.toMatchObject({ key: 'sessionArchived' });
    await expect(report(computerId, session.id, [])).resolves.toEqual({
      open: false,
    });
    await expect(
      service.listSessions(owner, { archived: false, pageSize: 20 }),
    ).resolves.toMatchObject({ sessions: [] });
    await expect(
      service.listSessions(owner, { archived: true, pageSize: 20 }),
    ).resolves.toMatchObject({
      sessions: [{ id: session.id }],
    });
  });

  test('pages the sessions by their last activity', async ({ database }) => {
    const { service, clock, register } = setup(database);
    const { computerId } = await register();
    const ids: string[] = [];
    for (const title of ['a', 'b', 'c']) {
      clock.now += 1_000;
      ids.push(
        (
          await service.createSession(owner, {
            computerId,
            agentId: 'codex',
            cwd: '/home/zhou',
            content: text(title),
          })
        ).id,
      );
    }
    const first = await service.listSessions(owner, {
      archived: false,
      pageSize: 2,
    });
    expect(first.sessions.map((session) => session.title)).toEqual(['c', 'b']);
    const second = await service.listSessions(owner, {
      archived: false,
      pageSize: 2,
      pageToken: first.nextPageToken,
    });
    expect(second.sessions.map((session) => session.title)).toEqual(['a']);
    expect(second.nextPageToken).toBeUndefined();
    await expect(
      service.listSessions(owner, {
        archived: false,
        pageSize: 2,
        pageToken: 'nope',
      }),
    ).rejects.toMatchObject({
      key: 'invalidPageToken',
    });
  });

  test('shows what the application tied to a session and starts its work there', async ({
    database,
  }) => {
    const { service, started } = setup(database);
    const { session } = await started();
    const start = vi.fn(() => Promise.resolve());
    const resolver: LinkResolver = {
      resolve: (refIds, viewer) =>
        Promise.resolve(
          new Map(
            refIds.map((refId) => [
              refId,
              {
                key: refId,
                title: `Issue in ${viewer.locale}`,
                group: 'Studio',
                status: null,
                href: null,
                startable: true,
              },
            ]),
          ),
        ),
      start,
    };
    service.registerLinkKind('issue', resolver);
    await service.link(session.id, 'issue', 'ST-1');
    await service.link(session.id, 'issue', 'ST-1');
    await service.link(session.id, 'issue', 'ST-2');

    const linked = await service.getSession(owner, session.id);
    expect(linked.links).toMatchObject([
      { refId: 'ST-1', key: 'ST-1', title: 'Issue in en-US', decidedAt: null },
      { refId: 'ST-2', decidedAt: null },
    ]);
    const events = await service.listEvents('u1', session.id, {
      after: 0,
      limit: 10,
    });
    expect(events.filter((event) => event.kind === 'link')).toHaveLength(2);

    await expect(
      service.decideLinks(owner, session.id, {
        kind: 'issue',
        start: ['ST-9'],
        skip: [],
      }),
    ).rejects.toMatchObject({ key: 'linkNotFound' });
    start.mockRejectedValueOnce(
      new Error('Configure the project manager first.'),
    );
    await expect(
      service.decideLinks(owner, session.id, {
        kind: 'issue',
        start: ['ST-1'],
        skip: ['ST-2'],
      }),
    ).rejects.toThrow('Configure the project manager first.');
    expect(
      (await service.getSession(owner, session.id)).links.map(
        (link) => link.decidedAt,
      ),
    ).toEqual([null, null]);
    const decided = await service.decideLinks(owner, session.id, {
      kind: 'issue',
      start: ['ST-1'],
      skip: ['ST-2'],
    });
    expect(start).toHaveBeenCalledWith(['ST-1'], owner);
    expect(decided.links.map((link) => link.decidedAt)).toEqual([
      '2026-10-13T08:00:00.000Z',
      '2026-10-13T08:00:00.000Z',
    ]);
  });

  test('ends what a restarted bridge was doing, not what the running one does', async ({
    database,
  }) => {
    const { service, started, report, register } = setup(database);
    const { computerId, session } = await started();
    await report(computerId, session.id, [
      { kind: 'turnStarted', at, promptId: 'p1' },
    ]);
    await register('u1', { computerId });
    await expect(service.getSession(owner, session.id)).resolves.toMatchObject({
      running: true,
    });
    await register('u1', { computerId, bridgeStartedAt: 'bridge-2' });
    const after = await service.getSession(owner, session.id);
    expect(after).toMatchObject({ running: false, waiting: false });
    const events = await service.listEvents('u1', session.id, {
      after: 0,
      limit: 10,
    });
    expect(events.at(-1)).toMatchObject({ kind: 'notice', level: 'warning' });
  });

  test('lets its owner choose the folders sessions work in, under what the bridge allows', async ({
    database,
  }) => {
    const { service, register } = setup(database);
    const { computerId } = await register();
    await expect(
      service.updateComputer('u1', computerId, { folders: ['/etc'] }),
    ).rejects.toMatchObject({ key: 'directoryNotAllowed' });
    await expect(
      service.updateComputer('u1', computerId, {
        folders: ['/home/zhou/code/', '/home/zhou/code'],
      }),
    ).resolves.toMatchObject({
      folders: ['/home/zhou/code'],
      defaultFolders: false,
    });
    const input = {
      computerId,
      agentId: 'codex',
      content: text('hi'),
    };
    await expect(
      service.createSession(owner, { ...input, cwd: '/home/zhou/notes' }),
    ).rejects.toMatchObject({ key: 'directoryNotAllowed' });
    await expect(
      service.createSession(owner, { ...input, cwd: '/home/zhou/code/app' }),
    ).resolves.toMatchObject({ cwd: '/home/zhou/code/app' });
    await expect(
      service.updateComputer('u1', computerId, { folders: null }),
    ).resolves.toMatchObject({ folders: ['/home/zhou'], defaultFolders: true });
  });

  test('lists a folder through the computer’s bridge', async ({ database }) => {
    const { service, register, take } = setup(database);
    const { computerId } = await register();
    /** Plays the bridge: takes the computer's next listing request and answers it. */
    const answer = async (
      reply: Pick<ReplyRequest, 'listing' | 'error'>,
    ): Promise<string> => {
      for (;;) {
        const [command] = await take(computerId);
        if (command?.type === 'listFolders') {
          await service.reply('u1', {
            computerId,
            requestId: command.requestId,
            ...reply,
          });
          return command.path;
        }
        await new Promise((resolve) => setTimeout(resolve, 20));
      }
    };

    const found = { path: '/home/zhou', folders: ['code'], truncated: false };
    const listing = service.listFolders('u1', computerId, undefined);
    await expect(answer({ listing: found, error: null })).resolves.toBe(
      '/home/zhou',
    );
    await expect(listing).resolves.toEqual(found);

    const refused = service
      .listFolders('u1', computerId, '/home/zhou/gone')
      .catch((error: unknown) => error);
    await answer({ listing: null, error: 'ENOENT' });
    expect(await refused).toMatchObject({ key: 'folderUnavailable' });
    await expect(
      service.listFolders('u1', computerId, '/etc'),
    ).rejects.toMatchObject({ key: 'directoryNotAllowed' });
  });

  test('works for one of the application’s projects, which CLI creation defaults to', async ({
    database,
  }) => {
    const service = new AgentSessionsService({
      database,
      now: () => T0,
    });
    service.registerProjects({
      list: () => Promise.resolve([{ id: 'p1', name: 'Studio' }]),
    });
    const { computerId } = await service.register('u1', {
      protocol: BRIDGE_PROTOCOL_VERSION,
      computerId: null,
      bridgeStartedAt: 'bridge-1',
      computer: {
        name: 'Laptop',
        platform: 'darwin',
        arch: 'arm64',
        host: 'nb-studio 1.0.0',
        roots: ['/home/zhou'],
        agents: [{ id: 'codex', name: 'Codex', version: '2.2.2' }],
      },
    });
    const input = {
      computerId,
      agentId: 'codex',
      cwd: '/home/zhou',
      content: text('hi'),
    };
    await expect(
      service.createSession(owner, { ...input, projectId: 'p9' }),
    ).rejects.toMatchObject({ key: 'projectNotFound' });
    const session = await service.createSession(owner, {
      ...input,
      projectId: 'p1',
    });
    expect(session.project).toEqual({ id: 'p1', name: 'Studio' });

    const [command] = (
      await service.poll(
        'u1',
        {
          computerId,
          wait: false,
          protocol: BRIDGE_PROTOCOL_VERSION,
          bridgeStartedAt: 'bridge-1',
        },
        signal,
      )
    ).commands;
    expect(command?.type === 'prompt' && command.session).not.toHaveProperty(
      'tools',
    );
    await expect(service.creationContext('u1', session.id)).resolves.toEqual({
      projectId: 'p1',
    });
    await expect(
      service.creationContext('u2', session.id),
    ).rejects.toMatchObject({ key: 'sessionNotFound' });
    await expect(
      service.creationContext('u1', 'missing'),
    ).rejects.toMatchObject({ key: 'sessionNotFound' });
    await service.updateSession({ userId: 'u1' }, session.id, {
      archived: true,
    });
    await expect(
      service.creationContext('u1', session.id),
    ).rejects.toMatchObject({ key: 'sessionArchived' });
  });

  test('ties what a message mentions to the session and tells the agent what it is', async ({
    database,
  }) => {
    const { service, started, take } = setup(database);
    const { computerId, session } = await started();
    await take(computerId);
    const view = (refId: string) => ({
      key: refId,
      title: `Issue ${refId}`,
      group: 'Studio',
      status: { label: 'Backlog', tone: 'idle' as const },
      href: null,
      startable: true,
    });
    service.registerLinkKind('issue', {
      resolve: (refIds) =>
        Promise.resolve(
          new Map(
            refIds
              .filter((refId) => refId !== 'ST-9')
              .map((refId) => [refId, view(refId)]),
          ),
        ),
      search: (query, _viewer, { projectId }) =>
        Promise.resolve([
          { refId: 'ST-7', ...view(`ST-7 ${query} ${projectId}`) },
        ]),
    });

    await expect(
      service.searchMentions(owner, 'board', 'p1'),
    ).resolves.toMatchObject([
      { kind: 'issue', refId: 'ST-7', key: 'ST-7 board p1' },
    ]);
    await expect(
      service.prompt(owner, session.id, text('see #ST-9'), [
        { kind: 'issue', refId: 'ST-9' },
      ]),
    ).rejects.toMatchObject({ key: 'referenceNotFound' });

    const sent = await service.prompt(owner, session.id, text('see #ST-7'), [
      { kind: 'issue', refId: 'ST-7' },
    ]);
    expect(sent.content).toEqual(text('see #ST-7'));
    await expect(take(computerId)).resolves.toMatchObject([
      {
        type: 'prompt',
        content: [
          { text: 'see #ST-7' },
          { text: 'Mentioned:\n- #ST-7 Issue ST-7 (Backlog)' },
          { text: expect.stringContaining('- #ST-7 Issue ST-7: Backlog') },
        ],
      },
    ]);
    const tied = await service.getSession(owner, session.id);
    expect(tied.links).toMatchObject([
      { refId: 'ST-7', decidedAt: '2026-10-13T08:00:00.000Z' },
    ]);
  });

  test('tells the agent the session’s work, in full for every independently withdrawable message', async ({
    database,
  }) => {
    const { service, started, take } = setup(database);
    const { computerId, session } = await started();
    await take(computerId);
    const status = new Map([
      ['ST-1', 'Backlog'],
      ['ST-2', 'Backlog'],
    ]);
    service.registerLinkKind('issue', {
      resolve: (refIds) =>
        Promise.resolve(
          new Map(
            refIds.map((refId) => [
              refId,
              {
                key: refId,
                title: `Issue ${refId}`,
                group: null,
                status: { label: status.get(refId)!, tone: 'idle' as const },
                href: null,
                startable: true,
              },
            ]),
          ),
        ),
    });
    const told = async (): Promise<string | undefined> => {
      await service.prompt(owner, session.id, text('and?'));
      const [command] = await take(computerId);
      const content = command?.type === 'prompt' ? command.content : [];
      return content.length > 1 && content[1]?.type === 'text'
        ? content[1].text
        : undefined;
    };

    await expect(told()).resolves.toBeUndefined();
    await service.link(session.id, 'issue', 'ST-1');
    await expect(told()).resolves.toMatch(/\n- #ST-1 Issue ST-1: Backlog$/u);
    await expect(told()).resolves.toMatch(/#ST-1 Issue ST-1: Backlog/u);

    status.set('ST-1', 'In progress');
    await service.link(session.id, 'issue', 'ST-2');
    await expect(told()).resolves.toMatch(
      /\n- #ST-1 Issue ST-1: In progress\n- #ST-2 Issue ST-2: Backlog$/u,
    );
  });

  test('tells the agent how the application wants it to work, in every independently withdrawable message', async ({
    database,
  }) => {
    const { service, started, take } = setup(database);
    service.registerInstructions('Hand development on as issues.');
    const { computerId, session } = await started();
    const told = async (): Promise<string[]> => {
      const [command] = await take(computerId);
      return command?.type === 'prompt'
        ? command.content.flatMap((part) =>
            part.type === 'text' ? [part.text] : [],
          )
        : [];
    };

    await expect(told()).resolves.toEqual([
      'Fix the board\nand more',
      'How to work in this session:\nHand development on as issues.',
    ]);
    await service.prompt(owner, session.id, text('and?'));
    await expect(told()).resolves.toEqual([
      'and?',
      'How to work in this session:\nHand development on as issues.',
    ]);

    service.registerInstructions('Make small fixes yourself.');
    await service.prompt(owner, session.id, text('and now?'));
    await expect(told()).resolves.toEqual([
      'and now?',
      'How to work in this session:\nMake small fixes yourself.',
    ]);
  });

  for (const locale of ['zh-CN', 'en-US']) {
    test(`resolves instructions from the current interface locale (${locale}), also after restoring a session`, async ({
      database,
    }) => {
      const { service, register, take } = setup(database);
      const instructions = (viewer: { readonly locale?: string | undefined }) =>
        `Create tasks in ${viewer.locale}.`;
      service.registerInstructions(instructions);
      const { computerId } = await register();
      const viewer = { userId: owner.userId, locale };
      const session = await service.createSession(viewer, {
        computerId,
        agentId: 'codex',
        cwd: '/home/zhou/code',
        // The message language deliberately differs from the interface language.
        content: text(locale === 'zh-CN' ? 'Create a task' : '创建任务'),
      });
      const told = async () => {
        const commands = await take(computerId);
        return commands.flatMap((command) =>
          command.type === 'prompt'
            ? command.content.flatMap((part) =>
                part.type === 'text' ? [part.text] : [],
              )
            : [],
        );
      };
      await expect(told()).resolves.toContain(
        `How to work in this session:\nCreate tasks in ${locale}.`,
      );
      const restored = new AgentSessionsService({ database, now: () => T0 });
      restored.registerInstructions(instructions);
      await restored.prompt(viewer, session.id, text('Continue'));
      await expect(told()).resolves.toEqual([
        'Continue',
        `How to work in this session:\nCreate tasks in ${locale}.`,
      ]);
      const switched = locale === 'zh-CN' ? 'en-US' : 'zh-CN';
      await restored.prompt(
        { ...viewer, locale: switched },
        session.id,
        text('Create another'),
      );
      await expect(told()).resolves.toEqual([
        'Create another',
        `How to work in this session:\nCreate tasks in ${switched}.`,
      ]);
      // Context is sent to the agent without rewriting the person's transcript.
      const events = await restored.listEvents(viewer.userId, session.id, {
        after: 0,
        limit: 100,
      });
      expect(
        events.filter((event) => event.kind === 'prompt').at(-1),
      ).toMatchObject({
        content: text('Create another'),
      });
    });
  }

  test('gives every session’s agent its work and how it is going', async ({
    database,
  }) => {
    const service = new AgentSessionsService({
      database,
      now: () => T0,
    });
    service.registerLinkKind('issue', {
      resolve: (refIds, viewer) =>
        Promise.resolve(
          new Map(
            refIds.map((refId) => [
              refId,
              {
                key: refId,
                title: `Issue ${refId}`,
                group: 'Studio',
                status: {
                  label: `Backlog in ${viewer.locale}`,
                  tone: 'idle' as const,
                },
                href: null,
                startable: true,
              },
            ]),
          ),
        ),
      progress: (refIds) =>
        Promise.resolve(
          new Map(refIds.map((refId) => [refId, { waitsFor: 'the owner' }])),
        ),
    });
    const { computerId } = await service.register('u1', {
      protocol: BRIDGE_PROTOCOL_VERSION,
      computerId: null,
      bridgeStartedAt: 'bridge-1',
      computer: {
        name: 'Laptop',
        platform: 'darwin',
        arch: 'arm64',
        host: 'nb-studio 1.0.0',
        roots: ['/home/zhou'],
        agents: [{ id: 'codex', name: 'Codex', version: '2.2.2' }],
      },
    });
    const session = await service.createSession(
      { userId: 'u1', locale: 'zh-CN' },
      { computerId, agentId: 'codex', cwd: '/home/zhou', content: text('hi') },
    );
    await service.link(session.id, 'issue', 'ST-1');

    await expect(
      service.sessionWork({ userId: 'u2' }, session.id),
    ).rejects.toMatchObject({ key: 'sessionNotFound' });
    await expect(
      service.sessionWork({ userId: 'u1' }, session.id),
    ).resolves.toEqual([
      {
        kind: 'issue',
        refId: 'ST-1',
        key: 'ST-1',
        title: 'Issue ST-1',
        status: 'Backlog in zh-CN',
        group: 'Studio',
        progress: { waitsFor: 'the owner' },
      },
    ]);
  });
});
