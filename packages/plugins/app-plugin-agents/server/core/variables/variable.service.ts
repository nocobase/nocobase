/**
 * Variables: environment variables for a run's agent, every one a secret. A value is sealed at rest
 * (`kernel/secrets.ts`), listed by name only, and opened only for two reasons: a person with the right to change the
 * scope asks to see the values (audited as `reveal`), or a runner claimed a run that gets them (audited as `deliver`).
 *
 * Scopes: an agent, a working directory (`workdir`), or a scope the application registers (`kernel/scopes.ts`). A
 * run's variables are merged in the order its subject names them, then its working directories', then the agent's: a
 * later scope's value replaces an earlier one's. Who may change a scope is the route's concern; the service checks only
 * the values.
 */
import type { EnvVar } from '@nocobase/agent-protocol';
import type { DatabaseConnection, Repository } from '@nocobase/db';

import {
  isReservedVariable,
  VARIABLE_NAME_PATTERN,
  VARIABLE_VALUE_MAX_BYTES,
  type Variable,
  type VariableRef,
  type VariableAudit,
  type VariableAuditAction,
  type VariableScope,
  type VariableValue,
} from '../../../shared/variables.js';
import type { Clock } from '../../kernel/clock.js';
import type { Sealer } from '../../kernel/secrets.js';
import { invalid, notFound } from '../../kernel/errors.js';
import type { IdSource } from '../../kernel/ids.js';
import type { People } from '../../kernel/people.js';
import type { TxRunner } from '../../kernel/tx.js';
import { stringArray } from '../../kernel/values.js';

interface SecretRecord {
  readonly id: string;
  readonly scope: string;
  readonly scopeId: string;
  readonly name: string;
  readonly valueEncrypted: string;
  readonly teamRunnersOnly?: boolean | number | null;
  readonly createdById: string | null;
  readonly updatedById: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

interface AuditRecord {
  readonly id: string;
  readonly scope: string;
  readonly scopeId: string;
  readonly action: string;
  readonly names: readonly unknown[];
  readonly userId: string | null;
  readonly runnerId: string | null;
  readonly runId: string | null;
  readonly jobId: string | null;
  readonly at: string;
}

function secrets(conn: DatabaseConnection): Repository<SecretRecord> {
  return conn.repository<SecretRecord>('agSecrets');
}

function audits(conn: DatabaseConnection): Repository<AuditRecord> {
  return conn.repository<AuditRecord>('agSecretAudits');
}

/** A scope and its id: whose variables. */
export interface VariableTarget {
  readonly scope: VariableScope;
  readonly scopeId: string;
}

export interface VariableService {
  list(target: VariableTarget): Promise<Variable[]>;
  /**
   * Creates or replaces a variable. `value` may be left out to change only `teamRunnersOnly` of one that exists;
   * `teamRunnersOnly` left out keeps what it was (off for a new one).
   */
  set(
    target: VariableTarget,
    name: string,
    value: string | undefined,
    userId: string | null,
    options?: { readonly teamRunnersOnly?: boolean },
  ): Promise<void>;
  remove(
    target: VariableTarget,
    name: string,
    userId: string | null,
  ): Promise<void>;
  /** Every value of the scope, recorded as revealed by `userId`. */
  reveal(target: VariableTarget, userId: string): Promise<VariableValue[]>;
  /** Newest first; `cursor` is the last audit of the previous page. */
  audits(
    target: VariableTarget,
    limit?: number,
    cursor?: { readonly at: string; readonly id: string },
  ): Promise<VariableAudit[]>;
  /** Deletes every variable of a scope (its owner is gone). */
  clear(conn: DatabaseConnection, target: VariableTarget): Promise<void>;
  /** The names set on each target, for a claim to say which variables a run would get. */
  namesOf(
    conn: DatabaseConnection,
    targets: readonly VariableTarget[],
  ): Promise<string[]>;
  /**
   * The variables of `targets`, merged in order as a run gets them, that only team runners may receive: by the scope
   * whose value the run would get.
   */
  teamOnly(
    conn: DatabaseConnection,
    targets: readonly VariableTarget[],
  ): Promise<VariableRef[]>;
  /** Those of `targets` that hold any variable, in order: the scopes a run's variables would come from. */
  holding(
    conn: DatabaseConnection,
    targets: readonly VariableTarget[],
  ): Promise<VariableTarget[]>;
  /**
   * For a claim: the variables of `targets` merged in order (a later target's value replaces an earlier one's),
   * opened, and recorded as delivered for the run.
   */
  forRun(
    conn: DatabaseConnection,
    targets: readonly VariableTarget[],
    delivery: { readonly runId: string; readonly runnerId: string },
  ): Promise<EnvVar[]>;
  /**
   * For a job's claim: the values of the named variables, by `scope`, `scopeId` and `name` joined with NUL, recorded
   * as delivered for the job. A variable that is not set is left out.
   */
  forJob(
    conn: DatabaseConnection,
    refs: readonly (VariableTarget & { readonly name: string })[],
    delivery: { readonly jobId: string; readonly runnerId: string },
  ): Promise<Map<string, string>>;
}

export interface VariableServiceDeps {
  readonly tx: TxRunner;
  readonly ids: IdSource;
  readonly clock: Clock;
  readonly box: Sealer;
  readonly people: People;
  /** The application CLI's command name: the variables its environment prefix names are reserved. */
  readonly cli?: string;
  /** Hears, in the writing transaction, that a variable was added, changed or removed (an agent keeps it in its history). */
  readonly onChange?: (
    conn: DatabaseConnection,
    target: VariableTarget,
    change: {
      readonly name: string;
      readonly change: 'added' | 'changed' | 'removed';
      readonly byUserId: string | null;
    },
  ) => Promise<void>;
}

/** The variables named in a JSON column, such as `agRuns.teamOnlyVariables`; anything else reads as none. */
export function variableRefs(value: unknown): VariableRef[] {
  const parsed: unknown =
    typeof value === 'string'
      ? (() => {
          try {
            return JSON.parse(value) as unknown;
          } catch {
            return null;
          }
        })()
      : value;
  if (!Array.isArray(parsed)) return [];
  return parsed.flatMap((item: unknown): VariableRef[] => {
    if (!item || typeof item !== 'object') return [];
    const { scope, scopeId, name } = item as Record<string, unknown>;
    return typeof scope === 'string' &&
      typeof scopeId === 'string' &&
      typeof name === 'string'
      ? [{ scope, scopeId, name }]
      : [];
  });
}

/** Variables as a person reads them in a wait or a notice: `NPM_TOKEN (agent 42), API_KEY (workdir 7)`. */
export function describeVariables(variables: readonly VariableRef[]): string {
  return variables
    .map((each) => `${each.name} (${each.scope} ${each.scopeId})`)
    .join(', ');
}

/** What a variable's value is bound to: moved to another scope or name, it no longer opens. */
export function variableAad(variable: {
  readonly scope: string;
  readonly scopeId: string;
  readonly name: string;
}): string[] {
  return [variable.scope, variable.scopeId, variable.name];
}

/** Why `name` and `value` cannot be stored, or nothing. */
export function checkVariable(name: string, value: string, cli?: string): void {
  if (!VARIABLE_NAME_PATTERN.test(name))
    throw invalid(
      'A variable name uses upper-case letters, digits and underscores, and does not start with a digit.',
      { reason: 'pattern' },
    );
  if (isReservedVariable(name, cli))
    throw invalid(`${name} is reserved.`, { reason: 'reserved' });
  if (Buffer.byteLength(value, 'utf8') > VARIABLE_VALUE_MAX_BYTES)
    throw invalid('The value is larger than 8 KB.', { reason: 'tooLong' });
}

export function createVariableService(
  deps: VariableServiceDeps,
): VariableService {
  const { tx, ids, clock, box, people, cli } = deps;

  const of = (conn: DatabaseConnection, target: VariableTarget) =>
    secrets(conn).findMany({
      filter: { scope: target.scope, scopeId: target.scopeId },
      sort: (sort) => sort.field('name').asc(),
    });

  const audit = (
    conn: DatabaseConnection,
    target: VariableTarget,
    entry: {
      readonly action: VariableAuditAction;
      readonly names: readonly string[];
      readonly userId?: string | null;
      readonly runId?: string | null;
      readonly jobId?: string | null;
      readonly runnerId?: string | null;
    },
  ) =>
    audits(conn).createOne({
      values: {
        id: ids.next(),
        scope: target.scope,
        scopeId: target.scopeId,
        action: entry.action,
        names: [...entry.names],
        userId: entry.userId ?? null,
        runId: entry.runId ?? null,
        jobId: entry.jobId ?? null,
        runnerId: entry.runnerId ?? null,
        at: clock.now().toISOString(),
      },
    });

  const open = (record: SecretRecord): string =>
    box.open(record.valueEncrypted, variableAad(record));

  return {
    async list(target) {
      const conn = tx.read();
      const records = await of(conn, target);
      const names = await people.names(
        conn,
        records.map((record) => record.updatedById),
      );
      return records.map((record) => ({
        name: record.name,
        teamRunnersOnly: Boolean(record.teamRunnersOnly),
        updatedAt: record.updatedAt,
        updatedById: record.updatedById,
        updatedByName: record.updatedById
          ? (names.get(record.updatedById) ?? null)
          : null,
      }));
    },

    set: (target, name, value, userId, options = {}) =>
      tx.run(async ({ conn }) => {
        const existing = await secrets(conn).findOne({
          filter: { scope: target.scope, scopeId: target.scopeId, name },
        });
        if (value === undefined && !existing)
          throw invalid('A new variable needs a value.', {
            reason: 'valueRequired',
          });
        if (value !== undefined) checkVariable(name, value, cli);
        const sealed =
          value === undefined
            ? undefined
            : box.seal(value, variableAad({ ...target, name }));
        const now = clock.now().toISOString();
        if (existing)
          await secrets(conn).updateMany({
            filter: { id: existing.id },
            values: {
              ...(sealed === undefined ? {} : { valueEncrypted: sealed }),
              ...(options.teamRunnersOnly === undefined
                ? {}
                : { teamRunnersOnly: options.teamRunnersOnly }),
              updatedById: userId,
              updatedAt: now,
            },
          });
        else
          await secrets(conn).createOne({
            values: {
              id: ids.next(),
              scope: target.scope,
              scopeId: target.scopeId,
              name,
              valueEncrypted: sealed!,
              teamRunnersOnly: options.teamRunnersOnly ?? false,
              createdById: userId,
              updatedById: userId,
              createdAt: now,
              updatedAt: now,
            },
          });
        await audit(conn, target, { action: 'set', names: [name], userId });
        await deps.onChange?.(conn, target, {
          name,
          change: existing ? 'changed' : 'added',
          byUserId: userId,
        });
      }),

    remove: (target, name, userId) =>
      tx.run(async ({ conn }) => {
        const existing = await secrets(conn).findOne({
          filter: { scope: target.scope, scopeId: target.scopeId, name },
        });
        if (!existing) throw notFound('Variable');
        await secrets(conn).deleteMany({ filter: { id: existing.id } });
        await audit(conn, target, { action: 'delete', names: [name], userId });
        await deps.onChange?.(conn, target, {
          name,
          change: 'removed',
          byUserId: userId,
        });
      }),

    reveal: (target, userId) =>
      tx.run(async ({ conn }) => {
        const records = await of(conn, target);
        const values = records.map((record) => ({
          name: record.name,
          value: open(record),
        }));
        if (values.length > 0)
          await audit(conn, target, {
            action: 'reveal',
            names: values.map((value) => value.name),
            userId,
          });
        return values;
      }),

    async audits(target, limit = 50, cursor) {
      const conn = tx.read();
      const records = await audits(conn).findMany({
        filter: { scope: target.scope, scopeId: target.scopeId },
        sort: (sort) => [sort.field('at').desc(), sort.field('id').desc()],
        limit,
        ...(cursor ? { cursor } : {}),
      });
      const names = await people.names(
        conn,
        records.map((record) => record.userId),
      );
      return records.map((record) => ({
        id: record.id,
        at: record.at,
        action: record.action as VariableAuditAction,
        names: stringArray(record.names),
        userId: record.userId,
        userName: record.userId ? (names.get(record.userId) ?? null) : null,
        runId: record.runId,
        jobId: record.jobId,
        runnerId: record.runnerId,
      }));
    },

    async clear(conn, target) {
      await secrets(conn).deleteMany({
        filter: { scope: target.scope, scopeId: target.scopeId },
      });
    },

    async namesOf(conn, targets) {
      const names = new Set<string>();
      for (const target of targets)
        for (const record of await of(conn, target)) names.add(record.name);
      return [...names].sort();
    },

    async teamOnly(conn, targets) {
      const merged = new Map<string, VariableRef & { only: boolean }>();
      for (const target of targets)
        for (const record of await of(conn, target))
          merged.set(record.name, {
            scope: target.scope,
            scopeId: target.scopeId,
            name: record.name,
            only: Boolean(record.teamRunnersOnly),
          });
      return [...merged.values()]
        .filter((variable) => variable.only)
        .map(({ only: _only, ...variable }) => variable);
    },

    async holding(conn, targets) {
      const held: VariableTarget[] = [];
      for (const target of targets)
        if (
          (await secrets(conn).count({
            filter: { scope: target.scope, scopeId: target.scopeId },
          })) > 0
        )
          held.push(target);
      return held;
    },

    async forRun(conn, targets, delivery) {
      const merged = new Map<string, string>();
      for (const target of targets) {
        const records = await of(conn, target);
        if (records.length === 0) continue;
        for (const record of records) merged.set(record.name, open(record));
        await audit(conn, target, {
          action: 'deliver',
          names: records.map((record) => record.name),
          runId: delivery.runId,
          runnerId: delivery.runnerId,
        });
      }
      return [...merged].map(([name, value]) => ({ name, value }));
    },

    async forJob(conn, refs, delivery) {
      const values = new Map<string, string>();
      const byTarget = new Map<string, typeof refs>();
      for (const ref of refs) {
        const key = `${ref.scope}\u0000${ref.scopeId}`;
        byTarget.set(key, [...(byTarget.get(key) ?? []), ref]);
      }
      for (const wanted of byTarget.values()) {
        const target = { scope: wanted[0].scope, scopeId: wanted[0].scopeId };
        const names = new Set(wanted.map((ref) => ref.name));
        const records = (await of(conn, target)).filter((record) =>
          names.has(record.name),
        );
        if (records.length === 0) continue;
        for (const record of records)
          values.set(
            `${target.scope}\u0000${target.scopeId}\u0000${record.name}`,
            open(record),
          );
        await audit(conn, target, {
          action: 'deliver',
          names: records.map((record) => record.name),
          jobId: delivery.jobId,
          runnerId: delivery.runnerId,
        });
      }
      return values;
    },
  };
}
