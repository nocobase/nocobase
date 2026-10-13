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
import { createToolTokens, defineSessionTool } from '../../server/tools.js';
import { z } from 'zod';
import { test } from '../helpers/database.js';

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
  const register = (userId = 'u1', overrides: Partial<RegisterRequest> = {}) =>
    service.register(userId, {
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
    });
  let batch = 0;
  const report = (
    computerId: string,
    sessionId: string,
    events: BridgeEvent[],
    extra: Partial<ReportRequest> = {},
  ) =>
    service.report('u1', {
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
      .poll('u1', { computerId, wait: false }, signal)
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
        tools: null,
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
    await take(computerId);
    const waiting = service.poll('u1', { computerId, wait: true }, signal);
    setTimeout(() => void service.cancel('u1', session.id), 50);
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
      settings: { mode: 'read-only' },
    });
    await expect(take(computerId)).resolves.toMatchObject([
      {
        type: 'choose',
        choiceId: 'mode',
        value: 'read-only',
        session: { acpSessionId: 'acp-1', settings: { mode: 'read-only' } },
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

  test('works for one of the application’s projects, which its tools default to', async ({
    database,
  }) => {
    const service = new AgentSessionsService({
      database,
      now: () => T0,
      toolTokens: createToolTokens(() => [{ value: 'key' }]),
    });
    service.registerProjects({
      list: () => Promise.resolve([{ id: 'p1', name: 'Studio' }]),
    });
    service.registerTools('studio', [
      defineSessionTool({
        name: 'noop',
        description: 'Does nothing.',
        input: z.object({}),
        run: () => Promise.resolve(null),
      }),
    ]);
    const { computerId } = await service.register('u1', {
      protocol: BRIDGE_PROTOCOL_VERSION,
      computerId: null,
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
      await service.poll('u1', { computerId, wait: false }, signal)
    ).commands;
    const token =
      command?.type === 'prompt' ? command.session.tools?.token : undefined;
    const caller = await service.toolHost.caller(token ?? '');
    expect(caller).toEqual({
      userId: 'u1',
      sessionId: session.id,
      projectId: 'p1',
    });
    await expect(service.toolHost.instructions(caller!)).resolves.toContain(
      '"Studio" (id p1)',
    );
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

  test('tells the agent the session’s work, again only when it changed', async ({
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
    await expect(told()).resolves.toBeUndefined();

    status.set('ST-1', 'In progress');
    await service.link(session.id, 'issue', 'ST-2');
    await expect(told()).resolves.toMatch(
      /\n- #ST-1 Issue ST-1: In progress \(was Backlog\)\n- #ST-2 Issue ST-2: Backlog \(new\)$/u,
    );
  });

  test('tells the agent how the application wants it to work, again only when that changed', async ({
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
    await expect(told()).resolves.toEqual(['and?']);

    service.registerInstructions('Make small fixes yourself.');
    await service.prompt(owner, session.id, text('and now?'));
    await expect(told()).resolves.toEqual([
      'and now?',
      'How to work in this session:\nMake small fixes yourself.',
    ]);
    await expect(
      service.toolHost.instructions({
        userId: 'u1',
        sessionId: session.id,
        projectId: null,
      }),
    ).resolves.toBe('How to work in this session:\nMake small fixes yourself.');
  });

  test('gives every session’s agent its work and how it is going', async ({
    database,
  }) => {
    const service = new AgentSessionsService({
      database,
      now: () => T0,
      toolTokens: createToolTokens(() => [{ value: 'key' }]),
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

    const caller = { userId: 'u1', sessionId: session.id, projectId: null };
    const tool = service.toolHost
      .tools()
      .find((candidate) => candidate.name === 'list_session_work');
    await expect(
      tool?.run({}, { ...caller, link: () => Promise.resolve() }),
    ).resolves.toEqual([
      {
        key: 'ST-1',
        title: 'Issue ST-1',
        status: 'Backlog in zh-CN',
        group: 'Studio',
        progress: { waitsFor: 'the owner' },
      },
    ]);
    await expect(service.toolHost.instructions(caller)).resolves.toMatch(
      /- #ST-1 Issue ST-1: Backlog in zh-CN\nCall `list_session_work`/u,
    );
  });
});
