import { BRIDGE_PROTOCOL_VERSION } from '@nocobase/acp-bridge/protocol';
import type { BridgeEvent } from '@nocobase/acp-bridge/protocol';
import type { DatabaseManager } from '@nocobase/db';
import { describe, expect, vi } from 'vitest';

import type {
  SessionNotice,
  SessionNoticeSettle,
} from '../../server/notices.js';
import { AgentSessionsService } from '../../server/service.js';
import { test } from '../helpers/database.js';
import { bridgeReport } from '../helpers/bridge-report.js';

const T0 = Date.parse('2026-10-13T08:00:00.000Z');
const at = '2026-10-13T08:00:01.000Z';
const owner = { userId: 'u1', locale: 'en-US' };

function setup(database: DatabaseManager) {
  const tasks: (() => Promise<void>)[] = [];
  const sent: SessionNotice[] = [];
  const settled: SessionNoticeSettle[] = [];
  const service = new AgentSessionsService({
    database,
    now: () => T0,
    schedule: (task) => tasks.push(task),
  });
  service.registerNotices({
    send: (notice) => {
      sent.push(notice);
      return Promise.resolve();
    },
    settle: (ref) => {
      settled.push(ref);
      return Promise.resolve();
    },
  });
  /** Runs what the service scheduled so far, as the delay passing. */
  const later = async () => {
    for (const task of tasks.splice(0)) await task();
  };
  let batch = 0;
  async function started() {
    const { computerId } = await service.register('u1', {
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
        agents: [{ id: 'codex', name: 'Codex', version: '2.2.2' }],
      },
    });
    const session = await service.createSession(owner, {
      computerId,
      agentId: 'codex',
      cwd: '/home/zhou/code',
      content: [{ type: 'text', text: 'Fix the board' }],
    });
    const prompt = (
      await service.listEvents('u1', session.id, { after: 0, limit: 10 })
    )[0]!;
    if (prompt.kind !== 'prompt') throw new Error('Expected prompt');
    await service.claim('u1', {
      protocol: BRIDGE_PROTOCOL_VERSION,
      bridgeStartedAt: 'bridge-1',
      computerId,
      sessionId: session.id,
      seq: prompt.seq,
      promptId: prompt.promptId,
    });
    const report = (events: BridgeEvent[]) =>
      bridgeReport(service, 'u1', {
        computerId,
        sessionId: session.id,
        batch: ++batch,
        bridgeStartedAt: 'bridge-1',
        events,
        state: null,
      });
    return { session, report };
  }
  return { service, sent, settled, later, started };
}

const ended = (
  extra: Partial<Extract<BridgeEvent, { kind: 'turnEnded' }>> = {},
): BridgeEvent => ({
  kind: 'turnEnded',
  at,
  promptId: 'p1',
  stopReason: 'end_turn',
  usage: null,
  error: null,
  ...extra,
});

const asked: BridgeEvent = {
  kind: 'permissionRequested',
  at,
  requestId: 'r1',
  toolCall: { title: 'Run npm test' },
  options: [{ optionId: 'allow', name: 'Allow', kind: 'allow_once' }],
};

describe('AgentSessionsService notices', () => {
  test('observes committed reminder identities immediately and unregisters listeners', async ({
    database,
  }) => {
    const { service, sent, started } = setup(database);
    const observed: { sessionId: string; seq: number; reason: string }[] = [];
    const stop = service.onCommittedEvent((event) => {
      observed.push(event);
    });
    const { session, report } = await started();
    await report([ended(), asked]);
    await vi.waitFor(() => expect(observed).toHaveLength(2));
    const actual = await service.listEvents(owner.userId, session.id, {
      after: 0,
      limit: 200,
    });
    for (const event of observed)
      expect(actual.find((stored) => stored.seq === event.seq)?.kind).toBe(
        event.reason === 'turnFailed' ? 'turnEnded' : event.reason,
      );
    expect(sent).toEqual([]);
    stop();
    await report([ended()]);
    expect(observed).toHaveLength(2);
  });
  test('tells the owner of a reply they did not see, a little later, once', async ({
    database,
  }) => {
    const { sent, later, started } = setup(database);
    const { session, report } = await started();
    await report([{ kind: 'turnStarted', at, promptId: 'p1' }, ended()]);
    expect(sent).toEqual([]);

    await later();
    expect(sent).toEqual([
      {
        key: `${session.id}:3:turnEnded`,
        type: 'turnEnded',
        userId: 'u1',
        sessionId: session.id,
        title: 'Fix the board',
        agent: 'Codex',
        detail: null,
        at,
      },
    ]);
    await later();
    expect(sent).toHaveLength(1);
  });

  test('tells nothing the owner saw in time, nor a turn they stopped', async ({
    database,
  }) => {
    const { service, sent, later, started } = setup(database);
    const { session, report } = await started();
    await report([ended()]);
    await service.markSeen('u1', session.id, 99);
    await report([ended({ stopReason: 'cancelled' })]);
    await later();
    expect(sent).toEqual([]);
  });

  test('tells of a failed turn with why', async ({ database }) => {
    const { sent, later, started } = setup(database);
    const { report } = await started();
    await report([
      ended({ stopReason: null, error: 'Codex is not signed in.' }),
    ]);
    await later();
    expect(sent).toMatchObject([
      { type: 'turnFailed', detail: 'Codex is not signed in.' },
    ]);
  });

  test('tells of a request for permission while it waits, and settles it once answered', async ({
    database,
  }) => {
    const { sent, settled, later, started } = setup(database);
    const { session, report } = await started();
    await report([asked]);
    await later();
    expect(sent).toMatchObject([
      { type: 'permissionRequested', detail: 'Run npm test' },
    ]);

    await report([
      {
        kind: 'permissionResolved',
        at,
        requestId: 'r1',
        optionId: 'allow',
        reason: 'answered',
      },
    ]);
    await later();
    expect(settled).toEqual([
      {
        userId: 'u1',
        sessionId: session.id,
        types: ['permissionRequested'],
        outcome: 'answered',
      },
    ]);
  });

  test('tells nothing of a request answered before the delay', async ({
    database,
  }) => {
    const { sent, later, started } = setup(database);
    const { report } = await started();
    await report([asked]);
    await report([
      {
        kind: 'permissionResolved',
        at,
        requestId: 'r1',
        optionId: 'allow',
        reason: 'answered',
      },
    ]);
    await later();
    expect(sent).toEqual([]);
  });

  test('settles what it told once the owner sees the session or archives it', async ({
    database,
  }) => {
    const { service, settled, later, started } = setup(database);
    const { session, report } = await started();
    await report([ended()]);
    await later();
    await service.markSeen('u1', session.id, 1);
    expect(settled).toEqual([]);
    await service.markSeen('u1', session.id, 3);
    expect(settled).toEqual([
      {
        userId: 'u1',
        sessionId: session.id,
        types: ['turnEnded', 'turnFailed'],
        outcome: 'seen',
      },
    ]);
    // Seen again, nothing more to settle.
    await service.markSeen('u1', session.id, 3);
    expect(settled).toHaveLength(1);

    await service.prompt(owner, session.id, [
      { type: 'text', text: 'Continue' },
    ]);
    await report([
      { kind: 'turnStarted', at, promptId: 'p2' },
      ended({ promptId: 'p2' }),
    ]);
    await later();
    await service.updateSession(owner, session.id, { archived: true });
    expect(settled.at(-1)).toEqual({
      userId: 'u1',
      sessionId: session.id,
      outcome: 'archived',
    });
  });

  test('reading keeps permission notices, including reads before delayed accounting', async ({
    database,
  }) => {
    const { service, sent, settled, later, started } = setup(database);
    const { session, report } = await started();
    await report([asked]);
    await service.markSeen('u1', session.id, 99);
    await later();
    expect(sent).toMatchObject([{ type: 'permissionRequested' }]);
    await service.prompt(owner, session.id, [
      { type: 'text', text: 'Please continue' },
    ]);
    await later();
    expect(
      settled.every(
        (entry) =>
          entry.outcome === 'seen' &&
          !entry.types?.includes('permissionRequested'),
      ),
    ).toBe(true);
    await service.answer('u1', session.id, { requestId: 'r1', optionId: null });
    await later();
    expect(settled.at(-1)).toMatchObject({
      types: ['permissionRequested'],
      outcome: 'answered',
    });
  });

  test('settles permissions after a turn ends or is cancelled without changing its lifecycle', async ({
    database,
  }) => {
    for (const stopReason of ['end_turn', 'cancelled']) {
      const { sent, settled, later, started } = setup(database);
      const { report } = await started();
      await report([asked]);
      await later();
      expect(sent).toHaveLength(1);
      await report([ended({ stopReason })]);
      await later();
      expect(settled).toContainEqual(
        expect.objectContaining({
          types: ['permissionRequested'],
          outcome: 'answered',
        }),
      );
    }
  });

  test('keeps the session permission notice until the last request is processed', async ({ database }) => {
    const { service, settled, later, started } = setup(database);
    const { session, report } = await started();
    await report([asked, { ...asked, requestId: 'r2' }]);
    await later();
    await service.answer('u1', session.id, { requestId: 'r1', optionId: 'allow' });
    await later();
    expect(settled).toEqual([]);
    expect((await service.getSession(owner, session.id)).waiting).toBe(true);
    await service.markSeen('u1', session.id, 99);
    expect(settled.every((ref) => !ref.types?.includes('permissionRequested'))).toBe(true);
    await service.updateSession(owner, session.id, { archived: true });
    expect(settled.at(-1)).toMatchObject({ outcome: 'archived' });
  });

  test('sending reads replies without waiting for the page visibility timer', async ({
    database,
  }) => {
    const { service, settled, later, started } = setup(database);
    const { session, report } = await started();
    await report([ended()]);
    await later();
    await service.prompt(owner, session.id, [
      { type: 'text', text: 'Continue' },
    ]);
    await later();
    expect(settled.at(-1)).toMatchObject({
      types: ['turnEnded', 'turnFailed'],
      outcome: 'seen',
    });
    const current = await service.getSession(owner, session.id);
    expect(current.seenSeq).toBe(current.lastSeq);
  });

  test('answers only the owner when marking a session seen', async ({
    database,
  }) => {
    const { service, started } = setup(database);
    const { session } = await started();
    await expect(service.markSeen('u2', session.id, 1)).rejects.toMatchObject({
      key: 'sessionNotFound',
    });
  });

  test('tells nobody without an application listening', async ({
    database,
  }) => {
    const schedule = vi.fn();
    const service = new AgentSessionsService({ database, schedule });
    const { computerId } = await service.register('u1', {
      protocol: BRIDGE_PROTOCOL_VERSION,
      computerId: null,
      bridgeStartedAt: 'bridge-1',
      computer: {
        name: 'Laptop',
        platform: 'linux',
        arch: 'x64',
        host: 'nb-studio 1.0.0',
        home: '/home/zhou',
        roots: ['/home/zhou'],
        agents: [{ id: 'codex', name: 'Codex', version: null }],
      },
    });
    const session = await service.createSession(owner, {
      computerId,
      agentId: 'codex',
      cwd: '/home/zhou',
      content: [{ type: 'text', text: 'Hi' }],
    });
    await service.report('u1', {
      computerId,
      sessionId: session.id,
      batch: 1,
      bridgeStartedAt: 'bridge-1',
      events: [ended()],
      state: null,
    });
    expect(schedule).not.toHaveBeenCalled();
  });
});
