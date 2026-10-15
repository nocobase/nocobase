import { afterEach, describe, expect, it, vi } from 'vitest';
import { createHarness, skillMd, type Harness } from './harness.js';
import { agentsRepo } from '../server/core/agents/agent.store.js';
import { inputsRepo, runsRepo } from '../server/core/runs/run.store.js';

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
      if (count > 1) {
        const excluded = await h.createAgent({
          modelEntries: [{ tool: 'codex', model: null }],
        });
        const excludedRun = await h.enqueue(excluded, 'excluded-1');
        const conn = h.database.connection();
        await runsRepo(conn).updateMany({
          filter: { id: excludedRun },
          values: { priority: -1 },
        });
        const agent = (await agentsRepo(conn).findOne({
          filter: { id: excluded },
        }))!;
        const { revision: _revision, ...run } = (await runsRepo(conn).findOne({
          filter: { id: excludedRun },
        }))!;
        const inputs = await inputsRepo(conn).findMany({
          filter: { runId: excludedRun },
        });
        // Batch fixture setup outside the measured window, preserving full queued records.
        const copies = Array.from(
          { length: count - 2 },
          (_, index) => index + 2,
        );
        if (copies.length > 0) {
          await agentsRepo(conn).createMany({
            values: copies.map((index) => ({
              ...agent,
              id: `excluded-agent-${index}`,
            })),
          });
          await runsRepo(conn).createMany({
            values: copies.map((index) => ({
              ...run,
              id: `excluded-run-${index}`,
              agentId: `excluded-agent-${index}`,
              subjectId: `excluded-${index}`,
            })),
          });
          await inputsRepo(conn).createMany({
            values: copies.flatMap((index) =>
              inputs.map((input) => ({
                ...input,
                id: `${input.id}-${index}`,
                runId: `excluded-run-${index}`,
              })),
            ),
          });
        }
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
      await h.services.skills.attach(
        { scope: 'global', scopeId: 'default' },
        skillIds,
      );
      const agentId = await h.createAgent();
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
      const queued = await runsRepo(h.database.connection()).findMany({
        filter: { status: 'queued' },
        sort: (sort) => [
          sort.field('priority').asc(),
          sort.field('createdAt').asc(),
          sort.field('id').asc(),
        ],
      });
      expect(queued).toHaveLength(count);
      expect(new Set(queued.map((run) => run.agentId)).size).toBe(count);
      expect(queued.at(-1)?.id).toBe(runId);
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
      // Run skills use the current global/project defaults and one metadata join.
      // Writes remain INSERT 4, UPDATE 5, DELETE 1 on the same fixture.
      expect(counts.select).toBeLessThanOrEqual(25);
      expect(counts).toEqual({
        select: 17,
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
      // Candidate agents have no skill attachments. Run scopes load skills once.
      expect(selectsFrom('ag_skill_attachments')).toHaveLength(1);
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
    const agentId = await h.createAgent();
    await h.services.skills.attach({ scope: 'global', scopeId: 'default' }, [
      second.id,
      first.id,
    ]);
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
