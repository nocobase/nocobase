import { PROTOCOL_VERSION } from '@nocobase/agent-protocol';
import { afterEach, describe, expect, it } from 'vitest';
import { createHarness, type Harness } from './harness.js';

interface QueryEvents {
  on(event: 'query', listener: (query: { sql: string }) => void): void;
  off(event: 'query', listener: (query: { sql: string }) => void): void;
}

describe('runner authentication cost', () => {
  let h: Harness;
  afterEach(async () => h?.close());

  async function measure(work: () => Promise<unknown>) {
    const sql: string[] = [];
    const knex = await h.database.connection().client<QueryEvents>();
    const listener = (query: { sql: string }) => sql.push(query.sql);
    knex.on('query', listener);
    try {
      await work();
    } finally {
      knex.off('query', listener);
    }
    return sql;
  }

  it('touches both timestamps without a transaction or notification and skips writes for touch:false', async () => {
    h = await createHarness();
    const registered = await h.registerRunner();
    const events: string[] = [];
    const stop = h.services.events.onAny((event) => events.push(event.type));
    const queries = await measure(() =>
      h.services.runners.authenticate(registered.key),
    );
    stop();
    expect(queries.filter((sql) => /^\s*update\b/iu.test(sql))).toHaveLength(2);
    expect(
      queries.filter((sql) => /^\s*(?:begin|commit|rollback)\b/iu.test(sql)),
    ).toEqual([]);
    expect(events).toEqual([]);
    const record = await h.database
      .connection()
      .repository<{ lastSeenAt: string }>('agRunners')
      .findOne({ filter: { id: registered.runnerId } });
    const credential = await h.database
      .connection()
      .repository<{ lastUsedAt: string }>('agRunnerCredentials')
      .findOne({ filter: { runnerId: registered.runnerId } });
    expect(new Date(record!.lastSeenAt).toISOString()).toBe(
      new Date(credential!.lastUsedAt).toISOString(),
    );
    const readOnly = await measure(() =>
      h.services.runners.authenticate(registered.key, { touch: false }),
    );
    expect(
      readOnly.filter((sql) =>
        /^\s*(?:insert|update|delete|begin|commit|rollback)\b/iu.test(sql),
      ),
    ).toEqual([]);
    console.info('runner-authentication-cost', {
      statements: queries.length,
      readOnlyStatements: readOnly.length,
    });
  });

  it('commits protocol transitions before announcing upgrade and recovery', async () => {
    h = await createHarness();
    const registered = await h.registerRunner();
    const events: { type: string; committed: boolean }[] = [];
    const knex = await h.database.connection().client<QueryEvents>();
    let committed = false;
    const listener = (query: { sql: string }) => {
      if (/^\s*commit\b/iu.test(query.sql)) committed = true;
    };
    knex.on('query', listener);
    const stop = h.services.events.onAny((event) => {
      events.push({ type: event.type, committed });
    });
    try {
      const upgrade = await measure(() =>
        h.services.runners.authenticate(registered.key, { protocolVersion: 0 }),
      );
      expect(upgrade.filter((sql) => /^\s*begin\b/iu.test(sql))).toHaveLength(
        1,
      );
      expect(events).toEqual([
        { type: 'runner.changed', committed: true },
        { type: 'notice', committed: true },
      ]);
      expect((await h.services.runners.get(registered.runnerId)).status).toBe(
        'upgrade_required',
      );
      committed = false;
      events.length = 0;
      const recovery = await measure(() =>
        h.services.runners.authenticate(registered.key, {
          protocolVersion: PROTOCOL_VERSION,
        }),
      );
      expect(recovery.filter((sql) => /^\s*begin\b/iu.test(sql))).toHaveLength(
        1,
      );
      expect(events).toEqual([
        { type: 'runner.changed', committed: true },
        { type: 'notice.cleared', committed: true },
      ]);
      expect((await h.services.runners.get(registered.runnerId)).status).toBe(
        'online',
      );
    } finally {
      stop();
      knex.off('query', listener);
    }
  });
});
