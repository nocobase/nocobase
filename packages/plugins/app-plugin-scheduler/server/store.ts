import { createHash } from 'node:crypto';

import type {
  DatabaseConnection,
  DatabaseManager,
  QueryAdapter,
  Row,
} from '@nocobase/db';
import type {
  ScheduleEvent,
  ScheduleExecutor,
  ScheduleJob,
} from '@nocobase/jobs';

import type { ScheduleJobSpec } from './dispatch.js';
import type { ScheduleOccurrenceStatus } from './occurrences.js';
import type {
  JsonObject,
  NormalizedScheduleDefinition,
} from './schedules/define.js';

export interface ScheduleManifestEntry {
  readonly definition: NormalizedScheduleDefinition;
}

export interface ScheduleRecord {
  readonly id: string;
  readonly appName: string;
  readonly key: string;
  readonly title: string;
  readonly description?: string;
  readonly cron: string;
  readonly timezone: string;
  readonly enabled: boolean;
  readonly targetType: string;
  readonly lifecycleState: 'active' | 'inactive';
  readonly inactiveReason?: string;
  readonly definitionHash: string;
  readonly runCount: number;
  readonly completedCount: number;
  readonly nextRunAt?: string;
  readonly lastRunAt?: string;
  readonly scheduleStatus: 'active' | 'paused';
}

export interface ScheduleTargetProjection {
  readonly id: string;
  readonly type: string;
  readonly config: JsonObject;
}

export interface ScheduleOccurrenceRecord {
  readonly id: string;
  readonly scheduleId: string;
  readonly status: ScheduleOccurrenceStatus;
  readonly reason?: string;
  readonly executionCount: number;
  readonly startedAt: string;
  readonly acceptedAt?: string;
  readonly finishedAt?: string;
  readonly targetReceipt?: JsonObject;
  readonly resultSummary?: JsonObject;
  readonly target: {
    readonly type: string;
    readonly reference?: { readonly type: string; readonly id: string };
  };
}

interface DefinitionRow extends Row {
  id: string;
  appName: string;
  key: string;
  sourceType: string;
  title: string;
  description?: string | null;
  definitionHash: string;
  cron: string;
  timezone: string;
  fromDate?: Date | string | number | null;
  toDate?: Date | string | number | null;
  runLimit?: number | null;
  enabled: boolean | number;
  targetType: string;
  targetConfig: string | Record<string, unknown>;
  lifecycleState: 'active' | 'inactive';
  inactiveReason?: string | null;
  deactivatedAt?: Date | string | null;
  syncStatus: string;
  syncError?: string | null;
  lastSeenManifest?: string | null;
  nextRunAt?: Date | string | number | null;
  lastRunAt?: Date | string | number | null;
  runCount: number;
  appliedLimit?: number | null;
  lastOccurrenceId?: string | null;
  createdAt: Date | string | number;
  updatedAt: Date | string | number;
}

interface ScheduleMaterialization {
  readonly spec: ScheduleJobSpec;
  readonly limit?: number;
  /** The rule has to be written again: it is new, reactivated, or its definition changed. */
  readonly rewrite: boolean;
  readonly enabled: boolean;
  readonly runCount: number;
  readonly appliedLimit: number | null;
}

/** Builds the executor job of one schedule, given what remains of its limit. */
export type ScheduleJobFactory = (
  spec: ScheduleJobSpec,
  limit: number | undefined,
) => ScheduleJob;

/** How many times the conditional run count update retries a concurrent change. */
const RUN_COUNT_ATTEMPTS = 5;

/**
 * Keeps the schedule definitions and hands their rules to the executor.
 *
 * Every definition in the manifest gets its handler registered, including
 * disabled and exhausted ones, so whichever instance a firing reaches can run
 * it. Only enabled definitions with firings left get a rule. Before the
 * executor is set up, rules are only registered — it writes them in setup() —
 * so removals and the planned times they return wait for {@link activate}.
 */
export class ScheduleStore {
  private active = false;
  private readonly awaitingPlan = new Set<string>();
  private readonly awaitingRemoval = new Set<string>();
  private readonly awaitingStaleRemoval = new Set<string>();

  public constructor(
    private readonly database: DatabaseManager,
    private readonly appName: string,
    private readonly executor: ScheduleExecutor,
    private readonly createJob: ScheduleJobFactory,
    private readonly now: () => Date = () => new Date(),
  ) {}

  public async reconcile(
    manifest: readonly ScheduleManifestEntry[],
    finalize: boolean = false,
  ): Promise<void> {
    const plan = await this.database.transaction(async (connection) => {
      await this.lockManifestOwners(connection);
      const seen = new Set<string>();
      const materializations: ScheduleMaterialization[] = [];
      for (const entry of manifest) {
        const id = scheduleId(this.appName, entry.definition.key);
        seen.add(id);
        materializations.push(
          await this.upsertDefinition(connection.query, id, entry),
        );
      }
      const deactivate = finalize
        ? await this.findMissing(connection.query, seen)
        : [];
      const inactive = await this.findInactive(connection.query, seen);
      return { materializations, deactivate, inactive };
    });
    for (const materialization of plan.materializations) {
      const id = materialization.spec.id;
      try {
        await this.materialize(materialization);
        if (this.active) await this.recordSyncResult(id, 'synced');
        else this.awaitingPlan.add(id);
      } catch (error) {
        await this.recordSyncResult(
          id,
          'failed',
          error instanceof Error ? error.message : String(error),
        );
        throw error;
      }
    }
    for (const id of plan.deactivate) {
      await this.deactivate(id);
      await this.removeRule(id);
    }
    // A removal can be lost — the memory adapter overwrites its state file
    // with what a running process holds — so every sync removes again the
    // rules of definitions already deactivated.
    for (const id of plan.inactive) await this.removeStaleRule(id);
  }

  /**
   * Runs what had to wait for the executor's setup(): removing rules, and
   * recording the planned time of every rule setup() wrote.
   */
  public async activate(): Promise<void> {
    this.active = true;
    for (const id of [...this.awaitingRemoval]) {
      this.awaitingRemoval.delete(id);
      await this.executor.removeJob(id);
    }
    for (const id of [...this.awaitingStaleRemoval]) {
      this.awaitingStaleRemoval.delete(id);
      await this.removeRuleIfOff(id);
    }
    for (const id of [...this.awaitingPlan]) {
      this.awaitingPlan.delete(id);
      const rule = await this.executor.getJob(id);
      await this.updateDefinition(id, { nextRunAt: rule?.nextRunAt ?? null });
      await this.recordSyncResult(id, 'synced');
    }
  }

  /**
   * Records a firing this instance ran. A start counts once per occurrence:
   * the conditional update matches only while `lastOccurrenceId` is another
   * occurrence, so a redelivered start is ignored. The query builder has no
   * arithmetic, so the increment is a compare-and-set on the count it read.
   */
  public async recordEvent(event: ScheduleEvent): Promise<void> {
    const nextRunAt = event.nextRunAt ?? null;
    if (event.name !== 'ScheduleStart') {
      await this.updateDefinition(event.jobName, { nextRunAt });
      return;
    }
    for (let attempt = 0; attempt < RUN_COUNT_ATTEMPTS; attempt += 1) {
      const row = await this.database
        .query()
        .selectFrom<DefinitionRow>('schedule_definitions')
        .select(['runCount', 'lastOccurrenceId'])
        .where('id', '=', event.jobName)
        .where('appName', '=', this.appName)
        .executeTakeFirst<
          Pick<DefinitionRow, 'runCount' | 'lastOccurrenceId'>
        >();
      if (!row || row.lastOccurrenceId === event.jobId) return;
      const runCount = Number(row.runCount ?? 0);
      const updated = await this.database
        .query()
        .updateTable<DefinitionRow>('schedule_definitions')
        .set({
          runCount: runCount + 1,
          lastRunAt: event.runAt,
          nextRunAt,
          lastOccurrenceId: event.jobId,
          updatedAt: this.now(),
        })
        .where('id', '=', event.jobName)
        .where('appName', '=', this.appName)
        .where('runCount', '=', runCount)
        .where((eb) =>
          eb.or([
            eb('lastOccurrenceId', 'is', null),
            eb('lastOccurrenceId', '<>', event.jobId),
          ]),
        )
        .execute();
      if ((updated.updatedCount ?? 0) > 0) return;
    }
    throw new Error(
      `Could not record the start of occurrence ${event.jobId}: its schedule kept changing.`,
    );
  }

  public async list(): Promise<readonly ScheduleRecord[]> {
    const definitions = await this.database
      .query()
      .selectFrom<DefinitionRow>('schedule_definitions')
      .selectAll()
      .where('appName', '=', this.appName)
      .orderBy('title', 'asc')
      .execute<DefinitionRow>();
    const completedByScheduleId = await this.countCompleted(
      definitions.map((definition) => definition.id),
    );
    return definitions.map((definition) => {
      const enabled = Boolean(definition.enabled);
      return {
        id: definition.id,
        appName: definition.appName,
        key: definition.key,
        title: definition.title,
        ...(definition.description
          ? { description: definition.description }
          : {}),
        cron: definition.cron,
        timezone: definition.timezone,
        enabled,
        targetType: definition.targetType,
        lifecycleState: definition.lifecycleState,
        ...(definition.inactiveReason
          ? { inactiveReason: definition.inactiveReason }
          : {}),
        definitionHash: definition.definitionHash,
        runCount: Number(definition.runCount ?? 0),
        completedCount: completedByScheduleId.get(definition.id) ?? 0,
        ...(definition.nextRunAt
          ? { nextRunAt: dateValue(definition.nextRunAt) }
          : {}),
        ...(definition.lastRunAt
          ? { lastRunAt: dateValue(definition.lastRunAt) }
          : {}),
        scheduleStatus:
          enabled && definition.lifecycleState === 'active'
            ? 'active'
            : 'paused',
      };
    });
  }

  public async setEnabled(id: string, enabled: boolean): Promise<void> {
    const definition = await this.database
      .query()
      .selectFrom<DefinitionRow>('schedule_definitions')
      .selectAll()
      .where('id', '=', id)
      .where('appName', '=', this.appName)
      .executeTakeFirst<DefinitionRow>();
    if (!definition) throw new Error('Schedule not found.');
    if (!enabled) {
      // The handler stays registered, so another instance that enables the
      // schedule again finds this instance able to run it.
      await this.executor.removeJob(id);
      await this.updateDefinition(id, { enabled: false, nextRunAt: null });
      return;
    }
    const spec = specOfRow(definition);
    const limit = nullableNumber(definition.runLimit);
    // Re-adding a rule restarts BullMQ's count, so it carries what is left.
    const appliedLimit =
      limit === null ? null : limit - Number(definition.runCount ?? 0);
    const nextRunAt =
      definition.lifecycleState === 'active'
        ? await this.applyRule(spec, appliedLimit, true)
        : null;
    await this.updateDefinition(id, { enabled: true, appliedLimit, nextRunAt });
  }

  /**
   * Counts occurrences that reached the `succeeded` terminal state, per schedule.
   * Only successful outcomes count as completed: `failed`, `timed_out`,
   * `cancelled`, `triggered` (result unknown) and `skipped` (never executed) are
   * deliberately excluded. The result is keyed by schedule id for the schedules
   * passed in, so occurrences orphaned from an app's definitions never appear.
   */
  private async countCompleted(
    scheduleIds: readonly string[],
  ): Promise<Map<string, number>> {
    const completed = new Map<string, number>();
    if (scheduleIds.length === 0) return completed;
    const rows = await this.database
      .query()
      .selectFrom('schedule_occurrences')
      .select(({ fn }) => ['scheduleId', fn.countAll().as('completedCount')])
      .where('scheduleId', 'in', [...scheduleIds])
      .where('status', '=', 'succeeded')
      .groupBy('scheduleId')
      .execute<Row>();
    for (const row of rows) {
      completed.set(String(row.scheduleId), Number(row.completedCount ?? 0));
    }
    return completed;
  }

  public async listTargets(): Promise<readonly ScheduleTargetProjection[]> {
    const rows = await this.database
      .query()
      .selectFrom<DefinitionRow>('schedule_definitions')
      .selectAll()
      .where('appName', '=', this.appName)
      .execute<DefinitionRow>();
    return rows.map((row) => ({
      id: row.id,
      type: row.targetType,
      config: jsonObject(row.targetConfig),
    }));
  }

  public async listOccurrences(
    scheduleId: string,
  ): Promise<readonly ScheduleOccurrenceRecord[]> {
    const owned = await this.database
      .query()
      .selectFrom<DefinitionRow>('schedule_definitions')
      .select('id')
      .where('id', '=', scheduleId)
      .where('appName', '=', this.appName)
      .exists();
    if (!owned) return [];
    const rows = await this.database
      .query()
      .selectFrom('schedule_occurrences')
      .selectAll()
      .where('scheduleId', '=', scheduleId)
      .orderBy('startedAt', 'desc')
      .limit(100)
      .execute();
    return rows.map((row) => ({
      id: String(row.id),
      scheduleId: String(row.scheduleId),
      status: row.status as ScheduleOccurrenceStatus,
      ...(typeof row.reason === 'string' ? { reason: row.reason } : {}),
      executionCount: Number(row.executionCount),
      startedAt: dateValue(row.startedAt as Date | string) ?? '',
      ...(row.acceptedAt
        ? { acceptedAt: dateValue(row.acceptedAt as Date | string) }
        : {}),
      ...(row.finishedAt
        ? { finishedAt: dateValue(row.finishedAt as Date | string) }
        : {}),
      ...(row.targetReceipt
        ? {
            targetReceipt: jsonObject(
              row.targetReceipt as string | Record<string, unknown>,
            ),
          }
        : {}),
      ...(row.resultSummary
        ? {
            resultSummary: jsonObject(
              row.resultSummary as string | Record<string, unknown>,
            ),
          }
        : {}),
      target: {
        type: String(row.targetType),
        ...(typeof row.targetReferenceType === 'string' &&
        typeof row.targetReferenceId === 'string'
          ? {
              reference: {
                type: row.targetReferenceType,
                id: row.targetReferenceId,
              },
            }
          : {}),
      },
    }));
  }

  private async upsertDefinition(
    query: QueryAdapter,
    id: string,
    entry: ScheduleManifestEntry,
  ): Promise<ScheduleMaterialization> {
    const existing = await query
      .selectFrom<DefinitionRow>('schedule_definitions')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst<DefinitionRow>();
    const now = this.now();
    const definition = entry.definition;
    const spec = specOfDefinition(definition, id);
    if (!existing) {
      await query
        .insertInto<DefinitionRow>('schedule_definitions')
        .values({
          id,
          appName: this.appName,
          key: definition.key,
          sourceType: 'code',
          title: definition.title,
          description: definition.description ?? null,
          definitionHash: definition.definitionHash,
          cron: definition.schedule.cron,
          timezone: definition.schedule.timezone,
          fromDate: definition.schedule.from ?? null,
          toDate: definition.schedule.to ?? null,
          runLimit: definition.schedule.limit ?? null,
          enabled: true,
          targetType: definition.target.type,
          targetConfig: JSON.stringify(definition.target.config),
          lifecycleState: 'active',
          inactiveReason: null,
          deactivatedAt: null,
          syncStatus: 'pending',
          syncError: null,
          lastSeenManifest: definition.definitionHash,
          nextRunAt: null,
          lastRunAt: null,
          runCount: 0,
          appliedLimit: null,
          lastOccurrenceId: null,
          createdAt: now,
          updatedAt: now,
        })
        .execute();
      return {
        spec,
        ...limitOf(definition),
        rewrite: true,
        enabled: true,
        runCount: 0,
        appliedLimit: null,
      };
    }
    // The stored rule carries the definition hash, so any change to the
    // definition changes the rule and restarts BullMQ's limit count: the
    // applied limit is recomputed whenever that happens.
    const rewrite =
      existing.lifecycleState === 'inactive' ||
      existing.definitionHash !== definition.definitionHash;
    await query
      .updateTable<DefinitionRow>('schedule_definitions')
      .set({
        title: definition.title,
        description: definition.description ?? null,
        definitionHash: definition.definitionHash,
        cron: definition.schedule.cron,
        timezone: definition.schedule.timezone,
        fromDate: definition.schedule.from ?? null,
        toDate: definition.schedule.to ?? null,
        runLimit: definition.schedule.limit ?? null,
        targetType: definition.target.type,
        targetConfig: JSON.stringify(definition.target.config),
        lifecycleState: 'active',
        inactiveReason: null,
        deactivatedAt: null,
        syncStatus: 'pending',
        syncError: null,
        lastSeenManifest: definition.definitionHash,
        updatedAt: now,
      })
      .where('id', '=', id)
      .execute();
    return {
      spec,
      ...limitOf(definition),
      rewrite,
      enabled: Boolean(existing.enabled),
      runCount: Number(existing.runCount ?? 0),
      appliedLimit: nullableNumber(existing.appliedLimit),
    };
  }

  private async materialize(plan: ScheduleMaterialization): Promise<void> {
    const { spec, limit, rewrite, enabled, runCount } = plan;
    // Without a rewrite the stored applied limit is passed again, so the rule
    // compares as unchanged and the executor leaves it alone.
    const appliedLimit =
      limit === undefined
        ? null
        : rewrite || plan.appliedLimit === null
          ? limit - runCount
          : plan.appliedLimit;
    if (appliedLimit !== plan.appliedLimit) {
      await this.updateDefinition(spec.id, { appliedLimit });
    }
    if (!enabled) {
      await this.executor.addJob(
        this.createJob(spec, positive(appliedLimit)),
        true,
      );
      // Disabling removed the rule; remove it again in case that was lost.
      await this.removeStaleRule(spec.id);
      return;
    }
    const nextRunAt = await this.applyRule(spec, appliedLimit, rewrite);
    if (this.active) await this.updateDefinition(spec.id, { nextRunAt });
  }

  /**
   * Adds the rule of an enabled schedule and returns its planned firing. A
   * schedule whose limit is spent only registers its handler, and a rule it
   * still had is removed.
   */
  private async applyRule(
    spec: ScheduleJobSpec,
    appliedLimit: number | null,
    rewrite: boolean,
  ): Promise<Date | null> {
    const job = this.createJob(spec, positive(appliedLimit));
    if (appliedLimit !== null && appliedLimit <= 0) {
      await this.executor.addJob(job, true);
      if (rewrite) await this.removeRule(spec.id);
      return null;
    }
    const receipt = await this.executor.addJob(job);
    return receipt.scheduledAt ?? null;
  }

  private async removeRule(id: string): Promise<void> {
    if (this.active) await this.executor.removeJob(id);
    else this.awaitingRemoval.add(id);
  }

  /** Removes a rule the definition should no longer have, once the executor is set up. */
  private async removeStaleRule(id: string): Promise<void> {
    if (this.active) await this.removeRuleIfOff(id);
    else this.awaitingStaleRemoval.add(id);
  }

  /**
   * Reads the definition again first: another instance may have enabled it
   * after this sync read it as disabled, and written the rule since.
   */
  private async removeRuleIfOff(id: string): Promise<void> {
    const row = await this.database
      .query()
      .selectFrom<DefinitionRow>('schedule_definitions')
      .select(['enabled', 'lifecycleState'])
      .where('id', '=', id)
      .where('appName', '=', this.appName)
      .executeTakeFirst<Pick<DefinitionRow, 'enabled' | 'lifecycleState'>>();
    if (row && Boolean(row.enabled) && row.lifecycleState === 'active') return;
    await this.executor.removeJob(id);
  }

  private async updateDefinition(
    id: string,
    values: Partial<DefinitionRow>,
  ): Promise<void> {
    await this.database
      .query()
      .updateTable<DefinitionRow>('schedule_definitions')
      .set({ ...values, updatedAt: this.now() })
      .where('id', '=', id)
      .where('appName', '=', this.appName)
      .execute();
  }

  private async findMissing(
    query: QueryAdapter,
    seen: ReadonlySet<string>,
  ): Promise<string[]> {
    const rows = await query
      .selectFrom<DefinitionRow>('schedule_definitions')
      .selectAll()
      .where('appName', '=', this.appName)
      .where('sourceType', '=', 'code')
      .where('lifecycleState', '=', 'active')
      .execute<DefinitionRow>();
    return rows.filter((row) => !seen.has(row.id)).map((row) => row.id);
  }

  /** Definitions `--finalize` already deactivated, other than those the manifest brings back. */
  private async findInactive(
    query: QueryAdapter,
    seen: ReadonlySet<string>,
  ): Promise<string[]> {
    const rows = await query
      .selectFrom<DefinitionRow>('schedule_definitions')
      .select('id')
      .where('appName', '=', this.appName)
      .where('lifecycleState', '=', 'inactive')
      .execute<Pick<DefinitionRow, 'id'>>();
    return rows.map((row) => row.id).filter((id) => !seen.has(id));
  }

  private async deactivate(id: string): Promise<void> {
    const now = this.now();
    await this.database
      .query()
      .updateTable<DefinitionRow>('schedule_definitions')
      .set({
        lifecycleState: 'inactive',
        inactiveReason: 'definition_removed',
        deactivatedAt: now,
        nextRunAt: null,
        updatedAt: now,
      })
      .where('id', '=', id)
      .where('appName', '=', this.appName)
      .execute();
  }

  private async recordSyncResult(
    id: string,
    status: 'synced' | 'failed',
    error?: string,
  ): Promise<void> {
    await this.database
      .query()
      .updateTable<DefinitionRow>('schedule_definitions')
      .set({
        syncStatus: status,
        syncError: error ?? null,
        updatedAt: this.now(),
      })
      .where('id', '=', id)
      .where('appName', '=', this.appName)
      .execute();
  }

  private async lockManifestOwners(
    connection: DatabaseConnection,
  ): Promise<void> {
    const now = this.now();
    // Repository upserts lock existing rows and recover concurrent inserts in a
    // savepoint across dialects. The lock is held by the reconciliation transaction.
    await connection.repository('scheduleSyncLocks').upsertOne({
      filter: { appName: this.appName },
      create: { appName: this.appName, createdAt: now, updatedAt: now },
      update: { updatedAt: now },
    });
  }
}

export function scheduleId(appName: string, key: string): string {
  return createHash('sha256').update(`${appName}\0${key}`).digest('hex');
}

function dateValue(
  value: Date | string | number | null | undefined,
): string | undefined {
  if (!value) return undefined;
  const normalized =
    typeof value === 'string' && /^\d+(?:\.0+)?$/u.test(value)
      ? Number(value)
      : value;
  return new Date(normalized).toISOString();
}

function jsonObject(value: string | Record<string, unknown>): JsonObject {
  return typeof value === 'string'
    ? (JSON.parse(value) as JsonObject)
    : (value as JsonObject);
}

function specOfDefinition(
  definition: NormalizedScheduleDefinition,
  id: string,
): ScheduleJobSpec {
  return {
    id,
    cron: definition.schedule.cron,
    timezone: definition.schedule.timezone,
    ...(definition.schedule.from ? { from: definition.schedule.from } : {}),
    ...(definition.schedule.to ? { to: definition.schedule.to } : {}),
    target: definition.target,
    definitionHash: definition.definitionHash,
  };
}

/** The same spec as the definition gave, rebuilt from the row it was stored in. */
function specOfRow(row: DefinitionRow): ScheduleJobSpec {
  const from = dateValue(row.fromDate);
  const to = dateValue(row.toDate);
  return {
    id: row.id,
    cron: row.cron,
    timezone: row.timezone,
    ...(from ? { from: new Date(from) } : {}),
    ...(to ? { to: new Date(to) } : {}),
    target: { type: row.targetType, config: jsonObject(row.targetConfig) },
    definitionHash: row.definitionHash,
  };
}

function limitOf(definition: NormalizedScheduleDefinition): { limit?: number } {
  return definition.schedule.limit !== undefined
    ? { limit: definition.schedule.limit }
    : {};
}

function nullableNumber(
  value: number | string | null | undefined,
): number | null {
  return value === null || value === undefined ? null : Number(value);
}

/** The limit handed to the executor, which only accepts a positive one. */
function positive(appliedLimit: number | null): number | undefined {
  return appliedLimit === null ? undefined : Math.max(appliedLimit, 1);
}
