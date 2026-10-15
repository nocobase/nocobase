// @vitest-environment node
import { AsyncLocalStorage } from 'node:async_hooks';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as summaries from '../../../../plugins/app-plugin-agents/server/core/runs/run.store.js';
import * as skills from '../../../../plugins/app-plugin-agents/server/core/skills/skill.store.js';
import * as deltas from '../../server/agents/comment-delta.js';
import * as initialization from '../../server/projects-init/store.js';
import { PROJECT_MANAGER_ID } from '../../shared/project-manager.js';
import { createBridgeHarness, type BridgeHarness } from './bridge-harness.js';

type Query = { sql: string; bindings?: unknown[]; __knexTxId?: string };
type Scope = { sources: string[]; call: number; identity: string };
const scope = new AsyncLocalStorage<Scope>();

// Values are compared only in memory. Neither values nor hashes of values leave the process.
function aliases() {
  const values = new Map<string, string>();
  return (value: string) => {
    if (!values.has(value)) values.set(value, `g${values.size + 1}`);
    return values.get(value)!;
  };
}

function template(sql: string) {
  return sql
    .replace(/'(?:''|[^'])*'/gu, '?')
    .replace(/\b\d+(?:\.\d+)?\b/gu, '?')
    .replace(/\s+/gu, ' ')
    .trim();
}

function business(sql: string) {
  return (
    /^(select|insert|update|delete)/iu.test(sql) &&
    !/pg_catalog|information_schema|__nocobase/u.test(sql)
  );
}

function category(source: string[], sql: string) {
  if (source.includes('materials.context')) return 'task-materials';
  if (source.some((s) => /^materials\./u.test(s))) return 'auxiliary-materials';
  if (source.some((s) => /identity|admit/u.test(s)))
    return 'identity-admission';
  if (/ag_(skill|secret|runner_variable)/u.test(sql)) return 'plugin-inputs';
  if (/ag_(run|agent|runner)/u.test(sql)) return 'plugin-run-and-capacity';
  if (/studioIssueOwnerHandoffs|authUsers/u.test(sql))
    return 'identity-admission';
  return 'unknown';
}

async function fixture(h: BridgeHarness, manager: boolean) {
  await h.addUser('alice');
  h.roles.set('alice', 'admin');
  const agentId = await h.createAgent({ name: 'Coder' });
  await h.claimOne();
  const project = await h.projects.projects.create(h.viewer('alice'), {
    name: 'Web',
  });
  await h.projects.projects.addResource(h.viewer('alice'), project.id, {
    type: 'gitRepo',
    url: 'https://example.com/acme/web.git',
    defaultRef: 'main',
  });
  const issue = await h.projects.issues.create(h.viewer('alice'), {
    title: 'Claim materials',
    projectId: project.id,
    statusKey: 'in_progress',
    executor: manager ? { type: 'agent', id: PROJECT_MANAGER_ID } : null,
  });
  if (!manager)
    await h.projects.comments.create(h.viewer('alice'), issue.id, {
      content: `[@Coder](mention://agent/${agentId}) implement it`,
    });
  return { h, agentId, issue };
}

async function capture(
  { h, agentId, issue }: Awaited<ReturnType<typeof fixture>>,
  instrument: boolean,
) {
  const restore: (() => void)[] = [];
  try {
    const identities = aliases();
    let nextCall = 0;
    const calls: {
      id: number;
      source: string;
      identity: string;
      queries: number;
      parameterGroup: string;
      connection: string;
    }[] = [];
    const callIndex = new Map<number, (typeof calls)[number]>();
    const callParameters = aliases();
    const connections = new WeakMap<object, string>();
    let nextConnection = 0;
    // Wrappers preserve this, arguments, return values and thrown errors. No database work is added.
    const wrap = (object: Record<string, any>, key: string, source: string) => {
      const original = object[key];
      if (typeof original !== 'function') return;
      const spy = vi.spyOn(object, key).mockImplementation(function (
        this: unknown,
        ...args: any[]
      ) {
        const parent = scope.getStore();
        const claim = args[1]?.run;
        const run =
          claim ?? (source === 'roster.diagnose' ? args[1] : undefined);
        const identity = run
          ? identities(JSON.stringify([run.actorUserId, run.agentId, run.id]))
          : (parent?.identity ?? 'request');
        const conn = args[0]?.query ? (args[0] as object) : undefined;
        if (conn && !connections.has(conn))
          connections.set(conn, `c${++nextConnection}`);
        const key =
          source === 'materials.context'
            ? [args[1], args[2]?.kind ?? null]
            : source === 'materials.summary'
              ? [
                  args[1]?.agentId,
                  args[1]?.subjectKind,
                  args[1]?.subjectId,
                  args[2],
                ]
              : source === 'materials.initialization'
                ? [args[1], args[2]]
                : source === 'materials.comment-delta'
                  ? [
                      args[2]?.agentId,
                      args[2]?.issueId,
                      args[2]?.runId,
                      args[2]?.commentRootRunId,
                      [
                        ...new Set(
                          args[2]?.inputs
                            ?.map((i: any) => i.payload?.commentId)
                            .filter(Boolean),
                        ),
                      ].sort(),
                    ]
                  : [identity];
        const call = {
          id: ++nextCall,
          source,
          identity,
          queries: 0,
          parameterGroup: callParameters(JSON.stringify([source, key])),
          connection: conn ? connections.get(conn)! : 'unknown',
        };
        calls.push(call);
        callIndex.set(call.id, call);
        return scope.run(
          {
            sources: [...(parent?.sources ?? []), source],
            call: call.id,
            identity,
          },
          () => Reflect.apply(original, this, args),
        );
      });
      restore.push(() => spy.mockRestore());
    };
    if (instrument) {
      wrap(h.agents.runners, 'authenticate', 'authentication');
      wrap(h.agents.claims, 'claim', 'claim');
      wrap(h.agents.claims, 'diagnose', 'roster.diagnose');
      wrap(h.agents, 'roster', 'roster.list');
      wrap(h.projects.issueContext, 'contextFor', 'materials.context');
      wrap(h.projects.commentQueries, 'list', 'comments.list');
      const subject = h.agents.subjects.get('issue')!;
      wrap(subject, 'actsAs', 'subject.identity');
      wrap(subject.context, 'prepare', 'subject.prepare');
      wrap(subject.context, 'admit', 'subject.admit');
      wrap(subject.context, 'assemble', 'subject.assemble');
      wrap(summaries, 'lastSummary', 'materials.summary');
      wrap(deltas, 'commentDelta', 'materials.comment-delta');
      wrap(initialization, 'initialDirOf', 'materials.initialization');
      wrap(skills, 'attachedSkillIds', 'plugin.skills');
      wrap(summaries, 'countActive', 'capacity.countActive');
    }
    const transactions = aliases();
    const parameters = aliases();
    let writeEpoch = 0;
    let dispatched = false;
    const records: {
      sequence: number;
      sqlTemplate: string;
      transaction: string;
      business: boolean;
      source: string[];
      call: number | null;
      identity: string;
      parameterGroup: string;
      writeEpoch: number;
      afterDispatch: boolean;
      count: number;
    }[] = [];
    let claimTx: string | undefined;
    const record = (query: Query) => {
      const current = scope.getStore();
      const tx = query.__knexTxId ? transactions(query.__knexTxId) : 'root';
      const normalized = query.sql.replace(/["`[\]]/gu, '');
      if (/^update .*\bag_runs\b.*\bstatus\b/u.test(normalized)) {
        claimTx = tx;
        dispatched = true;
      }
      if (/^(insert|update|delete)/iu.test(query.sql)) writeEpoch += 1;
      if (current) callIndex.get(current.call)!.queries += 1;
      records.push({
        sequence: records.length + 1,
        sqlTemplate: template(query.sql),
        transaction: tx,
        business: business(query.sql),
        source: current?.sources ?? [],
        call: current?.call ?? null,
        identity: current?.identity ?? 'request',
        parameterGroup: parameters(
          JSON.stringify([query.sql, query.bindings ?? []]),
        ),
        writeEpoch,
        afterDispatch: dispatched,
        count: 1,
      });
    };
    const client = await h.database.connection().client<any>();
    client.on('query', record);
    let payload;
    try {
      payload = await h.claimOne();
    } finally {
      client.off('query', record);
    }
    expect(payload.run).toBeDefined();
    expect(payload.agent.id).toBe(issue.executor?.id ?? agentId);
    const claimed = await summaries.findRunRecord(
      h.database.connection(),
      payload.run.id,
    );
    expect(claimed?.actorUserId).toBe('alice');
    expect(claimed?.subjectId).toBe(issue.id);
    expect(claimed?.status).toBe('dispatched');
    expect(claimTx).toBeDefined();
    const rows = records.map((row) => ({
      ...row,
      phase:
        row.transaction === claimTx
          ? 'claim-transaction'
          : row.source.includes('authentication')
            ? 'authentication'
            : row.source.includes('claim') && row.transaction === 'root'
              ? 'pre-lock'
              : row.transaction !== 'root'
                ? 'other-transaction'
                : 'unknown',
      category: category(row.source, row.sqlTemplate),
      rosterAfterDispatch:
        row.afterDispatch && row.source.some((s) => s.startsWith('roster.')),
    }));
    const summary = {
      total: rows.length,
      business: rows.filter((r) => r.business).length,
      writes: rows.filter((r) =>
        /^(insert|update|delete)/iu.test(r.sqlTemplate),
      ).length,
      transactions: rows.filter((r) => r.sqlTemplate === 'BEGIN;').length,
      commits: rows.filter((r) => r.sqlTemplate === 'COMMIT;').length,
      rollbacks: rows.filter((r) => r.sqlTemplate === 'ROLLBACK;').length,
      explicitLocks: rows.filter((r) => /for update/iu.test(r.sqlTemplate))
        .length,
      agentLocks: rows.filter((r) =>
        /^update .*ag_agents.*last_?claim_?at/iu.test(r.sqlTemplate),
      ).length,
      claimBusiness: rows.filter((r) => r.business && r.transaction === claimTx)
        .length,
      contextBuilds: rows.filter((r) =>
        r.sqlTemplate.includes('__repository_parent_labels'),
      ).length,
      claimContextBuilds: rows.filter(
        (r) =>
          r.transaction === claimTx &&
          r.sqlTemplate.includes('__repository_parent_labels'),
      ).length,
    };
    const grouped = new Map<
      string,
      { phase: string; transaction: string; sqlTemplate: string; count: number }
    >();
    for (const row of rows) {
      const key = JSON.stringify([row.phase, row.transaction, row.sqlTemplate]);
      const entry = grouped.get(key) ?? {
        phase: row.phase,
        transaction: row.transaction,
        sqlTemplate: row.sqlTemplate,
        count: 0,
      };
      entry.count += 1;
      grouped.set(key, entry);
    }
    expect(
      [...grouped.values()].reduce((sum, group) => sum + group.count, 0),
    ).toBe(summary.total);
    return { summary, rows, grouped: [...grouped.values()], calls };
  } finally {
    for (const undo of restore.reverse()) undo();
  }
}

describe.each([false, true])('claim evidence (manager=%s)', (manager) => {
  let plainHarness: BridgeHarness;
  let tracedHarness: BridgeHarness;
  let plain: Awaited<ReturnType<typeof fixture>>;
  let traced: Awaited<ReturnType<typeof fixture>>;
  beforeEach(async () => {
    plainHarness = await createBridgeHarness();
  });
  beforeEach(async () => {
    tracedHarness = await createBridgeHarness();
  });
  beforeEach(async () => {
    plain = await fixture(plainHarness, manager);
  });
  beforeEach(async () => {
    traced = await fixture(tracedHarness, manager);
  });
  afterEach(async () => {
    await tracedHarness?.close();
  });
  afterEach(async () => {
    await plainHarness?.close();
  });
  it('exports identical claims with and without measurement wrappers', async () => {
    const control = await capture(plain, false);
    const measured = await capture(traced, true);
    expect(measured.summary).toEqual(control.summary);
    // Ignore phase labels when proving that instrumentation left every SQL template and count unchanged.
    const counts = (rows: typeof control.rows) => {
      const result = new Map<string, number>();
      for (const row of rows)
        result.set(row.sqlTemplate, (result.get(row.sqlTemplate) ?? 0) + 1);
      return [...result].sort(([a], [b]) => a.localeCompare(b));
    };
    expect(counts(measured.rows)).toEqual(counts(control.rows));
    const directory = process.env.PM390_EVIDENCE_DIR;
    if (directory && process.env.NOCOBASE_TEST_DB_DIALECT === 'postgres') {
      const version = process.env.PM390_EVIDENCE_VERSION;
      if (!version || !/^[a-f0-9]{7,40}$/u.test(version))
        throw new Error('An evidence commit is required.');
      mkdirSync(directory, { recursive: true });
      writeFileSync(
        path.join(
          directory,
          `${version}-${manager ? 'manager' : 'ordinary'}.json`,
        ),
        JSON.stringify(
          { version, manager, control: control.summary, ...measured },
          null,
          2,
        ),
      );
    }
  });
});
