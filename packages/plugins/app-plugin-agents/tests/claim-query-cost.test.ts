import { afterEach, describe, expect, it, vi } from 'vitest';
import { createHarness, skillMd, type Harness } from './harness.js';

interface QueryEvents {
  on(
    event: 'query',
    listener: (query: { sql: string; __knexTxId?: string }) => void,
  ): void;
  off(
    event: 'query',
    listener: (query: { sql: string; __knexTxId?: string }) => void,
  ): void;
}

describe('claim query cost', () => {
  let h: Harness;
  afterEach(async () => h?.close());

  it.each(
    [1, 10, 50].flatMap((count) =>
      [0, 3].map((skillCount) => ({ count, skillCount })),
    ),
  )(
    'loads $count candidates with $skillCount skills without additional reads',
    async ({ count, skillCount }) => {
      h = await createHarness();
      h.scopes = [{ scope: 'team', scopeId: 'team' }];
      for (let index = 1; index < count; index += 1) {
        const excluded = await h.createAgent({
          modelEntries: [{ tool: 'codex', model: null }],
        });
        await h.enqueue(excluded, `excluded-${index}`);
      }
      const skillIds: string[] = [];
      for (let index = 0; index < skillCount; index += 1)
        skillIds.push(
          (
            await h.services.skills.create('owner', {
              content: skillMd(`skill-${index}`, `Skill ${index}`),
            })
          ).id,
        );
      const agentId = await h.createAgent({ skillIds });
      await h.services.variables.set(
        { scope: 'team', scopeId: 'team' },
        'SHARED',
        'subject-value',
        null,
      );
      await h.services.variables.set(
        { scope: 'agent', scopeId: agentId },
        'SHARED',
        'agent-value',
        null,
      );
      const runId = await h.enqueue(agentId, 'selected');
      const registered = await h.registerRunner();
      const runner = await h.services.runners.authenticate(registered.key, {
        touch: false,
      });
      const queries: string[] = [];
      const knex = await h.database.connection().client<QueryEvents>();
      let transactionReads = 0;
      const onQuery = ({
        sql,
        __knexTxId,
      }: {
        sql: string;
        __knexTxId?: string;
      }) => {
        queries.push(sql);
        if (
          __knexTxId &&
          /^\s*select\b/iu.test(sql) &&
          /["`]ag_/u.test(sql) &&
          !/information_schema|pg_catalog/u.test(sql)
        )
          transactionReads += 1;
      };
      knex.on('query', onQuery);
      let payloads;
      try {
        payloads = await h.services.claims.claim(runner, 1);
      } finally {
        knex.off('query', onQuery);
      }
      expect(payloads.map((payload) => payload.run.id)).toEqual([runId]);
      expect(payloads[0].skills.map((skill) => skill.slug)).toEqual(
        Array.from({ length: skillCount }, (_, index) => `skill-${index}`),
      );
      expect(payloads[0].workspace.env).toEqual([
        { name: 'SHARED', value: 'agent-value' },
      ]);
      const business = queries.filter(
        (sql) =>
          /["`]ag_/u.test(sql) && !/information_schema|pg_catalog/u.test(sql),
      );
      const counts = Object.fromEntries(
        ['select', 'insert', 'update', 'delete'].map((kind) => [
          kind,
          business.filter((sql) =>
            new RegExp(`^\\s*${kind}\\b`, 'iu').test(sql),
          ).length,
        ]),
      );
      console.info(
        'claim-query-cost',
        { count, skillCount },
        counts,
        'transactionReads',
        transactionReads,
        'transactionControl',
        queries.filter((sql) => /^\s*(?:begin|commit|rollback)\b/iu.test(sql))
          .length,
        'catalogOrSchema',
        queries.length -
          business.length -
          queries.filter((sql) => /^\s*(?:begin|commit|rollback)\b/iu.test(sql))
            .length,
      );
      // PostgreSQL baseline at aae3508a4a: SELECT 45/63/143 for 1/10/50 candidates.
      // Writes were INSERT 4, UPDATE 5, DELETE 1 on the same fixture.
      expect(counts.select).toBeLessThanOrEqual(25);
      expect(counts).toEqual({
        select: 19 + 2 * skillCount,
        insert: 4,
        update: 5,
        delete: 1,
      });
      const selectsFrom = (table: string) =>
        business.filter(
          (sql) =>
            /^\s*select\b/iu.test(sql) &&
            new RegExp('["`]' + table + '["`]', 'u').test(sql),
        );
      expect(selectsFrom('ag_agents')).toHaveLength(1);
      const candidateIndex = business.indexOf(selectsFrom('ag_agents')[0]);
      expect(business[candidateIndex + 1]).toMatch(
        /^select .*ag_skill_attachments/iu,
      );
      // One candidate batch and one assembly's agent/team attachment reads.
      expect(selectsFrom('ag_skill_attachments')).toHaveLength(3);
      expect(selectsFrom('ag_secrets')).toHaveLength(1);
      expect(selectsFrom('ag_runner_variables')).toHaveLength(1);
      for (const target of [
        { scope: 'team', scopeId: 'team' },
        { scope: 'agent', scopeId: agentId },
      ]) {
        expect(
          (await h.services.variables.audits(target)).filter(
            (audit) => audit.action === 'deliver',
          ),
        ).toEqual([expect.objectContaining({ runId, names: ['SHARED'] })]);
      }
    },
  );
  it('stops candidate attempts when the runner became full after the read-only filter', async () => {
    h = await createHarness();
    const agentId = await h.createAgent();
    for (let index = 0; index < 4; index += 1)
      await h.enqueue(agentId, String(index));
    const registered = await h.registerRunner({ slots: 1 });
    const runner = await h.services.runners.authenticate(registered.key, {
      touch: false,
    });
    vi.spyOn(h.services.slots, 'held').mockResolvedValue({
      jobs: 0,
      runs: 1,
      byTool: { claude: 1 },
    });
    const knex = await h.database.connection().client<QueryEvents>();
    const writes: string[] = [];
    const listener = ({ sql }: { sql: string }) => {
      if (/^\s*update\b/iu.test(sql) && /["`]ag_agents["`]/u.test(sql))
        writes.push(sql);
    };
    knex.on('query', listener);
    try {
      expect(await h.services.claims.claim(runner, 1)).toEqual([]);
    } finally {
      knex.off('query', listener);
    }
    expect(writes).toHaveLength(1);
  });

  it('counts held runs without a tool toward total capacity', async () => {
    h = await createHarness();
    const agentId = await h.createAgent();
    const first = await h.enqueue(agentId, 'first');
    const registered = await h.registerRunner({ slots: 1 });
    const runner = await h.services.runners.authenticate(registered.key, {
      touch: false,
    });
    expect(await h.services.claims.claim(runner, 1)).toHaveLength(1);
    await h.database
      .connection()
      .repository('agRuns')
      .updateMany({ filter: { id: first }, values: { tool: null } });
    expect(
      await h.services.slots.held(h.database.connection(), runner.id),
    ).toEqual({ jobs: 0, runs: 1, byTool: {} });
    await h.enqueue(agentId, 'second');
    expect(await h.services.claims.claim(runner, 1)).toEqual([]);
  });

  it('loads skill metadata once and preserves attachment and target order', async () => {
    h = await createHarness();
    const makeSkill = (slug: string) =>
      h.services.skills.create('owner', { content: skillMd(slug, slug) });
    const first = await makeSkill('first');
    const second = await makeSkill('second');
    const third = await makeSkill('third');
    const agentId = await h.createAgent({ skillIds: [second.id, first.id] });
    h.scopes = [{ scope: 'team', scopeId: 'team' }];
    await h.services.skills.attach({ scope: 'team', scopeId: 'team' }, [
      first.id,
      third.id,
    ]);
    const runId = await h.enqueue(agentId);
    const registered = await h.registerRunner();
    const runner = await h.services.runners.authenticate(registered.key, {
      touch: false,
    });
    const load = vi.spyOn(h.services.skills, 'forRun');
    const [payload] = await h.services.claims.claim(runner, 1);
    expect(payload.run.id).toBe(runId);
    expect(payload.skills.map((skill) => skill.slug)).toEqual([
      'second',
      'first',
      'third',
    ]);
    expect(load).toHaveBeenCalledTimes(1);
  });
});
