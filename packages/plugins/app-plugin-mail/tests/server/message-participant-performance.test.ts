// db-test-portability: dialect-specific — Opt-in native plan, log, journal and lock diagnostics.
import { statSync } from 'node:fs';
import { cpus, platform, arch } from 'node:os';
import { performance } from 'node:perf_hooks';
import { resolve } from 'node:path';
import { provisionTestDatabases } from '@nocobase/app-testing/server';
import {
  createDatabaseManager,
  type DatabaseConnection,
  type QueryAdapter,
  type Row,
} from '@nocobase/db';
import { describe, expect, it } from 'vitest';
import { createDatabaseMailStore } from '../../server/store.js';
import { toMessageRow } from '../../server/store/mappers.js';
import {
  replaceMessageParticipants,
  type MailParticipantSource,
} from '../../server/store/message-participants.js';
import type { MessageRow } from '../../server/store/rows.js';
import type { MailStore, NormalizedMailMessage } from '../../server/types.js';
import type { MailListMessagesInput } from '../../shared/mail.js';

// Opt-in only: assertions cover correctness and bounded statements, not machine-dependent latency budgets.
const enabled = process.env.RUN_MAIL_PARTICIPANT_BENCHMARK === '1';
const DATE = '2026-10-01T00:00:00.000Z';
const TARGET = 'sparse+crm@example.com';
const MAX_DOMAIN = [63, 63, 63, 61]
  .map((length) => 'd'.repeat(length))
  .join('.');
const MAX_ADDRESS = `${'l'.repeat(64)}@${MAX_DOMAIN}`;
const PUNCTUATION = ["a'b", 'a_b', 'a-b', 'a+b', 'a%b'].map(
  (local) => `${local}@punctuation.example.com`,
);
const SAMPLES = 5;

interface Statement {
  sql: string;
  bindings: unknown[];
}
// Structural interface avoids adding Knex or a native driver dependency to the plugin.
interface ObservedClient {
  on(event: 'query', listener: (statement: Statement) => void): void;
  off(event: 'query', listener: (statement: Statement) => void): void;
  raw(sql: string, bindings?: readonly unknown[]): Promise<unknown>;
}

function uuid(index: number): string {
  return `00000000-0000-4000-8000-${index.toString(16).padStart(12, '0')}`;
}

function fixtureMessage(index: number, size: number): NormalizedMailMessage {
  const addressHit = index % 1000 < 4;
  const domainHit = index % 1000 >= 4 && index % 1000 < 8;
  const to = [
    {
      address: addressHit
        ? TARGET
        : domainHit
          ? 'peer@example.com'
          : `person${index}@ordinary.example.net`,
    },
    {
      address: addressHit
        ? TARGET.toUpperCase()
        : 'second@ordinary.example.net',
    },
  ];
  if (index === 0)
    to.push(...[MAX_ADDRESS, ...PUNCTUATION].map((address) => ({ address })));
  return {
    providerMessageId: `historical-${index}`,
    providerConversationId: `thread-${Math.floor(index / 10)}`,
    providerFolderIds: ['inbox'],
    from: {
      address: addressHit
        ? TARGET.toUpperCase()
        : 'sender@ordinary.example.net',
    },
    // Keep the original recipientsSearch TEXT payload below MySQL's 64 KiB limit, without truncating it.
    to:
      index === size - 1
        ? Array.from({ length: 1250 }, (_, i) => ({
            address: `to-${i}@bulk.test`,
          }))
        : to,
    cc:
      index === size - 1
        ? Array.from({ length: 1250 }, (_, i) => ({
            address: `cc-${i}@bulk.test`,
          }))
        : [{ address: addressHit ? TARGET : 'copy@ordinary.example.net' }],
    bcc: [{ address: TARGET }],
    replyTo: [{ address: TARGET }],
    references: [],
    subject: `Synthetic message ${index}`,
    preview: `Content mentions ${TARGET}, but this is not an address match.`,
    text: 'Unchanged synthetic source body.',
    receivedAt: DATE,
    read: false,
    starred: false,
    draft: false,
    attachments: [],
  };
}

function participantCount(message: NormalizedMailMessage): number {
  return [message.from ? [message.from] : [], message.to, message.cc].reduce(
    (sum, addresses) =>
      sum +
      new Set(addresses.map(({ address }) => address.trim().toLowerCase()))
        .size,
    0,
  );
}

function report(kind: string, value: unknown): void {
  // Direct output remains visible with reporters that buffer successful-test console calls.
  process.stdout.write(
    `MAIL_PARTICIPANT_BENCHMARK ${JSON.stringify({ kind, value })}\n`,
  );
}

function summary(samples: readonly number[]) {
  const sorted = [...samples].sort((a, b) => a - b);
  return {
    samplesMs: samples.map((value) => Number(value.toFixed(3))),
    medianMs: Number((sorted[Math.floor(sorted.length / 2)] ?? 0).toFixed(3)),
    minMs: Number((sorted[0] ?? 0).toFixed(3)),
    maxMs: Number((sorted.at(-1) ?? 0).toFixed(3)),
  };
}

async function measured<T>(
  run: () => Promise<T>,
): Promise<{ value: T; ms: number }> {
  const start = performance.now();
  const value = await run();
  return { value, ms: performance.now() - start };
}

async function count(query: QueryAdapter, table: string): Promise<number> {
  const result = await query
    .selectFrom(table)
    .select(({ fn }) => [fn.count('id').as('count')])
    .executeTakeFirst<{ count: number | string }>();
  return Number(result?.count ?? 0);
}

async function countParticipants(query: QueryAdapter): Promise<number> {
  const result = await query
    .selectFrom('mailMessageParticipants')
    .select(({ fn }) => [fn.count('messageId').as('count')])
    .executeTakeFirst<{ count: number | string }>();
  return Number(result?.count ?? 0);
}

function rawRows(result: unknown): Row[] {
  if (Array.isArray(result)) {
    // MySQL returns [rows, fields], SQLite returns rows directly.
    if (Array.isArray(result[0])) return result[0] as Row[];
    return result as Row[];
  }
  if (result !== null && typeof result === 'object' && 'rows' in result)
    return (result as { rows: Row[] }).rows;
  throw new Error('Unknown adapter raw result shape');
}

function physicalTable(
  connection: DatabaseConnection,
  logical: string,
): string {
  // compile() applies the connection naming strategy; never assume snake_case in raw diagnostics.
  const sql = connection.query
    .selectFrom(logical)
    .selectAll()
    .limit(1)
    .compile().sql;
  const name = /\bfrom\s+["`]([^"`]+)["`]/i.exec(sql)?.[1];
  if (!name)
    throw new Error(`Cannot resolve compiled table name for ${logical}`);
  return name;
}

async function storageMetrics(
  connection: DatabaseConnection,
  client: ObservedClient,
): Promise<void> {
  const table = physicalTable(connection, 'mailMessageParticipants');
  try {
    let rows: Row[];
    if (connection.dialect === 'sqlite') {
      const schema = await connection.schemaInspector.getPhysicalCollection({
        tableName: table,
      });
      const names = [
        table,
        ...(schema?.indexes.map((index) => index.name) ?? []),
      ];
      rows = rawRows(
        await client.raw(
          `select name, sum(pgsize) as bytes from dbstat where name in (${names.map(() => '?').join(', ')}) group by name`,
          names,
        ),
      );
    } else if (connection.dialect === 'postgres') {
      rows = rawRows(
        await client.raw(
          'select pg_table_size(?) as table_bytes, pg_indexes_size(?) as index_bytes, pg_total_relation_size(?) as total_bytes',
          [table, table, table],
        ),
      );
    } else if (connection.dialect === 'mysql') {
      // Refresh derived-table statistics before reading allocation; cached empty-table metadata is not growth evidence.
      await client.raw('analyze table ??', [table]);
      await client.raw('set session information_schema_stats_expiry = 0');
      rows = rawRows(
        await client.raw(
          'select data_length as table_bytes, index_length as index_bytes from information_schema.tables where table_schema = database() and table_name = ?',
          [table],
        ),
      );
    } else {
      report('storage', {
        dialect: connection.dialect,
        available: false,
        reason:
          'No native size diagnostic implemented for this selected dialect.',
      });
      return;
    }
    report('storage', {
      dialect: connection.dialect,
      rows,
      note: 'Native allocated/estimated bytes, not logical payload bytes; MySQL table metadata may lag.',
    });
  } catch (error) {
    report('storage', {
      dialect: connection.dialect,
      available: false,
      reason: error instanceof Error ? error.message : String(error),
    });
  }
}

function diagnosticFailure(error: unknown): string {
  // Do not emit connection strings, server messages or arbitrary SQL from driver errors.
  if (error !== null && typeof error === 'object' && 'code' in error)
    return String(error.code);
  return error instanceof Error ? error.name : 'unknown diagnostic failure';
}

async function observeMigrationOperations(
  connection: DatabaseConnection,
  observer: ObservedClient,
  size: number,
) {
  const dialect = connection.dialect;
  const failures = new Set<string>();
  const diagnostic = async (
    name: string,
    sql: string,
    bindings?: readonly unknown[],
  ) => {
    try {
      return rawRows(await observer.raw(sql, bindings));
    } catch (error) {
      failures.add(`${name}: ${diagnosticFailure(error)}`);
      return undefined;
    }
  };
  // All observer requests use its independent one-connection pool and native bounded waits.
  let boundedNativeRequests = true;
  try {
    if (dialect === 'postgres') {
      await observer.raw("set statement_timeout = '1000ms'");
      await observer.raw("set lock_timeout = '100ms'");
    } else if (dialect === 'mysql') {
      await observer.raw('set session max_execution_time = 1000');
      await observer.raw('set session innodb_lock_wait_timeout = 1');
      await observer.raw('set session lock_wait_timeout = 1');
    } else if (dialect === 'sqlite') {
      await observer.raw('PRAGMA busy_timeout = 0');
    }
  } catch (error) {
    boundedNativeRequests = false;
    failures.add(
      `Observer timeout setup failed; native log/lock requests disabled: ${diagnosticFailure(error)}`,
    );
  }
  const logSnapshot = async () => {
    if (!boundedNativeRequests) return {};
    if (dialect === 'postgres')
      return {
        wal: await diagnostic(
          'WAL insert LSN',
          'select pg_current_wal_insert_lsn()::text as lsn',
        ),
      };
    if (dialect === 'mysql')
      return {
        counters: await diagnostic(
          'InnoDB global status',
          "show global status where Variable_name in ('Innodb_os_log_written', 'Innodb_lsn_current', 'Innodb_redo_log_current_lsn', 'Innodb_redo_log_logical_size', 'Innodb_log_waits', 'Innodb_row_lock_waits', 'Innodb_row_lock_time')",
        ),
        redo: await diagnostic(
          'InnoDB currentLSN',
          "select JSON_UNQUOTE(JSON_EXTRACT(storage_engines, '$.InnoDB.LSN')) as current_lsn from performance_schema.log_status",
        ),
      };
    return {};
  };
  let filename: string | undefined;
  let journalMode: unknown;
  if (dialect === 'sqlite') {
    const databases = await diagnostic(
      'SQLite database file',
      'PRAGMA database_list',
    );
    const file = databases?.find((row) => row.name === 'main')?.file;
    if (typeof file === 'string' && file.length > 0) filename = file;
    else
      failures.add(
        'SQLite file observations: main database is not file-backed',
      );
    journalMode = await diagnostic(
      'SQLite journal mode',
      'PRAGMA journal_mode',
    );
  }
  const files = () => {
    if (!filename) return undefined;
    return Object.fromEntries(
      [
        ['database', ''],
        ['journal', '-journal'],
        ['wal', '-wal'],
        ['shm', '-shm'],
      ].map(([name, suffix]) => {
        try {
          return [
            name,
            { exists: true, bytes: statSync(`${filename}${suffix}`).size },
          ];
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== 'ENOENT')
            failures.add(`SQLite file stat: ${diagnosticFailure(error)}`);
          return [name, { exists: false, bytes: 0 }];
        }
      }),
    );
  };
  const beforeFiles = files();
  const maximumFileBytes: Record<string, number> = {};
  const fileExistenceSamples: Record<string, number> = {};
  let fileSamples = 0;
  const sampleFiles = () => {
    const sample = files();
    if (!sample || fileSamples >= 2048) return;
    fileSamples++;
    for (const [name, value] of Object.entries(sample)) {
      maximumFileBytes[name] = Math.max(
        maximumFileBytes[name] ?? 0,
        value.bytes,
      );
      if (value.exists)
        fileExistenceSamples[name] = (fileExistenceSamples[name] ?? 0) + 1;
    }
  };
  const beforeLog = await logSnapshot();
  const source = physicalTable(connection, 'mailMessages');
  const participant = physicalTable(connection, 'mailMessageParticipants');
  const footprintSamples: Array<{
    diagnostic: string;
    startMs: number;
    elapsedMs: number;
    migrationStillRunning: boolean;
    rows: Row[];
  }> = [];
  const probes: Array<{
    startMs: number;
    elapsedMs: number;
    outcome: string;
    code?: string;
    migrationStillRunning: boolean;
  }> = [];
  let active = true;
  let pending: Promise<void> | undefined;
  let nativeSamples = 0;
  let insertEvents = 0;
  let queryEvents = 0;
  const start = performance.now();
  const footprint = async (
    name: string,
    sql: string,
    bindings?: readonly unknown[],
  ) => {
    const sampleStart = performance.now();
    const rows = await diagnostic(name, sql, bindings);
    if (rows)
      footprintSamples.push({
        diagnostic: name,
        startMs: Number((sampleStart - start).toFixed(3)),
        elapsedMs: Number((performance.now() - sampleStart).toFixed(3)),
        migrationStillRunning: active,
        rows,
      });
  };
  const sampleNative = async () => {
    if (dialect === 'postgres') {
      await footprint(
        'pg_locks footprint',
        "select coalesce(c.relname, 'uncommitted/unknown relation') as relation, l.mode, l.granted, count(*)::int as locks from pg_locks l left join pg_class c on c.oid = l.relation where l.database = (select oid from pg_database where datname = current_database()) and l.relation is not null and (c.relname in (?, ?) or c.oid is null) group by c.relname, l.mode, l.granted",
        [source, participant],
      );
      await footprint(
        'PostgreSQL lock waits',
        "select wait_event_type, wait_event, count(*)::int as sessions from pg_stat_activity where datname = current_database() and pid <> pg_backend_pid() and wait_event_type = 'Lock' group by wait_event_type, wait_event",
      );
    } else if (dialect === 'mysql') {
      for (const [name, sql] of [
        [
          'InnoDB data locks',
          'select lock_type, lock_mode, lock_status, count(*) as locks from performance_schema.data_locks where object_schema = database() group by lock_type, lock_mode, lock_status',
        ],
        [
          'MySQL metadata locks',
          'select lock_type, lock_duration, lock_status, count(*) as locks from performance_schema.metadata_locks where object_schema = database() group by lock_type, lock_duration, lock_status',
        ],
        [
          'InnoDB data lock waits',
          'select count(*) as waits from performance_schema.data_lock_waits w join performance_schema.data_locks l on l.engine_lock_id = w.requesting_engine_lock_id and l.engine = w.engine where l.object_schema = database()',
        ],
      ]) {
        await footprint(name!, sql!);
      }
    }
    if (!active) return;
    const probeStart = performance.now();
    let outcome = 'completed without observed blocking';
    let code: string | undefined;
    try {
      if (dialect === 'sqlite') {
        // No data writes: acquire and immediately release a competing writer reservation.
        await observer.raw('BEGIN IMMEDIATE');
        await observer.raw('ROLLBACK');
      } else {
        // Autocommit releases any acquired row lock immediately. NOWAIT never holds up migration.
        await observer.raw('select id from ?? where id = ? for update nowait', [
          source,
          uuid(1),
        ]);
      }
    } catch (error) {
      code = diagnosticFailure(error);
      outcome = [
        'SQLITE_BUSY',
        '55P03',
        'ER_LOCK_NOWAIT',
        'ER_LOCK_WAIT_TIMEOUT',
      ].includes(code)
        ? 'observed competing probe lock refusal/timeout'
        : 'probe unavailable or failed; not lock proof';
      // A refused BEGIN has no transaction to roll back; SELECT probes are autocommit.
    }
    probes.push({
      startMs: Number((probeStart - start).toFixed(3)),
      elapsedMs: Number((performance.now() - probeStart).toFixed(3)),
      outcome,
      ...(code ? { code } : {}),
      migrationStillRunning: active,
    });
  };
  return {
    onQuery: (statement: Statement) => {
      queryEvents++;
      if (queryEvents % 10 === 0) sampleFiles();
      if (
        !/^insert/i.test(statement.sql) ||
        !statement.sql.includes(participant)
      )
        return;
      insertEvents++;
      // At most 32 native samples, one in flight; never accumulate promises or row-level lock lists.
      if (
        boundedNativeRequests &&
        (insertEvents === 1 || insertEvents % 50 === 0) &&
        !pending &&
        nativeSamples < 32
      ) {
        nativeSamples++;
        pending = sampleNative()
          .catch((error: unknown) => {
            failures.add(`native sample: ${diagnosticFailure(error)}`);
          })
          .finally(() => {
            pending = undefined;
          });
      }
    },
    finish: async () => {
      active = false;
      await pending;
      sampleFiles();
      const afterLog = await logSnapshot();
      let walDelta: Row[] | undefined;
      const lsn = beforeLog.wal?.[0]?.lsn;
      const finalLsn = afterLog.wal?.[0]?.lsn;
      if (
        dialect === 'postgres' &&
        typeof lsn === 'string' &&
        typeof finalLsn === 'string'
      )
        walDelta = await diagnostic(
          'WAL LSN difference',
          'select pg_wal_lsn_diff(?::pg_lsn, ?::pg_lsn)::text as bytes',
          [finalLsn, lsn],
        );
      const counterDeltas: Record<string, string> = {};
      for (const row of beforeLog.counters ?? []) {
        const final = afterLog.counters?.find(
          (candidate) => candidate.Variable_name === row.Variable_name,
        );
        if (
          final &&
          /^\d+$/.test(String(row.Value)) &&
          /^\d+$/.test(String(final.Value))
        )
          counterDeltas[String(row.Variable_name)] = String(
            BigInt(String(final.Value)) - BigInt(String(row.Value)),
          );
      }
      report('migration-operations', {
        size,
        dialect,
        beforeLog,
        afterLog,
        walDelta,
        counterDeltas,
        redoLsnDeltaBytes:
          /^\d+$/.test(String(beforeLog.redo?.[0]?.current_lsn)) &&
          /^\d+$/.test(String(afterLog.redo?.[0]?.current_lsn))
            ? String(
                BigInt(String(afterLog.redo?.[0]?.current_lsn)) -
                  BigInt(String(beforeLog.redo?.[0]?.current_lsn)),
              )
            : undefined,
        sqlite:
          dialect === 'sqlite'
            ? {
                journalMode,
                beforeFiles,
                afterFiles: files(),
                fileSamples,
                maximumSampledFileBytes: maximumFileBytes,
                fileExistenceSamples,
                sampleCap: 2048,
              }
            : undefined,
        nativeSamples,
        nativeSampleCap: 32,
        footprintSamples,
        probes,
        unavailable: [...failures],
        note: 'Observation window surrounds actual migrator.latest(), including DDL, commit and bookkeeping. Log counters/LSNs are server-wide, not migration-exclusive; successful row-lock probes can themselves generate WAL. File sizes and native lock groups are bounded samples, not peaks or cumulative bytes written. Independent diagnostic session; only competing traffic is the safe bounded probe. A successful source-row probe does not prove all migration locks are nonblocking. Native catalogs may be unavailable or instrumentation disabled. Diagnostics add measurement overhead; no online-upgrade safety claim.',
      });
    },
  };
}

async function seed(
  connection: DatabaseConnection,
  size: number,
): Promise<number> {
  for (let i = 0; i < 4; i++) {
    await connection.query
      .insertInto('mailAccounts')
      .values({
        id: uuid(100000 + i),
        userId: 'benchmark-owner',
        providerType: 'test',
        providerName: 'test',
        address: `account${i}@ordinary.example.net`,
        credentialReference: 'unused',
        scopes: '[]',
        status: 'active',
        createdAt: DATE,
        updatedAt: DATE,
      })
      .execute();
    await connection.query
      .insertInto('mailFolders')
      .values({
        id: uuid(200000 + i),
        accountId: uuid(100000 + i),
        providerFolderId: 'inbox',
        type: 'inbox',
        name: 'Inbox',
        kind: 'folder',
      })
      .execute();
  }
  let expected = 0;
  // Bound source seed memory and bindings too; do not construct or fetch all large-mailbox rows.
  await connection.transaction(async ({ query }) => {
    for (let start = 0; start < size; start += 25) {
      const rows = Array.from(
        { length: Math.min(25, size - start) },
        (_, offset) => {
          const index = start + offset;
          const message = fixtureMessage(index, size);
          expected += participantCount(message);
          return toMessageRow(
            uuid(100000 + (index % 4)),
            message,
            uuid(index + 1),
            DATE,
            DATE,
          );
        },
      );
      await query.insertInto<MessageRow>('mailMessages').values(rows).execute();
      await query
        .insertInto('mailMessageFolders')
        .values(
          rows.map((row) => ({
            messageId: row.id,
            accountId: row.accountId,
            providerFolderId: 'inbox',
          })),
        )
        .execute();
    }
  });
  return expected;
}

async function sourceFingerprint(query: QueryAdapter) {
  const aggregate = await query
    .selectFrom('mailMessages')
    .select(({ fn }) => [
      fn.count('id').as('count'),
      fn.min('updatedAt').as('minUpdatedAt'),
      fn.max('updatedAt').as('maxUpdatedAt'),
    ])
    .executeTakeFirst();
  const samples = await query
    .selectFrom('mailMessages')
    .selectAll()
    .where('id', 'in', [uuid(1), uuid(125), uuid(5000), uuid(30000)])
    .orderBy('id')
    .execute();
  return { aggregate, samples };
}

async function benchmarkQueries(
  store: MailStore,
  client: ObservedClient,
  connection: DatabaseConnection,
  size: number,
) {
  for (const [scope, accountIds] of [
    ['four-accounts', undefined],
    ['one-account', [uuid(100000)]],
  ] as const) {
    for (const participant of [undefined, TARGET, '@example.com']) {
      const expectedTotal =
        participant === undefined
          ? size / (accountIds ? 4 : 1)
          : ((size / 1000) * (participant === TARGET ? 4 : 8)) /
            (accountIds ? 4 : 1);
      const input: MailListMessagesInput = {
        accountIds,
        participant,
        withTotal: true,
        limit: 3,
      };
      const expectedIds =
        participant === undefined
          ? undefined
          : Array.from({ length: size }, (_, index) => index)
              .filter(
                (index) =>
                  index % 1000 < (participant === TARGET ? 4 : 8) &&
                  (!accountIds || index % 4 === 0),
              )
              .reverse()
              .map((index) => uuid(index + 1));
      // Warm-up excluded from timing and capture the actual store SQL, not a re-created approximation.
      const statements = new Map<string, Statement>();
      const capture = (statement: Statement) => {
        if (
          /^select/i.test(statement.sql) &&
          statement.sql.includes(physicalTable(connection, 'mailMessages')) &&
          (participant === undefined ||
            statement.sql.includes(
              physicalTable(connection, 'mailMessageParticipants'),
            ))
        ) {
          const kind = /count\(/i.test(statement.sql) ? 'count' : 'rows';
          if (!statements.has(kind))
            statements.set(kind, {
              sql: statement.sql,
              bindings: [...statement.bindings],
            });
        }
      };
      client.on('query', capture);
      let first;
      try {
        first = await store.listMessages('benchmark-owner', input);
      } finally {
        client.off('query', capture);
      }
      expect(first.total).toBe(expectedTotal);
      expect(statements.size).toBe(2);
      for (const [kind, statement] of statements) {
        expect(
          statement.sql.includes(
            physicalTable(connection, 'mailMessageParticipants'),
          ),
        ).toBe(participant !== undefined);
        const prefix =
          connection.dialect === 'sqlite' ? 'EXPLAIN QUERY PLAN' : 'EXPLAIN';
        if (!['sqlite', 'postgres', 'mysql'].includes(connection.dialect))
          throw new Error(
            'This opt-in plan harness currently supports SQLite, PostgreSQL and MySQL only.',
          );
        // Knex raw() consumes ? placeholders; its PostgreSQL query event exposes native $n placeholders.
        // Preserve positional reuse/order instead of interpolating fixture values into SQL.
        const explainBindings: unknown[] = [];
        const explainSql =
          connection.dialect === 'postgres'
            ? statement.sql.replace(
                /\$(\d+)\b/g,
                (_match, position: string) => {
                  const index = Number(position) - 1;
                  if (index < 0 || index >= statement.bindings.length)
                    throw new Error(
                      'Captured PostgreSQL binding position is out of range.',
                    );
                  explainBindings.push(statement.bindings[index]);
                  return '?';
                },
              )
            : statement.sql;
        const plan = rawRows(
          await client.raw(
            `${prefix} ${explainSql}`,
            connection.dialect === 'postgres'
              ? explainBindings
              : statement.bindings,
          ),
        );
        expect(plan.length).toBeGreaterThan(0);
        report('plan', {
          size,
          scope,
          participant: participant ?? 'none',
          kind,
          sql: statement.sql,
          bindings: statement.bindings,
          plan,
        });
      }
      // Verify every sparse page against independent fixture IDs, including tied timestamps and repeated roles.
      if (expectedIds) {
        const seen: string[] = [];
        let cursor: string | undefined;
        do {
          const page = await store.listMessages('benchmark-owner', {
            ...input,
            cursor,
          });
          const offsetPage = await store.listMessages('benchmark-owner', {
            ...input,
            offset: seen.length,
          });
          expect(page.total).toBe(expectedTotal);
          expect(offsetPage.total).toBe(expectedTotal);
          const ids = page.items.map((item) => item.id);
          expect(ids).toEqual(
            expectedIds.slice(seen.length, seen.length + input.limit!),
          );
          expect(offsetPage.items.map((item) => item.id)).toEqual(ids);
          seen.push(...ids);
          cursor = page.nextCursor;
        } while (cursor);
        expect(seen).toEqual(expectedIds);
        expect(new Set(seen).size).toBe(expectedTotal);
        expect(
          (
            await store.listMessages('benchmark-owner', {
              ...input,
              offset: expectedTotal,
            })
          ).items,
        ).toEqual([]);
      }
      for (const [mode, paging] of [
        ['total-first', {}],
        ['cursor-second', { cursor: first.nextCursor }],
        ['offset-second', { offset: 3 }],
        ['offset-deep', { offset: Math.max(0, expectedTotal - 3) }],
      ] as const) {
        const samples: number[] = [];
        for (let i = 0; i < SAMPLES; i++) {
          const result = await measured(() =>
            store.listMessages('benchmark-owner', { ...input, ...paging }),
          );
          expect(result.value.total).toBe(expectedTotal);
          expect(new Set(result.value.items.map((item) => item.id)).size).toBe(
            result.value.items.length,
          );
          samples.push(result.ms);
        }
        report('list', {
          size,
          scope,
          participant: participant ?? 'none',
          mode,
          total: expectedTotal,
          ...summary(samples),
        });
      }
    }
  }
  for (const participant of [
    MAX_ADDRESS,
    `@${MAX_DOMAIN}`,
    ...PUNCTUATION,
    'missing@example.com',
  ]) {
    const page = await store.listMessages('benchmark-owner', {
      participant,
      withTotal: true,
    });
    expect(page.total).toBe(participant === 'missing@example.com' ? 0 : 1);
    if (page.total)
      expect(page.items.map((item) => item.id)).toEqual([uuid(1)]);
  }
}

async function benchmarkWrites(
  store: MailStore,
  connection: DatabaseConnection,
  size: number,
) {
  for (const batchSize of [100, 500]) {
    const sources = await connection.query
      .selectFrom('mailMessages')
      .select(['id', 'accountId', 'sender', 'recipients'])
      .orderBy('id')
      .limit(batchSize)
      .execute<MailParticipantSource>();
    const original = await sourceFingerprint(connection.query);
    const timings: Record<string, number[]> = {
      sourceOnly: [],
      sourceAndIndex: [],
      replaceOnly: [],
    };
    const writeSource = async (query: QueryAdapter) => {
      // Exactly the same original JSON values and IDs in both paths; no timestamp or source address changes.
      for (const source of sources)
        await query
          .updateTable('mailMessages')
          .set({ sender: source.sender, recipients: source.recipients })
          .where('id', '=', source.id)
          .execute();
    };
    for (let sample = 0; sample < SAMPLES; sample++) {
      // Alternate order to limit systematic cache/order bias. All timings include one transaction/commit.
      const modes =
        sample % 2
          ? ['replaceOnly', 'sourceAndIndex', 'sourceOnly']
          : ['sourceOnly', 'sourceAndIndex', 'replaceOnly'];
      for (const mode of modes) {
        const result = await measured(() =>
          connection.transaction(async ({ query }) => {
            if (mode !== 'replaceOnly') await writeSource(query);
            if (mode !== 'sourceOnly')
              await replaceMessageParticipants(query, sources);
          }),
        );
        timings[mode]!.push(result.ms);
      }
    }
    expect(await sourceFingerprint(connection.query)).toEqual(original);
    report('attributable-write', {
      size,
      batchSize,
      sourceOnly: summary(timings.sourceOnly!),
      sourceAndIndex: summary(timings.sourceAndIndex!),
      replaceOnly: summary(timings.replaceOnly!),
      medianAddedMs:
        summary(timings.sourceAndIndex!).medianMs -
        summary(timings.sourceOnly!).medianMs,
      note: 'Same-value source updates, not pre-change save/sync code. Replace-only and combined measurements include transaction overhead.',
    });
    const accountId = uuid(100000);
    const inputs = Array.from({ length: batchSize }, (_, index) => ({
      ...fixtureMessage(index + 100, size),
      providerMessageId: `save-${batchSize}-${index}`,
      providerFolderIds: [],
    }));
    const beforeCount = await count(connection.query, 'mailMessages');
    const beforeParticipants = await countParticipants(connection.query);
    const addedParticipants = inputs.reduce(
      (sum, input) => sum + participantCount(input),
      0,
    );
    const save = await measured(async () => {
      for (const input of inputs) await store.saveMessage(accountId, input);
    });
    expect(await count(connection.query, 'mailMessages')).toBe(
      beforeCount + batchSize,
    );
    expect(await countParticipants(connection.query)).toBe(
      beforeParticipants + addedParticipants,
    );
    const syncInputs = inputs.map((input) => ({
      ...input,
      providerMessageId: input.providerMessageId.replace('save-', 'sync-'),
    }));
    const sync = () =>
      store.commitSyncBatch({
        accountId,
        folders: [],
        messages: syncInputs,
        deletedProviderMessageIds: [],
        removedFromFolders: [],
        nextCursor: { value: 'benchmark' },
      });
    const insert = await measured(sync);
    expect(await count(connection.query, 'mailMessages')).toBe(
      beforeCount + batchSize * 2,
    );
    expect(await countParticipants(connection.query)).toBe(
      beforeParticipants + addedParticipants * 2,
    );
    const update = await measured(sync);
    expect(await count(connection.query, 'mailMessages')).toBe(
      beforeCount + batchSize * 2,
    );
    expect(await countParticipants(connection.query)).toBe(
      beforeParticipants + addedParticipants * 2,
    );
    const indexed = await connection.query
      .selectFrom('mailMessageParticipants')
      .select(({ fn }) => [fn.count('messageId').as('count')])
      .where(
        'messageId',
        'in',
        sources.map((source) => source.id),
      )
      .executeTakeFirst<{ count: number | string }>();
    expect(Number(indexed?.count)).toBe(
      sources.reduce(
        (total, _, index) =>
          total + participantCount(fixtureMessage(index, size)),
        0,
      ),
    );
    report('accepted-write', {
      size,
      batchSize,
      saveMs: save.ms,
      saveMsPerMessage: save.ms / batchSize,
      syncInsertMs: insert.ms,
      syncInsertMsPerMessage: insert.ms / batchSize,
      syncUpdateMs: update.ms,
      syncUpdateMsPerMessage: update.ms / batchSize,
    });
  }
  // Exercise runtime replacement bounds with the same 2,500-recipient source used by the backfill.
  const many = await connection.query
    .selectFrom('mailMessages')
    .select(['id', 'accountId', 'sender', 'recipients'])
    .where('id', '=', uuid(size))
    .executeTakeFirstOrThrow<MailParticipantSource>();
  const largeReplacement = await measured(() =>
    connection.transaction(({ query }) =>
      replaceMessageParticipants(query, [many]),
    ),
  );
  report('mass-recipient-replace', {
    size,
    recipients: 2500,
    participantRows: 2501,
    ms: largeReplacement.ms,
  });
}

describe.skipIf(!enabled)(
  'Mail participant performance/scale verification (opt-in)',
  () => {
    it.each([5000, 30000])(
      'verifies historical backfill, real list plans and accepted writes at %i messages',
      async (size) => {
        const provisioned = await provisionTestDatabases();
        const fixture = await provisioned.open({ migrations: [] });
        const { database, connection } = fixture;
        // Independent single-session pool: never queue diagnostics behind the migration transaction.
        const diagnostics = createDatabaseManager({
          default: 'observer',
          connections: {
            observer: {
              ...provisioned.connectionConfig(),
              pool: { min: 1, max: 1 },
            },
          },
        });
        const client = await connection.client<ObservedClient>();
        try {
          report('environment', {
            size,
            dialect: connection.dialect,
            node: process.version,
            platform: platform(),
            arch: arch(),
            cpu: cpus()[0]?.model,
            samples: SAMPLES,
            at: new Date().toISOString(),
          });
          const migrator = database.createMigrator({
            directory: resolve(
              import.meta.dirname,
              '../../database/migrations',
            ),
            packageName: '@nocobase/app-plugin-mail',
          });
          await migrator.upTo('202609260001_add_mail_sync_retry_attempts');
          const seeded = await measured(() => seed(connection, size));
          expect(await count(connection.query, 'mailMessages')).toBe(size);
          const before = await sourceFingerprint(connection.query);
          const participantTable = physicalTable(
            connection,
            'mailMessageParticipants',
          );
          let inserts = 0;
          let insertedRows = 0;
          let maxInsertBindings = 0;
          let readPages = 0;
          let sampledMaxRss = process.memoryUsage().rss;
          let statements = 0;
          const observe = (statement: Statement) => {
            statements++;
            if (statements % 50 === 0)
              sampledMaxRss = Math.max(
                sampledMaxRss,
                process.memoryUsage().rss,
              );
            if (
              /^insert/i.test(statement.sql) &&
              statement.sql.includes(participantTable)
            ) {
              inserts++;
              insertedRows += statement.bindings.length / 5;
              maxInsertBindings = Math.max(
                maxInsertBindings,
                statement.bindings.length,
              );
            }
            if (
              /^select/i.test(statement.sql) &&
              statement.sql.includes(
                physicalTable(connection, 'mailMessages'),
              ) &&
              statement.sql.includes('sender') &&
              !/count\(/i.test(statement.sql)
            ) {
              readPages++;
              expect(statement.sql).toMatch(/limit/i);
              expect(statement.sql).not.toMatch(/offset/i);
            }
          };
          const operations = await observeMigrationOperations(
            connection,
            await diagnostics.connection().client<ObservedClient>(),
            size,
          );
          client.on('query', observe);
          client.on('query', operations.onQuery);
          let migration;
          try {
            migration = await measured(() => migrator.latest());
          } finally {
            client.off('query', observe);
            client.off('query', operations.onQuery);
            await operations.finish();
          }
          expect(migration.value.executed).toEqual([
            '202610090001_mail_create_message_participants',
          ]);
          expect(await countParticipants(connection.query)).toBe(seeded.value);
          expect(insertedRows).toBe(seeded.value);
          expect(maxInsertBindings).toBeLessThanOrEqual(500);
          expect(readPages).toBe(Math.ceil(size / 100) + 1);
          expect(await sourceFingerprint(connection.query)).toEqual(before);
          report('backfill', {
            size,
            seedMs: seeded.ms,
            migrationMs: migration.ms,
            participantRows: seeded.value,
            rowsPerMessage: seeded.value / size,
            insertStatements: inserts,
            maxInsertBindings,
            maxInsertedRowsPerStatement: maxInsertBindings / 5,
            keysetReadPages: readPages,
            sampledMaxRssBytes: sampledMaxRss,
            note: 'RSS sampled every 50 query events, not a proven peak or memory cap. Migration wall time includes DDL, backfill, commit and bookkeeping; batches do not shorten the maintenance window.',
          });
          await storageMetrics(connection, client);
          const store = createDatabaseMailStore(database);
          await benchmarkQueries(store, client, connection, size);
          let runtimeMaxBindings = 0;
          const observeRuntime = (statement: Statement) => {
            if (
              /^insert/i.test(statement.sql) &&
              statement.sql.includes(participantTable)
            )
              runtimeMaxBindings = Math.max(
                runtimeMaxBindings,
                statement.bindings.length,
              );
          };
          client.on('query', observeRuntime);
          try {
            await benchmarkWrites(store, connection, size);
          } finally {
            client.off('query', observeRuntime);
          }
          expect(runtimeMaxBindings).toBeGreaterThan(0);
          expect(runtimeMaxBindings).toBeLessThanOrEqual(500);
          report('runtime-bounds', {
            size,
            maxInsertBindings: runtimeMaxBindings,
            note: 'Runtime write log/lock impact is not sampled; migration operational observations are reported separately.',
          });
        } finally {
          await diagnostics.destroy();
          await fixture.destroy();
          await provisioned.drop();
        }
      },
      600000,
    );
  },
);
