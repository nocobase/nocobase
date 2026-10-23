import {
  DemoIdentities,
  USER,
  PERMISSION_SET,
  ASSIGNMENT,
  carriedKey,
  type Carried,
} from './identities.js';
import { DemoOperationLease } from './lease.js';
import { randomUUID } from 'node:crypto';
import type { AppAuthorization } from '@nocobase/app-plugin-authorization';
import type { DemoAgents } from '../integrations/agents.js';
import type { UserManagementService } from '@nocobase/app-plugin-users/server/tokens';
import { ApiError } from '@nocobase/app-server/router';
import type { DatabaseManager } from '@nocobase/db';

import { demoDataError } from '../errors.js';
import { createDemoClock } from './clock.js';
import type { DemoModels } from './models.js';
import { DemoModelRuntime } from './model-runtime.js';
import type {
  DemoAccountSummary,
  DemoClearContext,
  DemoDataset,
  DemoDataOperation,
  DemoDataState,
  DemoDataStatus,
  DemoImportContext,
  DemoTrackedRecord,
} from '../../shared/data.js';

/** A reset's progress runs through both of its phases: the clear takes the first 30%, generating the rest. */
const overall = (
  operation: DemoDataOperation | null,
  state: DemoDataState,
  percent: number,
): number =>
  operation !== 'reset'
    ? percent
    : state === 'clearing'
      ? Math.floor(percent * 0.3)
      : 30 + Math.floor(percent * 0.7);

/** An import or clear no process has moved on for this long was cut off, as when the server stopped mid-import. */
const STALE_MS = 10 * 60 * 1000;

export interface DemoDataService {
  /** Registers the application's dataset, once, from a service provider's `register()` or `boot()`. */
  register(dataset: DemoDataset): void;
  /** Re-read the environment model binding, without changing it. */
  load(): Promise<void>;
  /** Provision the environment model at application startup, independently of business data. */
  initialize(): Promise<void>;
  status(): Promise<DemoDataStatus>;
  /** Starts an import without waiting for it; `status()` tells how far it got and, when it stopped, why. */
  start(actorId: string, language?: string): Promise<DemoDataStatus>;
  /** Imports and waits, for commands, schedules and tests. */
  importNow(actorId: string, language?: string): Promise<DemoDataStatus>;
  /** Clears application business data and disables demo accounts; environment configuration stays. */
  clear(actorId: string): Promise<DemoDataStatus>;
  /**
   * Clears the business data and imports again, answering once the reset is claimed; waits when `wait` is set. Demo
   * accounts the new import creates again keep their sessions and Permission Sets throughout.
   */
  reset(
    actorId?: string,
    language?: string,
    options?: { readonly wait?: boolean },
  ): Promise<DemoDataStatus>;
  /** Settles when no import or clear runs in this process. */
  whenIdle(): Promise<void>;
  /** The simulated model, for applications that generate text in-process. */
  readonly models: DemoModels;
}

export interface DemoDataDependencies {
  readonly withPolicy?: (run: () => Promise<void>) => Promise<void>;
  readonly database: DatabaseManager;
  readonly enabled: () => boolean;
  readonly models: DemoModels;
  /** Where the model gateway reaches the simulated model, such as `http://127.0.0.1:13000/main/api/demoMode/models/v1`. */
  readonly modelBaseUrl: () => string;
  readonly users?: () => UserManagementService | undefined;
  readonly authorization?: () => AppAuthorization | undefined;
  readonly agents?: () => DemoAgents | undefined;
  /** Called when an import, clear or reset this process ran has finished, whatever its outcome. */
  readonly onSettled?: () => void;
  readonly logger?: {
    info(details: object, message: string): void;
    warn(details: object, message: string): void;
  };
}

interface DatasetRow {
  id: string;
  state: DemoDataState;
  operationId: string | null;
  operation: DemoDataOperation | null;
  language: string | null;
  actorId: string | null;
  percent: number;
  data: Record<string, unknown> | null;
  failure: { code?: string; message: string } | null;
  createdAt: Date;
  updatedAt: Date;
  finishedAt: Date | null;
}

const json = <T>(value: unknown): T | null => {
  if (value == null) return null;
  if (typeof value !== 'string') return value as T;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
};

const iso = (value: unknown): string | null => {
  if (value == null) return null;
  const date =
    value instanceof Date
      ? value
      : typeof value === 'string' || typeof value === 'number'
        ? new Date(value)
        : new Date(Number.NaN);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

export class DefaultDemoDataService implements DemoDataService {
  public readonly models: DemoModels;
  private dataset: DemoDataset | undefined;
  /** The import or clear this process runs, so a second one is refused at once and progress is live. */
  private running: Promise<unknown> | undefined;
  private percent = 0;
  private readonly runtime: DemoModelRuntime;
  private readonly identities: DemoIdentities;
  private readonly lease: DemoOperationLease;

  public constructor(private readonly deps: DemoDataDependencies) {
    this.models = deps.models;
    this.runtime = new DemoModelRuntime(deps);
    this.lease = new DemoOperationLease(deps);
    this.identities = new DemoIdentities(
      deps,
      () => this.requireDataset().id,
      (id, operationId) => this.lease.assertLease(id, operationId),
    );
  }

  public async whenIdle(): Promise<void> {
    while (this.running) await this.running.catch(() => undefined);
  }

  public register(dataset: DemoDataset): void {
    if (this.dataset && this.dataset.id !== dataset.id)
      throw new Error(
        `A demo dataset is registered already (${this.dataset.id}); an application registers one.`,
      );
    if (
      (typeof dataset.generate === 'function') ===
      (typeof dataset.steps === 'function')
    )
      throw new Error('A demo dataset must provide either generate or steps.');
    if (typeof dataset.clear !== 'function')
      throw new Error(
        'A dedicated demo dataset must provide full business cleanup.',
      );
    if (!dataset.languages.length)
      throw new Error(`Demo dataset ${dataset.id} names no language.`);
    this.dataset = dataset;
    this.models.setAnswers(dataset.answers ?? []);
    // An application may register after this plugin is ready; the simulated model's key still has to be known.
    void this.load().catch((cause: unknown) =>
      this.deps.logger?.warn(
        { dataset: dataset.id, cause: String(cause) },
        'Could not read the demo data state',
      ),
    );
  }

  public initialize(): Promise<void> {
    return this.runtime.initialize();
  }

  public load(): Promise<void> {
    return this.runtime.load();
  }

  /** The time zone the dataset writes the given language's demo in. */
  public timeZone(language: string): string {
    return this.dataset?.timeZone?.(language) ?? 'UTC';
  }

  public async status(): Promise<DemoDataStatus> {
    const dataset = this.dataset;
    await this.load();
    const row = dataset ? await this.row() : undefined;
    const stale = row ? this.stale(row) : false;
    const state: DemoDataState | null = row
      ? stale
        ? 'failed'
        : row.state
      : null;
    const records = row ? await this.records(row.id) : [];
    const language = row?.language ?? null;
    const accountsByLanguage = Object.fromEntries(
      (dataset?.languages ?? []).map((candidate) => [
        candidate,
        dataset!.accounts(candidate),
      ]),
    ) as Record<string, readonly DemoAccountSummary[]>;
    const counts =
      row && dataset?.counts && state === 'ready'
        ? await dataset.counts(this.clearContext(row, records))
        : this.countsOf(records);
    return {
      available: Boolean(dataset),
      datasetId: dataset?.id ?? null,
      languages: dataset?.languages ?? [],
      present: state === 'ready',
      state,
      language,
      createdAt: iso(row?.createdAt),
      finishedAt: iso(row?.finishedAt),
      records: records.length,
      counts,
      accounts:
        state === 'ready' &&
        language &&
        records.some((r) => r.collection === USER)
          ? (accountsByLanguage[language] ?? [])
          : [],
      accountsByLanguage,
      operation:
        state === 'importing' || state === 'clearing'
          ? (row?.operation ?? null)
          : null,
      importing:
        state === 'importing' || state === 'clearing'
          ? {
              percent: overall(
                row?.operation ?? null,
                state,
                this.running ? this.percent : (row?.percent ?? 0),
              ),
            }
          : null,
      failure:
        state === 'failed'
          ? (row?.failure ??
            (stale
              ? {
                  code: 'DEMO_DATA_INTERRUPTED',
                  message: 'The last import was interrupted.',
                }
              : null))
          : null,
      enabled: this.deps.enabled(),
      model: {
        enabled: this.deps.enabled() && this.runtime.available,
        service: this.models.serviceName,
      },
    };
  }

  public async start(
    actorId: string,
    language?: string,
  ): Promise<DemoDataStatus> {
    const { job } = await this.claim(actorId, language);
    void job.catch(() => undefined);
    return this.status();
  }

  public async importNow(
    actorId: string,
    language?: string,
  ): Promise<DemoDataStatus> {
    await (
      await this.claim(actorId, language)
    ).job;
    return this.status();
  }

  public async clear(actorId: string): Promise<DemoDataStatus> {
    const dataset = this.requireDataset();
    if (this.running)
      throw demoDataError(
        'DEMO_DATA_BUSY',
        'The demo data is being imported or cleared.',
      );
    const row = await this.row();
    if (
      row &&
      (row.state === 'importing' || row.state === 'clearing') &&
      !this.stale(row)
    )
      throw demoDataError(
        'DEMO_DATA_BUSY',
        'The demo data is being imported or cleared.',
      );
    await this.exclusive(async () =>
      this.remove(
        dataset,
        row ?? (await this.claimEmptyClear(dataset, actorId)),
        actorId,
      ),
    );
    return this.status();
  }

  public async reset(
    actorId?: string,
    language?: string,
    options: { readonly wait?: boolean } = {},
  ): Promise<DemoDataStatus> {
    const dataset = this.requireDataset();
    if (this.running)
      throw demoDataError(
        'DEMO_DATA_BUSY',
        'The demo data is being imported or cleared.',
      );
    const row = await this.row();
    if (
      row &&
      (row.state === 'importing' || row.state === 'clearing') &&
      !this.stale(row)
    )
      throw demoDataError(
        'DEMO_DATA_BUSY',
        'The demo data is being imported or cleared.',
      );
    const actor = actorId ?? row?.actorId ?? undefined;
    if (!actor)
      throw demoDataError(
        'DEMO_DATA_ACTOR_REQUIRED',
        'Nobody imported the demo data yet, so a reset has no account to import it as.',
      );
    const target = language ?? row?.language ?? undefined;
    if (target && !dataset.languages.includes(target))
      throw demoDataError(
        'DEMO_DATA_LANGUAGE',
        `The demo data is not written in ${target}.`,
        'INVALID_ARGUMENT',
      );
    const chosen = target ?? dataset.languages[0];
    this.percent = 0;
    // Claimed before answering, so a second reset is refused; the clear and the import run on in the background.
    const claiming = (async () => {
      const current =
        row ?? (await this.claimEmptyClear(dataset, actor, chosen, 'reset'));
      return {
        current,
        operationId: await this.claimRemoval(dataset, current, 'reset'),
      };
    })();
    const job = claiming.then(({ current, operationId }) =>
      this.replace(dataset, current, actor, chosen, operationId),
    );
    this.running = job
      .catch(() => undefined)
      .finally(() => {
        this.running = undefined;
        this.deps.onSettled?.();
      });
    await claiming;
    if (options.wait) await job;
    return this.status();
  }

  private requireDataset(): DemoDataset {
    if (!this.deps.enabled())
      throw demoDataError(
        'DEMO_MODE_REQUIRED',
        'Enable demo mode before changing demo data.',
      );
    if (!this.dataset)
      throw demoDataError(
        'DEMO_DATA_UNAVAILABLE',
        'This application provides no demo data.',
        'NOT_FOUND',
      );
    return this.dataset;
  }

  /** Persist a lease even before the first import, so competing processes cannot clear and import together. */
  private async claimEmptyClear(
    dataset: DemoDataset,
    actorId: string,
    language?: string,
    operation: DemoDataOperation = 'clear',
  ): Promise<DatasetRow> {
    const now = new Date();
    try {
      await this.deps.database
        .query()
        .insertInto('demoModeDatasets')
        .values({
          id: dataset.id,
          state: 'clearing',
          operation,
          operationId: randomUUID(),
          language: language ?? dataset.languages[0],
          actorId,
          percent: 0,
          data: JSON.stringify({}),
          createdAt: now,
          updatedAt: now,
        })
        .execute();
    } catch {
      throw demoDataError(
        'DEMO_DATA_BUSY',
        'Another demo data operation is running.',
      );
    }
    return (await this.row())!;
  }

  private stale(row: DatasetRow): boolean {
    return (
      (row.state === 'importing' || row.state === 'clearing') &&
      !this.running &&
      Date.now() - new Date(row.updatedAt).getTime() >= STALE_MS
    );
  }

  private async exclusive<T>(work: () => Promise<T>): Promise<T> {
    if (this.running)
      throw demoDataError(
        'DEMO_DATA_BUSY',
        'The demo data is being imported or cleared.',
      );
    const job = work();
    this.running = job;
    try {
      return await job;
    } finally {
      this.running = undefined;
      this.deps.onSettled?.();
    }
  }

  /** Claims the dataset row before anything is written, so a second import beside this one is refused. */
  private async claim(
    actorId: string,
    language?: string,
  ): Promise<{ readonly job: Promise<void> }> {
    const dataset = this.requireDataset();
    const chosen = language ?? dataset.languages[0];
    if (!dataset.languages.includes(chosen))
      throw demoDataError(
        'DEMO_DATA_LANGUAGE',
        `The demo data is not written in ${chosen}.`,
        'INVALID_ARGUMENT',
      );
    if (this.running)
      throw demoDataError(
        'DEMO_DATA_BUSY',
        'The demo data is being imported or cleared.',
      );
    const existing = await this.row();
    if (existing) {
      if (existing.state === 'ready')
        throw demoDataError(
          'DEMO_DATA_EXISTS',
          'Demo data is imported already; clear it first.',
          'ALREADY_EXISTS',
        );
      if (!this.stale(existing) && existing.state !== 'failed')
        throw demoDataError(
          'DEMO_DATA_BUSY',
          'The demo data is being imported or cleared.',
        );
      // What a failed or cut-off import left goes first, so the new one does not write a second dataset.
      await this.exclusive(() => this.remove(dataset, existing, actorId));
    }
    const now = new Date();
    const operationId = randomUUID();
    try {
      await this.deps.database
        .query()
        .insertInto('demoModeDatasets')
        .values({
          id: dataset.id,
          operationId,
          state: 'importing',
          operation: 'import',
          language: chosen,
          actorId,
          percent: 0,
          data: JSON.stringify({}),
          createdAt: now,
          updatedAt: now,
        })
        .execute();
    } catch {
      throw demoDataError(
        'DEMO_DATA_BUSY',
        'The demo data is being imported or cleared.',
      );
    }
    this.percent = 0;
    const job = this.lease.withLease(dataset.id, operationId, () =>
      this.populate(dataset, chosen, actorId, now, operationId),
    );
    this.running = job
      .catch(() => undefined)
      .finally(() => {
        this.running = undefined;
        this.deps.onSettled?.();
      });
    return { job };
  }

  /**
   * A reset after its claim: clears the business data but carries the demo accounts, Permission Sets and assignments
   * into the import, which takes over the same row, so whoever is signed in to a demo account stays signed in.
   */
  private async replace(
    dataset: DemoDataset,
    row: DatasetRow,
    actorId: string,
    language: string,
    clearOperationId: string,
  ): Promise<void> {
    await this.clearClaimed(dataset, row, actorId, clearOperationId, true);
    const carried: Carried = {
      records: new Set(
        (await this.records(dataset.id)).map((record) =>
          carriedKey(record.collection, record.recordId),
        ),
      ),
      touched: new Set(),
    };
    const now = new Date();
    const operationId = randomUUID();
    const handed = await this.deps.database
      .query()
      .updateTable('demoModeDatasets')
      .set({
        state: 'importing',
        operation: 'reset',
        operationId,
        language,
        actorId,
        percent: 0,
        data: JSON.stringify({}),
        failure: null,
        createdAt: now,
        finishedAt: null,
        updatedAt: now,
      })
      .where('id', '=', dataset.id)
      .where('operationId', '=', clearOperationId)
      .execute();
    if (handed.updatedCount !== 1) throw this.lease.leaseLost();
    this.percent = 0;
    await this.lease.withLease(dataset.id, operationId, () =>
      this.populate(dataset, language, actorId, now, operationId, carried),
    );
  }

  /** Every initialization failure settles the claimed row, including policy, step factories and clocks. */
  private async populate(
    dataset: DemoDataset,
    language: string,
    actorId: string,
    startedAt: Date,
    operationId: string,
    carried?: Carried,
  ): Promise<void> {
    try {
      const run = () =>
        this.populateSteps(
          dataset,
          language,
          actorId,
          startedAt,
          operationId,
          carried,
        );
      if (this.deps.withPolicy) await this.deps.withPolicy(run);
      else await run();
    } catch (error) {
      // A replaced operation must neither clean the new owner's data nor overwrite its status.
      await this.lease.assertLease(dataset.id, operationId);
      const failure = {
        ...(error instanceof ApiError ? { code: error.reason } : {}),
        message: error instanceof Error ? error.message : String(error),
      };
      this.deps.logger?.warn(
        { dataset: dataset.id, failure },
        'Demo data import failed; taking back what it wrote',
      );
      const row = await this.row();
      if (row)
        await this.undo(dataset, row, actorId, operationId).catch(
          (cause: unknown) =>
            this.deps.logger?.warn(
              { dataset: dataset.id, cause: String(cause) },
              'Could not take back all of a failed demo data import',
            ),
        );
      await this.lease.touch(dataset.id, operationId, {
        state: 'failed',
        failure: JSON.stringify(failure),
        finishedAt: new Date(),
      });
      throw error;
    }
  }

  private async populateSteps(
    dataset: DemoDataset,
    language: string,
    actorId: string,
    startedAt: Date,
    operationId: string,
    carried?: Carried,
  ): Promise<void> {
    const steps = dataset.generate
      ? [
          {
            key: 'generate',
            run: (context: DemoImportContext) => dataset.generate!(context),
          },
        ]
      : dataset.steps!(language);
    const total = steps.reduce((sum, step) => sum + (step.weight ?? 1), 0) || 1;
    let done = 0;
    // After the records a reset carries, which keep their places.
    let ordinal = (await this.records(dataset.id)).reduce(
      (next, record) => Math.max(next, record.ordinal + 1),
      0,
    );
    let data: Record<string, unknown> = {};
    const reached = async (fraction: number): Promise<void> => {
      this.percent = Math.min(99, Math.floor(fraction * 100));
      await this.lease.touch(dataset.id, operationId, {
        percent: this.percent,
      });
      // The SQLite driver is synchronous: without a turn of the event loop the status requests wait for the import.
      await new Promise<void>((resolve) => setImmediate(resolve));
    };
    const track = async (
      collection: string,
      ids: string | readonly string[],
      keyField = 'id',
    ): Promise<void> => {
      await this.lease.assertLease(dataset.id, operationId);
      const list = (typeof ids === 'string' ? [ids] : [...ids]).map(String);
      for (const recordId of list) {
        await this.lease.assertLease(dataset.id, operationId);
        const key = carriedKey(collection, recordId);
        if (carried?.records.has(key)) {
          carried.touched.add(key);
          continue;
        }
        await this.deps.database
          .query()
          .insertInto('demoModeRecords')
          .values({
            datasetId: dataset.id,
            collection,
            recordId,
            keyField,
            ordinal: ordinal++,
            createdAt: new Date(),
          })
          .execute();
      }
    };
    const clock = createDemoClock(
      startedAt,
      dataset.timeZone?.(language) ?? 'UTC',
      `${dataset.id}:${language}`,
    );
    let step = steps[0];
    const context: DemoImportContext = {
      datasetId: dataset.id,
      language,
      actorId,
      clock,
      get data() {
        return data;
      },
      setData: async (patch) => {
        data = { ...data, ...patch };
        await this.lease.touch(dataset.id, operationId, {
          data: JSON.stringify(data),
        });
      },
      track: (collection, ids, options) => track(collection, ids, options?.key),
      createAccount: async (spec) => {
        await this.lease.assertLease(dataset.id, operationId);
        return this.identities.createAccount(spec, track, carried);
      },
      createPermissionSet: async (spec) => {
        await this.lease.assertLease(dataset.id, operationId);
        await this.identities.createPermissionSet(spec, track, carried);
      },
      assignPermissionSet: async (userId, permissionSet) => {
        await this.lease.assertLease(dataset.id, operationId);
        const id = await this.identities.assign(userId, permissionSet, carried);
        await track(ASSIGNMENT, id);
      },
      progress: (fraction) =>
        reached(
          (done + Math.max(0, Math.min(1, fraction)) * (step?.weight ?? 1)) /
            total,
        ),
    };
    for (step of steps) {
      await this.lease.assertLease(dataset.id, operationId);
      this.deps.logger?.info(
        { dataset: dataset.id, step: step.key },
        'Importing demo data',
      );
      await step.run(context);
      done += step.weight ?? 1;
      await reached(done / total);
    }
    if (carried) {
      // What the cleared import had and this one did not create again goes as a clear would take it.
      const left = (await this.records(dataset.id)).filter(
        (record) =>
          carried.records.has(carriedKey(record.collection, record.recordId)) &&
          !carried.touched.has(carriedKey(record.collection, record.recordId)),
      );
      await this.identities.release(dataset.id, operationId, left);
      for (const record of left)
        await this.deps.database
          .query()
          .deleteFrom('demoModeRecords')
          .where('datasetId', '=', dataset.id)
          .where('collection', '=', record.collection)
          .where('recordId', '=', record.recordId)
          .execute();
    }
    this.percent = 100;
    await this.lease.touch(dataset.id, operationId, {
      state: 'ready',
      percent: 100,
      finishedAt: new Date(),
    });
    this.deps.logger?.info(
      { dataset: dataset.id, language },
      'Imported demo data',
    );
  }

  /** Clears everything the import created and forgets it. */
  private async remove(
    dataset: DemoDataset,
    row: DatasetRow,
    actorId: string,
  ): Promise<void> {
    const operationId = await this.claimRemoval(dataset, row);
    await this.clearClaimed(dataset, row, actorId, operationId);
    const removed = await this.deps.database
      .query()
      .deleteFrom('demoModeDatasets')
      .where('id', '=', dataset.id)
      .where('operationId', '=', operationId)
      .execute();
    if (removed.deletedCount !== 1) throw this.lease.leaseLost();
    this.deps.logger?.info({ dataset: dataset.id }, 'Cleared demo data');
  }

  /** Moves the row to `clearing` under a new operation, unless another process changed it since it was read. */
  private async claimRemoval(
    dataset: DemoDataset,
    row: DatasetRow,
    operation: DemoDataOperation = 'clear',
  ): Promise<string> {
    const operationId = randomUUID();
    const claimed = await this.deps.database
      .query()
      .updateTable('demoModeDatasets')
      .set({
        state: 'clearing',
        operation,
        operationId,
        percent: 0,
        updatedAt: new Date(),
      })
      .where('id', '=', dataset.id)
      .where('state', '=', row.state)
      .where('updatedAt', '=', row.updatedAt)
      .where(
        'operationId',
        row.operationId == null ? 'is' : '=',
        row.operationId ?? null,
      )
      .execute();
    if (claimed.updatedCount !== 1)
      throw demoDataError(
        'DEMO_DATA_BUSY',
        'Another process changed the demo dataset.',
      );
    this.percent = 0;
    return operationId;
  }

  /** Runs the clear an operation claimed; a failure leaves the row `failed`, for a retry. */
  private async clearClaimed(
    dataset: DemoDataset,
    row: DatasetRow,
    actorId: string,
    operationId: string,
    carry = false,
  ): Promise<void> {
    await this.lease.withLease(dataset.id, operationId, async () => {
      try {
        await this.undo(dataset, row, actorId, operationId, carry);
      } catch (cause) {
        await this.lease.touch(dataset.id, operationId, {
          state: 'failed',
          failure: JSON.stringify({
            code:
              cause instanceof ApiError
                ? cause.reason
                : 'DEMO_DATA_CLEAR_FAILED',
            message:
              'Demo data cleanup did not complete. Retry to finish cleanup.',
          }),
        });
        throw cause;
      }
    });
  }

  /**
   * Clears the business data, then the accounts, Permission Sets and assignments the import created and its tracking.
   * With `carry`, those three stay with their tracking for the import a reset runs next.
   */
  private async undo(
    dataset: DemoDataset,
    row: DatasetRow,
    actorId: string,
    operationId: string,
    carry = false,
  ): Promise<void> {
    await this.lease.assertLease(dataset.id, operationId);
    const records = await this.records(dataset.id);
    const reached = async (percent: number): Promise<void> => {
      this.percent = percent;
      await this.lease.touch(dataset.id, operationId, { percent });
      // As for imports: let the status requests through while the SQLite driver works.
      await new Promise<void>((resolve) => setImmediate(resolve));
    };
    const context = this.clearContext(row, records, actorId, (fraction) =>
      reached(Math.min(69, Math.floor(Math.max(0, fraction) * 70))),
    );
    await dataset.clear(context);
    await this.lease.assertLease(dataset.id, operationId);
    await reached(70);
    if (carry) {
      await this.deps.database
        .query()
        .deleteFrom('demoModeRecords')
        .where('datasetId', '=', dataset.id)
        .where('collection', 'not in', [USER, PERMISSION_SET, ASSIGNMENT])
        .execute();
      this.percent = 100;
      return;
    }
    await this.identities.release(dataset.id, operationId, records);
    await this.lease.assertLease(dataset.id, operationId);
    await this.deps.database
      .query()
      .deleteFrom('demoModeRecords')
      .where('datasetId', '=', dataset.id)
      .execute();
    this.percent = 100;
  }

  private clearContext(
    row: DatasetRow,
    records: readonly (DemoTrackedRecord & {
      keyField: string;
      ordinal: number;
    })[],
    actorId?: string,
    progress: (fraction: number) => Promise<void> = async () => {},
  ): DemoClearContext {
    return {
      datasetId: row.id,
      language: row.language,
      actorId: actorId ?? row.actorId ?? '',
      data: row.data ?? {},
      records: records.map(({ collection, recordId }) => ({
        collection,
        recordId,
      })),
      progress,
    };
  }

  private countsOf(
    records: readonly DemoTrackedRecord[],
  ): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const record of records) {
      const name = record.collection === USER ? 'accounts' : record.collection;
      if (name.startsWith('@')) continue;
      counts[name] = (counts[name] ?? 0) + 1;
    }
    return counts;
  }

  private async row(): Promise<DatasetRow | undefined> {
    if (!this.dataset) return undefined;
    const row = await this.deps.database
      .query()
      .selectFrom('demoModeDatasets')
      .selectAll()
      .where('id', '=', this.dataset.id)
      .executeTakeFirst<Record<string, unknown>>();
    if (!row) return undefined;
    return {
      ...(row as unknown as DatasetRow),
      percent: Number(row.percent ?? 0),
      data: json<Record<string, unknown>>(row.data),
      failure: json<{ code?: string; message: string }>(row.failure),
    };
  }

  private async records(
    datasetId: string,
  ): Promise<(DemoTrackedRecord & { keyField: string; ordinal: number })[]> {
    const rows = await this.deps.database
      .query()
      .selectFrom('demoModeRecords')
      .select(['collection', 'recordId', 'keyField', 'ordinal'])
      .where('datasetId', '=', datasetId)
      .orderBy('ordinal', 'asc')
      .execute<{
        collection: string;
        recordId: string;
        keyField: string;
        ordinal: unknown;
      }>();
    return rows.map((row) => ({
      collection: String(row.collection),
      recordId: String(row.recordId),
      keyField: String(row.keyField),
      ordinal: Number(row.ordinal),
    }));
  }
}
