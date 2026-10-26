import { randomUUID } from 'node:crypto';
import { appendFile } from 'node:fs/promises';
import { expect } from 'vitest';
import { BRIDGE_PROTOCOL_VERSION } from '@nocobase/acp-bridge/protocol';
import { AgentSessionsService } from '../../server/service.js';
import { events, sessions } from '../../server/store.js';
import { test } from '../helpers/database.js';

for (const length of [10, 1000]) {
  test(`ordinary submission does not return ${length} completed image payloads`, async ({
    database,
  }) => {
    const conn = database.connection();
    const service = new AgentSessionsService({ database });
    const { computerId } = await service.register('owner', {
      computerId: null,
      protocol: BRIDGE_PROTOCOL_VERSION,
      bridgeStartedAt: 'cost',
      computer: {
        name: 'Cost test',
        platform: 'linux',
        arch: 'x64',
        host: 'test',
        roots: ['/work'],
        agents: [{ id: 'fake', name: 'Fake', version: null }],
      },
    });
    const session = await service.createSession(
      { userId: 'owner' },
      {
        computerId,
        agentId: 'fake',
        cwd: '/work',
        content: [{ type: 'text', text: 'First' }],
      },
    );
    const payload = 'a'.repeat(16 * 1024);
    const now = new Date().toISOString();
    for (let offset = 0; offset < length; offset += 100) {
      await events(conn).createMany({
        values: Array.from(
          { length: Math.min(100, length - offset) },
          (_, index) => ({
            id: randomUUID(),
            sessionId: session.id,
            seq: offset + index + 2,
            kind: 'prompt',
            createdAt: now,
            data: {
              promptId: randomUUID(),
              at: now,
              content: [
                { type: 'image', mimeType: 'image/png', data: payload },
              ],
              _execution: { state: 'ended' },
            },
          }),
        ),
      });
    }
    await sessions(conn).updateMany({
      filter: { id: session.id },
      values: { lastSeq: length + 1 },
    });
    type Query = { sql: string };
    interface Driver {
      on(name: 'query', fn: (q: Query) => void): void;
      on(name: 'query-response', fn: (value: unknown, q: Query) => void): void;
      off(name: 'query', fn: (q: Query) => void): void;
      off(name: 'query-response', fn: (value: unknown, q: Query) => void): void;
    }
    const driver = await conn.client<Driver>();
    let bytes = 0,
      rows = 0,
      reads = 0,
      writes = 0,
      transactions = 0,
      lockStart: number | undefined,
      lockMs = 0;
    const query = (q: Query): void => {
      if (/^select\b/iu.test(q.sql)) reads += 1;
      if (/^(insert|update|delete)\b/iu.test(q.sql)) writes += 1;
      if (/^begin\b/iu.test(q.sql)) transactions += 1;
      if (/^commit\b/iu.test(q.sql) && lockStart !== undefined)
        lockMs = performance.now() - lockStart;
    };
    const response = (value: unknown, q: Query): void => {
      if (/^update\b/iu.test(q.sql) && lockStart === undefined)
        lockStart = performance.now();
      if (/^select\b/iu.test(q.sql) && /agent_?session_?events/iu.test(q.sql)) {
        bytes += Buffer.byteLength(JSON.stringify(value));
        rows += Array.isArray(value) ? value.length : 1;
      }
    };
    driver.on('query', query);
    driver.on('query-response', response);
    try {
      await service.prompt({ userId: 'owner' }, session.id, [
        { type: 'text', text: 'Next' },
      ]);
    } finally {
      driver.off('query', query);
      driver.off('query-response', response);
    }
    if (process.env.SUBMISSION_COST_REPORT)
      await appendFile(
        process.env.SUBMISSION_COST_REPORT,
        JSON.stringify({
          length,
          reads,
          writes,
          transactions,
          eventRowsReturned: rows,
          eventBytesReturned: bytes,
          lockMs,
        }) + '\n',
      );
    expect(lockStart).toBeDefined();
    expect(lockMs).toBeGreaterThan(0);
    expect(bytes).toBeGreaterThan(0);
    expect(bytes).toBeLessThan(10_000);
  });
}
