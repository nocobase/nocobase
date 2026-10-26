import { randomUUID } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { describe, expect } from 'vitest';
import { BRIDGE_PROTOCOL_VERSION } from '@nocobase/acp-bridge/protocol';
import type { DatabaseManager } from '@nocobase/db';
import { AgentSessionsService } from '../../server/service.js';
import { computers } from '../../server/store.js';
import { foldTranscript } from '../../client/transcript.js';
import { test } from '../helpers/database.js';

const owner = { userId: 'owner' };
const text = (value: string) => [{ type: 'text' as const, text: value }];
const generation = {
  protocol: BRIDGE_PROTOCOL_VERSION,
  bridgeStartedAt: 'test',
};
async function scenario(database: DatabaseManager) {
  const service = new AgentSessionsService({ database });
  const { computerId } = await service.register(owner.userId, {
    ...generation,
    computerId: null,
    computer: {
      name: 'Test',
      platform: 'linux',
      arch: 'x64',
      host: 'test',
      roots: ['/work'],
      agents: [{ id: 'fake', name: 'Fake', version: null }],
    },
  });
  const session = await service.createSession(owner, {
    computerId,
    agentId: 'fake',
    cwd: '/work',
    content: text('A'),
  });
  const history = () =>
    service.listEvents(owner.userId, session.id, { after: 0, limit: 100 });
  const a = (await history())[0]!;
  if (a.kind !== 'prompt') throw new Error('Expected prompt');
  const request = (p: typeof a) => ({
    ...generation,
    computerId,
    sessionId: session.id,
    promptId: p.promptId,
    seq: p.seq,
  });
  await service.claim(owner.userId, request(a));
  let batch = 0;
  const end = (p: typeof a, stopReason = 'cancelled') =>
    service.report(owner.userId, {
      computerId,
      sessionId: session.id,
      bridgeStartedAt: generation.bridgeStartedAt,
      batch: ++batch,
      state: null,
      events: [
        {
          kind: 'turnEnded',
          seq: p.seq,
          at: new Date().toISOString(),
          promptId: p.promptId,
          stopReason,
          usage: null,
          error: null,
        },
      ],
    });
  return { service, computerId, session, a, request, end, history };
}

describe('targeted stop and ordered retries', () => {
  test('holds the queue through reload and retries each input in its original position', async ({
    database,
  }) => {
    const s = await scenario(database);
    const b = await s.service.prompt(owner, s.session.id, text('B'));
    const c = await s.service.prompt(owner, s.session.id, text('C'));
    if (b.kind !== 'prompt' || c.kind !== 'prompt')
      throw new Error('Expected prompts');
    const sql: string[] = [];
    const client = await database.connection().client<{
      on: (name: string, fn: (query: { sql: string }) => void) => void;
      off: (name: string, fn: (query: { sql: string }) => void) => void;
    }>();
    const observe = (query: { sql: string }): void => {
      sql.push(query.sql);
    };
    client.on('query', observe);
    await s.service.cancel(owner.userId, s.session.id, s.a.promptId);
    client.off('query', observe);
    const costs = (queries: string[]) => ({
      reads: queries.filter((query) => /^select\b/iu.test(query)).length,
      writes: queries.filter((query) =>
        /^(insert|update|delete)\b/iu.test(query),
      ).length,
      transactions: queries.filter((query) => /^begin\b/iu.test(query)).length,
    });
    const stopCost = costs(sql);
    const accepted = await s.history();
    await s.service.cancel(owner.userId, s.session.id, s.a.promptId);
    expect(await s.history()).toEqual(accepted);
    for (const p of [b, c]) {
      expect(await s.service.claim(owner.userId, s.request(p))).toEqual({
        execute: false,
      });
      await s.service.withdrawn(owner.userId, s.request(p));
    }
    await s.end(s.a);
    const reloaded = new AgentSessionsService({ database });
    await expect(
      reloaded.prompt(owner, s.session.id, text('New')),
    ).rejects.toMatchObject({ key: 'retryUnavailable' });
    await expect(
      reloaded.prompt(
        owner,
        s.session.id,
        text('C edited'),
        [],
        randomUUID(),
        c.promptId,
      ),
    ).rejects.toMatchObject({ key: 'retryUnavailable' });
    const submission = randomUUID();
    sql.length = 0;
    client.on('query', observe);
    const retry = await reloaded.prompt(
      owner,
      s.session.id,
      text('A edited'),
      [],
      submission,
      s.a.promptId,
    );
    client.off('query', observe);
    if (process.env.AGENT_SESSION_COST_REPORT)
      await writeFile(
        process.env.AGENT_SESSION_COST_REPORT,
        JSON.stringify(
          { stopWithTwoQueued: stopCost, retryInterrupted: costs(sql) },
          null,
          2,
        ),
      );
    expect(
      await reloaded.prompt(
        owner,
        s.session.id,
        text('A edited'),
        [],
        submission,
        s.a.promptId,
      ),
    ).toEqual(retry);
    await expect(
      reloaded.prompt(
        owner,
        s.session.id,
        text('Other edit'),
        [],
        randomUUID(),
        s.a.promptId,
      ),
    ).rejects.toMatchObject({ key: 'retryUnavailable' });
    if (retry.kind !== 'prompt') throw new Error('Expected retry');
    await reloaded.claim(owner.userId, s.request(retry));
    // A delayed stop for A cannot cancel its new attempt or release B/C.
    await reloaded.cancel(owner.userId, s.session.id, s.a.promptId);
    expect((await reloaded.getSession(owner, s.session.id)).running).toBe(true);
    await s.end(retry, 'end_turn');
    const next = await reloaded.prompt(
      owner,
      s.session.id,
      text('B edited'),
      [],
      randomUUID(),
      b.promptId,
    );
    if (next.kind !== 'prompt') throw new Error('Expected retry');
    expect(await reloaded.claim(owner.userId, s.request(next))).toEqual({
      execute: true,
    });
    expect(await reloaded.claim(owner.userId, s.request(c))).toEqual({
      execute: false,
    });
    const prompts = foldTranscript(await s.history()).filter(
      (item) => item.type === 'prompt',
    );
    expect(prompts.map((item) => item.text)).toEqual([
      'A',
      'A edited',
      'B',
      'B edited',
      'C',
    ]);
    expect(prompts[0]?.superseded).toBe(true);
    expect(prompts[1]?.state).toBe('done');
  });

  test('rejects stale targets after another turn claims, ownership violations and old bridges', async ({
    database,
  }) => {
    const s = await scenario(database);
    const b = await s.service.prompt(owner, s.session.id, text('B'));
    if (b.kind !== 'prompt') throw new Error('Expected prompt');
    await s.end(s.a, 'end_turn');
    await s.service.claim(owner.userId, s.request(b));
    await expect(
      s.service.cancel(owner.userId, s.session.id, s.a.promptId),
    ).rejects.toMatchObject({ key: 'stopTargetChanged' });
    await expect(
      s.service.cancel('other', s.session.id, b.promptId),
    ).rejects.toMatchObject({ key: 'sessionNotFound' });
    await computers(database.connection()).updateMany({
      filter: { id: s.computerId },
      values: { protocol: BRIDGE_PROTOCOL_VERSION - 1 },
    });
    await expect(
      s.service.cancel(owner.userId, s.session.id, b.promptId),
    ).rejects.toMatchObject({ key: 'upgradeRequired' });
  });

  test('natural completion before stop still holds unclaimed queued input', async ({
    database,
  }) => {
    const s = await scenario(database);
    const b = await s.service.prompt(owner, s.session.id, text('B'));
    if (b.kind !== 'prompt') throw new Error('Expected prompt');
    await s.end(s.a, 'end_turn');
    await s.service.cancel(owner.userId, s.session.id, s.a.promptId);
    expect(await s.service.claim(owner.userId, s.request(b))).toEqual({
      execute: false,
    });
    await s.service.withdrawn(owner.userId, s.request(b));
    await expect(
      s.service.prompt(
        owner,
        s.session.id,
        text('A edited'),
        [],
        randomUUID(),
        s.a.promptId,
      ),
    ).rejects.toMatchObject({ key: 'retryUnavailable' });
  });
});
