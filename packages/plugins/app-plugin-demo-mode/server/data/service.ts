import type { AppAuthorization } from '@nocobase/app-plugin-authorization';
import type {
  Agents,
  ModelServices,
} from '@nocobase/app-plugin-agents/server/tokens';
import type { UserManagementService } from '@nocobase/app-plugin-users/server/tokens';
import { ApiError } from '@nocobase/app-server/router';
import type { DatabaseManager } from '@nocobase/db';

import type { DemoDataSettings, DemoMode } from '../config.js';
import { DEMO_MODE_ERROR_DOMAIN } from '../errors.js';
import { createDemoClock } from './clock.js';
import type { DemoModels } from './models.js';
import { DemoModelRuntime } from './model-runtime.js';
import type {
  DemoAccountSpec,
  DemoAccountSummary,
  DemoClearContext,
  DemoDataset,
  DemoDataState,
  DemoDataStatus,
  DemoImportContext,
  DemoPermissionSetSpec,
  DemoTrackedRecord,
} from './types.js';

/** Bookkeeping the plugin tracks besides an application's rows; each is undone through its owning plugin. */
const USER = '@user';
const PERMISSION_SET = '@permissionSet';
const ASSIGNMENT = '@permissionSetAssignment';

/** An import or clear no process has moved on for this long was cut off, as when the server stopped mid-import. */
const STALE_MS = 10 * 60 * 1000;

/** Model registration boundary supplied by hosts whose model services live elsewhere. */
export type DemoModelServices = Pick<
  ModelServices,
  'create' | 'update' | 'remove' | 'setDefaultChat'
>;

export interface DemoDataService {
  /** Register from boot, before the environment model is initialized in ready. */
  registerModelServices(services: DemoModelServices): void;
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
  /** Clears what is there and imports again; waits when `wait` is set. */
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
  readonly settings: DemoDataSettings;
  readonly mode: () => DemoMode;
  readonly models: DemoModels;
  /** Where the model gateway reaches the simulated model, such as `http://127.0.0.1:13000/main/api/demoMode/models/v1`. */
  readonly modelBaseUrl: () => string;
  readonly users?: () => UserManagementService | undefined;
  readonly authorization?: () => AppAuthorization | undefined;
  readonly agents?: () => Agents | undefined;
  readonly logger?: {
    info(details: object, message: string): void;
    warn(details: object, message: string): void;
  };
}

interface DatasetRow {
  id: string;
  state: DemoDataState;
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

export function demoDataError(
  reason: string,
  message: string,
  status:
    | 'FAILED_PRECONDITION'
    | 'NOT_FOUND'
    | 'ALREADY_EXISTS'
    | 'INVALID_ARGUMENT' = 'FAILED_PRECONDITION',
): ApiError {
  return new ApiError({
    status,
    reason,
    domain: DEMO_MODE_ERROR_DOMAIN,
    message,
  });
}

export class DefaultDemoDataService implements DemoDataService {
  public readonly models: DemoModels;
  private dataset: DemoDataset | undefined;
  /** The import or clear this process runs, so a second one is refused at once and progress is live. */
  private running: Promise<unknown> | undefined;
  private percent = 0;
  private readonly runtime: DemoModelRuntime;

  public constructor(private readonly deps: DemoDataDependencies) {
    this.models = deps.models;
    this.runtime = new DemoModelRuntime(deps);
  }

  public registerModelServices(services: DemoModelServices): void {
    this.runtime.registerModelServices(services);
  }

  public async whenIdle(): Promise<void> {
    while (this.running) await this.running.catch(() => undefined);
  }

  public register(dataset: DemoDataset): void {
    if (this.dataset && this.dataset.id !== dataset.id)
      throw new Error(
        `A demo dataset is registered already (${this.dataset.id}); an application registers one.`,
      );
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
      importing:
        state === 'importing' || state === 'clearing'
          ? { percent: this.running ? this.percent : (row?.percent ?? 0) }
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
      mode: this.deps.mode(),
      model: {
        enabled:
          this.deps.mode() !== 'off' &&
          this.deps.settings.models &&
          this.runtime.available,
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
    await this.exclusive(async () =>
      this.remove(
        dataset,
        row ?? (await this.claimEmptyClear(dataset, actor, target)),
        actor,
      ),
    );
    return options.wait
      ? this.importNow(actor, target)
      : this.start(actor, target);
  }

  private requireDataset(): DemoDataset {
    if (this.deps.mode() === 'off')
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
  ): Promise<DatasetRow> {
    const now = new Date();
    try {
      await this.deps.database
        .query()
        .insertInto('demoModeDatasets')
        .values({
          id: dataset.id,
          state: 'clearing',
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
    try {
      await this.deps.database
        .query()
        .insertInto('demoModeDatasets')
        .values({
          id: dataset.id,
          state: 'importing',
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
    const populate = () => this.populate(dataset, chosen, actorId, now);
    const job = this.deps.withPolicy
      ? this.deps.withPolicy(populate)
      : populate();
    this.running = job
      .catch(() => undefined)
      .finally(() => {
        this.running = undefined;
      });
    return { job };
  }

  private async populate(
    dataset: DemoDataset,
    language: string,
    actorId: string,
    startedAt: Date,
  ): Promise<void> {
    const steps = dataset.steps(language);
    const total = steps.reduce((sum, step) => sum + (step.weight ?? 1), 0) || 1;
    let done = 0;
    let ordinal = (await this.records(dataset.id)).length;
    let data: Record<string, unknown> = {};
    const reached = async (fraction: number): Promise<void> => {
      this.percent = Math.min(99, Math.floor(fraction * 100));
      await this.touch(dataset.id, { percent: this.percent });
      // The SQLite driver is synchronous: without a turn of the event loop the status requests wait for the import.
      await new Promise<void>((resolve) => setImmediate(resolve));
    };
    const track = async (
      collection: string,
      ids: string | readonly string[],
      keyField = 'id',
    ): Promise<void> => {
      const list = (typeof ids === 'string' ? [ids] : [...ids]).map(String);
      for (const recordId of list)
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
        await this.touch(dataset.id, { data: JSON.stringify(data) });
      },
      track: (collection, ids, options) => track(collection, ids, options?.key),
      createAccount: (spec) => this.createAccount(spec, track),
      createPermissionSet: (spec) => this.createPermissionSet(spec, track),
      assignPermissionSet: async (userId, permissionSet) => {
        const id = await this.assign(userId, permissionSet);
        await track(ASSIGNMENT, id);
      },
      progress: (fraction) =>
        reached(
          (done + Math.max(0, Math.min(1, fraction)) * (step?.weight ?? 1)) /
            total,
        ),
    };
    const heartbeat = setInterval(() => {
      void this.touch(dataset.id, {}).catch((cause: unknown) =>
        this.deps.logger?.warn(
          { dataset: dataset.id, cause: String(cause) },
          'Could not renew demo import progress',
        ),
      );
    }, 30_000);
    heartbeat.unref();
    try {
      for (step of steps) {
        this.deps.logger?.info(
          { dataset: dataset.id, step: step.key },
          'Importing demo data',
        );
        await step.run(context);
        done += step.weight ?? 1;
        await reached(done / total);
      }
      this.percent = 100;
      await this.touch(dataset.id, {
        state: 'ready',
        percent: 100,
        finishedAt: new Date(),
      });
      this.deps.logger?.info(
        { dataset: dataset.id, language },
        'Imported demo data',
      );
    } catch (error) {
      const failure = {
        ...(error instanceof ApiError ? { code: error.reason } : {}),
        message: error instanceof Error ? error.message : String(error),
      };
      this.deps.logger?.warn(
        { dataset: dataset.id, step: step?.key, failure },
        'Demo data import failed; taking back what it wrote',
      );
      const row = await this.row();
      if (row)
        await this.undo(dataset, row, actorId).catch((cause: unknown) =>
          this.deps.logger?.warn(
            { dataset: dataset.id, cause: String(cause) },
            'Could not take back all of a failed demo data import',
          ),
        );
      await this.touch(dataset.id, {
        state: 'failed',
        failure: JSON.stringify(failure),
        finishedAt: new Date(),
      });
      throw error;
    } finally {
      clearInterval(heartbeat);
    }
  }

  /** Clears everything the import created and forgets it. */
  private async remove(
    dataset: DemoDataset,
    row: DatasetRow,
    actorId: string,
  ): Promise<void> {
    const claimed = await this.deps.database
      .query()
      .updateTable('demoModeDatasets')
      .set({ state: 'clearing', percent: 0, updatedAt: new Date() })
      .where('id', '=', dataset.id)
      .where('state', '=', row.state)
      .where('updatedAt', '=', row.updatedAt)
      .execute();
    if (claimed.updatedCount !== 1)
      throw demoDataError(
        'DEMO_DATA_BUSY',
        'Another process changed the demo dataset.',
      );
    this.percent = 0;
    try {
      await this.undo(dataset, row, actorId);
    } catch (cause) {
      await this.touch(dataset.id, {
        state: 'failed',
        failure: JSON.stringify({
          code:
            cause instanceof ApiError ? cause.reason : 'DEMO_DATA_CLEAR_FAILED',
          message:
            'Demo data cleanup did not complete. Retry to finish cleanup.',
        }),
      });
      throw cause;
    }
    await this.deps.database
      .query()
      .deleteFrom('demoModeDatasets')
      .where('id', '=', dataset.id)
      .execute();
    this.deps.logger?.info({ dataset: dataset.id }, 'Cleared demo data');
  }

  private async undo(
    dataset: DemoDataset,
    row: DatasetRow,
    actorId: string,
  ): Promise<void> {
    const records = await this.records(dataset.id);
    const context = this.clearContext(row, records, actorId);
    await dataset.clear(context);
    this.percent = 70;
    const of = (collection: string) =>
      records
        .filter((record) => record.collection === collection)
        .map((record) => record.recordId);
    const sets = this.deps.authorization?.()?.permissionSets;
    for (const id of of(ASSIGNMENT))
      await sets?.revoke(id).catch(() => undefined);
    const users = this.deps.users?.();
    for (const id of of(USER)) {
      if (id === actorId) continue;
      await sets
        ?.replaceSubjectAssignments({
          subject: { type: 'user', id },
          managedPermissionSets: (await sets.list()).map((set) => set.key),
          permissionSets: [],
        })
        .catch(() => undefined);
      if (!users) continue;
      await users.revokeSessions(id).catch(() => undefined);
      // Keep identities reusable: the Users plugin reserves deleted usernames and email addresses.
      await users.disable(id);
    }
    for (const key of of(PERMISSION_SET))
      await sets?.delete(key).catch(() => undefined);
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

  private async createAccount(
    spec: DemoAccountSpec,
    track: (
      collection: string,
      ids: string | readonly string[],
      keyField?: string,
    ) => Promise<void>,
  ): Promise<string> {
    const users = this.deps.users?.();
    if (!users)
      throw demoDataError(
        'DEMO_DATA_ACCOUNTS_UNAVAILABLE',
        'Demo accounts need the users plugin.',
      );
    const password = spec.password ?? `${spec.username}123`;
    const existing = await this.deps.database
      .query()
      .selectFrom('user')
      .select(['id', 'email'])
      .where('username', '=', spec.username)
      .executeTakeFirst<{ id: unknown; email: unknown }>();
    let id: string;
    if (existing) {
      const ownership = await this.deps.database
        .query()
        .selectFrom('demoModeAccounts')
        .select(['userId'])
        .where('userId', '=', String(existing.id))
        .where('datasetId', '=', this.requireDataset().id)
        .executeTakeFirst();
      // A matching username and email do not prove ownership of an existing account.
      if (
        !ownership ||
        String(existing.email).toLowerCase() !== spec.email.toLowerCase()
      )
        throw demoDataError(
          'DEMO_DATA_ACCOUNT_CONFLICT',
          `The username ${spec.username} belongs to another account.`,
          'ALREADY_EXISTS',
        );
      id = String(existing.id);
      await users.update(id, { name: spec.name });
      await users.resetPassword(id, password);
      await users.enable(id);
      // Clearing dropped the account's assignments; its role scopes come back as a new account would get them.
      for (const [scope, value] of Object.entries(spec.roleScopes ?? {}))
        await users.replaceRoleScope(id, scope, value);
    } else {
      id = String(
        (
          await users.create({
            name: spec.name,
            username: spec.username,
            email: spec.email,
            password,
            ...(spec.roleScopes ? { roleScopes: spec.roleScopes } : {}),
          })
        ).id,
      );
      await this.deps.database
        .query()
        .insertInto('demoModeAccounts')
        .values({ userId: id, datasetId: this.requireDataset().id })
        .execute();
    }
    await track(USER, id);
    for (const permissionSet of spec.permissionSets ?? [])
      await track(ASSIGNMENT, await this.assign(id, permissionSet));
    return id;
  }

  private async createPermissionSet(
    spec: DemoPermissionSetSpec,
    track: (
      collection: string,
      ids: string | readonly string[],
      keyField?: string,
    ) => Promise<void>,
  ): Promise<void> {
    const sets = this.permissionSets();
    if (await sets.get(spec.key))
      throw demoDataError(
        'DEMO_DATA_PERMISSION_SET_EXISTS',
        `A Permission Set ${spec.key} exists already.`,
        'ALREADY_EXISTS',
      );
    await sets.create({
      key: spec.key,
      title: spec.title,
      grants: spec.grants as Parameters<typeof sets.create>[0]['grants'],
    });
    await track(PERMISSION_SET, spec.key);
  }

  private async assign(userId: string, permissionSet: string): Promise<string> {
    const sets = this.permissionSets();
    const assignment = await sets.assign({
      subject: { type: 'user', id: userId },
      permissionSet,
    });
    return String(assignment.id);
  }

  private permissionSets(): AppAuthorization['permissionSets'] {
    const sets = this.deps.authorization?.()?.permissionSets;
    if (!sets)
      throw demoDataError(
        'DEMO_DATA_PERMISSIONS_UNAVAILABLE',
        'Demo roles need the authorization plugin.',
      );
    return sets;
  }

  private async touch(
    id: string,
    values: Record<string, unknown>,
  ): Promise<void> {
    await this.deps.database
      .query()
      .updateTable('demoModeDatasets')
      .set({ ...values, updatedAt: new Date() })
      .where('id', '=', id)
      .execute();
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
