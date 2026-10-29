import { DailyResetClaims, type DailyClaim } from './daily-reset.js';
import type { DemoConfigurationRuntime } from './contract.js';
import {
  DefaultDemoAgentProxy,
  type DemoAgentAdapter,
  type DemoAgentProxy,
} from './agent-proxy.js';
import { AsyncLocalStorage } from 'node:async_hooks';
import type { DatabaseManager } from '@nocobase/db';
import { DEFAULT_ALLOW_COLLECTIONS, type DemoModeSettings } from '../config.js';
import type { DemoWriteGuard, DemoSqlRule } from '../guard.js';
import { demoDataError } from '../errors.js';
import { ConfigurationInput } from './schemas.js';
import {
  firstWallMinute,
  localMinute,
  nextDailyRun,
} from '../../shared/schedule.js';
import type {
  DemoConfiguration,
  DemoConfigurationView,
  DemoDailySchedule,
  DemoMockAdapter,
} from '../../shared/configuration.js';

const invalid = (message: string) =>
  demoDataError('DEMO_CONFIGURATION_INVALID', message, 'INVALID_ARGUMENT');
interface Stored {
  revision: number;
  value: unknown;
  lastDay: string | null;
}

/**
 * How long a process reuses the policy it read. A save in this process takes effect at once; one made by another
 * instance reaches this process within this time.
 */
const POLICY_TTL_MS = 5_000;

/** Policy is shared through the database and cached briefly per process, so requests do not each read it. */
export class DefaultDemoConfigurationService implements DemoConfigurationRuntime {
  private readonly policy = new AsyncLocalStorage<DemoConfiguration>();
  private cached:
    { readonly value: DemoConfiguration; readonly expires: number } | undefined;
  public async runWithPolicy<T>(run: () => Promise<T>): Promise<T> {
    if (!this.enabled || this.policy.getStore()) return run();
    return this.policy.run(await this.readPolicy(), run);
  }
  private async currentPolicy(): Promise<DemoConfiguration> {
    return this.policy.getStore() ?? this.readPolicy();
  }
  private readonly adapters = new Map<string, DemoMockAdapter>();
  private readonly resolved = new Map<
    string,
    { connection: string; table: string } | null
  >();
  public constructor(
    private readonly database: DatabaseManager,
    private readonly settings: DemoModeSettings,
    private readonly guard: DemoWriteGuard,
    private readonly data: () => Promise<{
      importing: unknown;
    }>,
  ) {}
  public get enabled(): boolean {
    return this.settings.enabled;
  }
  public requireEnabled(): void {
    if (!this.enabled)
      throw demoDataError(
        'DEMO_MODE_REQUIRED',
        'Demo management is unavailable in this deployment.',
        'NOT_FOUND',
      );
  }
  public registerMock(adapter: DemoMockAdapter): void {
    if (this.adapters.has(adapter.id))
      throw new Error(`Duplicate demo mock: ${adapter.id}`);
    this.adapters.set(adapter.id, adapter);
    this.cached = undefined;
  }
  public registerAgent<Input, Output>(
    adapter: DemoAgentAdapter<Input, Output>,
  ): DemoAgentProxy<Input, Output> {
    return new DefaultDemoAgentProxy(this, adapter);
  }
  /** Async workers must not inherit the originating HTTP request's stale policy snapshot. */
  public withFreshPolicy<T>(run: () => Promise<T>): Promise<T> {
    this.cached = undefined;
    return this.policy.exit(() => this.runWithPolicy(run));
  }
  public async initialize(): Promise<void> {
    if (!this.enabled) return;
    for (const name of this.settings.allowCollections) {
      if (
        !DEFAULT_ALLOW_COLLECTIONS.includes(name) &&
        !(await this.resolveCollection(name))
      )
        throw invalid(
          `Unknown demoMode.allowCollections collection in the default database: ${name}`,
        );
    }
    if (await this.row()) return;
    try {
      await this.database
        .query()
        .insertInto('demoModeConfiguration')
        .values({
          id: 'default',
          revision: 0,
          value: JSON.stringify({ collections: [], mocks: {} }),
        })
        .execute();
    } catch (error) {
      if (!(await this.row())) throw error;
    }
  }
  private async row(): Promise<Stored | undefined> {
    return this.database
      .query()
      .selectFrom('demoModeConfiguration')
      .selectAll()
      .where('id', '=', 'default')
      .executeTakeFirst<Stored>();
  }
  private decode(row: Stored): DemoConfiguration {
    const stored =
      typeof row.value === 'string'
        ? (JSON.parse(row.value) as Omit<DemoConfiguration, 'revision'>)
        : (row.value as Omit<DemoConfiguration, 'revision'>);
    return {
      revision: Number(row.revision),
      collections: stored.collections ?? [],
      schedule: { ...this.settings.dailyReset },
      chat: {
        enabled: stored.chat?.enabled ?? true,
        tools: stored.chat?.tools ?? {},
      },
      mocks: {
        ...Object.fromEntries(
          [...this.adapters.values()].map((a) => [
            a.id,
            a.defaultEnabled !== false,
          ]),
        ),
        ...stored.mocks,
      },
    };
  }
  /** Execution checks read the cached persisted policy without building management-only schedule previews. */
  private async readPolicy(): Promise<DemoConfiguration> {
    this.requireEnabled();
    if (this.cached && Date.now() < this.cached.expires)
      return this.cached.value;
    const row = await this.row();
    if (!row) throw new Error('Demo configuration has not been initialized.');
    const value = this.decode(row);
    this.cached = { value, expires: Date.now() + POLICY_TTL_MS };
    return value;
  }
  public async read(includeBusy = true): Promise<DemoConfigurationView> {
    this.requireEnabled();
    const row = await this.row();
    if (!row) throw new Error('Demo configuration has not been initialized.');
    const value = this.decode(row);
    return {
      ...value,
      busy: includeBusy && Boolean((await this.data()).importing),
      enabled: this.settings.enabled,
      fixedCollections: [...this.settings.allowCollections],
      adapters: [...this.adapters.values()].map((item) => ({
        id: item.id,
        title: item.title,
        kind: item.kind,
        scope: item.scope,
        defaultEnabled: item.defaultEnabled,
      })),
      nextRun: nextDailyRun(value.schedule, new Date(), row.lastDay),
    };
  }
  /** Logical collections in the default application database, for the settings picker only. */
  public async availableCollections(): Promise<
    { name: string; title?: string }[]
  > {
    this.requireEnabled();
    const names: { name: string; title?: string }[] = [];
    let cursor: string | undefined;
    do {
      const page = await this.database
        .connection()
        .collections.list({ limit: 100, cursor });
      for (const item of page.items) {
        const name = item.name;
        if (
          item.kind === 'table' &&
          /^[a-z][a-z0-9_]*$/iu.test(name) &&
          !this.settings.allowCollections.has(name)
        )
          names.push({ name, ...(item.title ? { title: item.title } : {}) });
      }
      cursor = page.nextCursor;
    } while (cursor);
    return names.sort((a, b) => a.name.localeCompare(b.name));
  }
  public async save(
    section: 'collections' | 'mocks' | 'chat',
    expectedRevision: number,
    input: unknown,
  ): Promise<DemoConfigurationView> {
    this.requireEnabled();
    const parsed = ConfigurationInput[section]?.safeParse({
      expectedRevision,
      value: input,
    });
    if (!parsed?.success) throw invalid('Invalid demo configuration.');
    input = parsed.data.value;
    const status = await this.data();
    if (status.importing)
      throw demoDataError(
        'DEMO_DATA_BUSY',
        'Wait for the demo operation to finish.',
      );
    const current = await this.read();
    if (current.revision !== expectedRevision)
      throw demoDataError(
        'DEMO_CONFIGURATION_CONFLICT',
        'The configuration changed. Reload before saving.',
        'ALREADY_EXISTS',
      );
    let value: unknown = input;
    if (section === 'collections') {
      this.resolved.clear();
      const collections = new Set<string>();
      for (const table of input as string[]) {
        if (collections.has(table) || !(await this.resolveCollection(table)))
          throw invalid(
            'Unknown or duplicate collections cannot be configured.',
          );
        collections.add(table);
      }
    } else if (section === 'mocks') {
      if (Object.keys(input as object).some((id) => !this.adapters.has(id)))
        throw invalid('Unknown mock adapter.');
      value = { ...current.mocks, ...(input as object) };
    }
    const updated = {
      collections: current.collections,
      mocks: current.mocks,
      chat: current.chat,
      [section]: value,
    };
    const result = await this.database
      .query()
      .updateTable('demoModeConfiguration')
      .set({ revision: expectedRevision + 1, value: JSON.stringify(updated) })
      .where('id', '=', 'default')
      .where('revision', '=', expectedRevision)
      .execute();
    if (result.updatedCount !== 1)
      throw demoDataError(
        'DEMO_CONFIGURATION_CONFLICT',
        'The configuration changed. Reload before saving.',
        'ALREADY_EXISTS',
      );
    this.cached = undefined;
    return this.read();
  }
  /** Read at admission and before model/tool I/O, including restored sessions and workers. */
  public async chatModel(simulated: {
    modelService: string;
    model: string;
  }): Promise<{ modelService: string; model: string } | undefined> {
    if (!this.enabled) return undefined;
    const { chat } = await this.readPolicy();
    if (!chat.enabled)
      throw demoDataError(
        'DEMO_CHAT_DISABLED',
        'Online demo chat is disabled.',
      );
    return simulated;
  }
  /** Host authorization must run first. Only explicitly marked local reads may execute normally. */
  public async runChatTool<T>(
    id: string,
    operation: {
      readOnly?: boolean;
      run: () => Promise<T>;
      mock?: () => Promise<T>;
    },
  ): Promise<T> {
    if (!this.enabled) return operation.run();
    const { chat } = await this.readPolicy();
    if (!chat.enabled)
      throw demoDataError(
        'DEMO_CHAT_DISABLED',
        'Online demo chat is disabled.',
      );
    const policy =
      chat.tools[id] ??
      (operation.mock ? 'mock' : operation.readOnly === true ? 'read' : 'deny');
    if (policy === 'read' && operation.readOnly === true)
      return operation.run();
    if (policy === 'mock' && operation.mock) return operation.mock();
    throw demoDataError(
      'DEMO_TOOL_UNAVAILABLE',
      'This tool is unavailable in demo chat.',
    );
  }
  /**
   * Persistence boundary for an Agents OnlineAgent chat session. The host must verify ownership and the agent scope
   * first, then call only the public session operation (create, send, abort, finalize, configure, rename, mark read)
   * inside this callback; the session's continuation inherits it. Never wrap a route dispatcher, tool, model call,
   * attachment upload or agent configuration operation. This is not a global allowlist: parallel requests and later
   * commands remain guarded.
   */
  public async runOnlineConversation<T>(run: () => Promise<T>): Promise<T> {
    if (!this.enabled) return run();
    await this.chatModel({ modelService: 'demo', model: 'demo' });
    return this.guard.runAllowed(
      await this.collectionRules(
        ['agConversations', 'agConversationMessages'],
        ['insert', 'update'],
      ),
      run,
    );
  }
  /**
   * Resolve logical names through the default connection's collection metadata. The guard resolves its rules on every
   * request and each lookup introspects the live schema, so results, including misses, are kept until an administrator
   * saves collections, which looks them up afresh.
   */
  private async resolveCollection(
    name: string,
  ): Promise<{ connection: string; table: string } | undefined> {
    const cached = this.resolved.get(name);
    if (cached !== undefined) return cached ?? undefined;
    const connection = this.database.connection();
    const collection = await connection.collections.get(name);
    const physical =
      collection?.name === name && collection.kind === 'table'
        ? await connection.collections.getPhysical(name)
        : undefined;
    const target = physical
      ? { connection: connection.name, table: physical.tableName.toLowerCase() }
      : null;
    this.resolved.set(name, target);
    return target ?? undefined;
  }
  private async collectionRules(
    names: Iterable<string>,
    statements: readonly string[],
  ): Promise<DemoSqlRule[]> {
    const rules: DemoSqlRule[] = [];
    for (const name of names) {
      const target = await this.resolveCollection(name);
      if (target)
        rules.push(
          ...statements.map((statement) => ({ ...target, statement })),
        );
    }
    return rules;
  }
  /** Rules usable by the SQL guard without application row context, restricted to the default connection. */
  public async wholeCollectionRules(): Promise<readonly DemoSqlRule[]> {
    if (!this.enabled) return [];
    const { collections } = await this.currentPolicy();
    return this.collectionRules(
      new Set([...this.settings.allowCollections, ...collections]),
      ['insert', 'update', 'delete'],
    );
  }
  public async requireMock(id: string): Promise<void> {
    this.requireEnabled();
    if (!this.adapters.has(id) || !(await this.currentPolicy()).mocks[id])
      throw demoDataError(
        'DEMO_MOCK_UNAVAILABLE',
        'This demo call has no enabled adapter.',
      );
  }
  public async invokeMock<T = unknown>(id: string, input: unknown): Promise<T> {
    this.requireEnabled();
    const adapter = this.adapters.get(id);
    if (!adapter || !(await this.currentPolicy()).mocks[id])
      throw demoDataError(
        'DEMO_MOCK_UNAVAILABLE',
        'This demo call has no enabled adapter.',
      );
    return (await adapter.invoke(input)) as T;
  }
  /** Admission uses deployment policy and the database, independently of the request policy cache. */
  private async dailyAdmission(now: Date): Promise<{
    readonly day: string;
    readonly schedule: DemoDailySchedule;
    readonly allowCreate: boolean;
  } | null> {
    if (!this.enabled) return null;
    const row = await this.row();
    if (!row) return null;
    const schedule = { ...this.settings.dailyReset };
    const local = localMinute(now, schedule.timezone);
    if (
      !schedule.enabled ||
      local.hour * 60 + local.minute < schedule.hour * 60 + schedule.minute ||
      row.lastDay === local.day ||
      !firstWallMinute(now, schedule.timezone)
    )
      return null;
    // A brief admission window lets a database/claim failure recover without manufacturing a run in a DST gap.
    let allowCreate = false;
    for (let ago = 0; ago <= 15; ago++) {
      const candidate = new Date(now.getTime() - ago * 60_000);
      const wall = localMinute(candidate, schedule.timezone);
      if (
        wall.day === local.day &&
        wall.hour === schedule.hour &&
        wall.minute === schedule.minute &&
        firstWallMinute(candidate, schedule.timezone)
      ) {
        allowCreate = true;
        break;
      }
    }
    return { day: local.day, schedule, allowCreate };
  }
  public async dailyDue(now: Date): Promise<boolean> {
    const admission = await this.dailyAdmission(now);
    return admission
      ? new DailyResetClaims(this.database).pending(
          admission.day,
          now,
          admission.allowCreate,
        )
      : false;
  }
  public async claimDaily(
    now: Date,
    options: { readonly dataSettled?: boolean } = {},
  ): Promise<DailyClaim | null> {
    const admission = await this.dailyAdmission(now);
    if (!admission) return null;
    return new DailyResetClaims(this.database).claim(
      admission.day,
      admission.schedule,
      now,
      admission.allowCreate,
      options.dataSettled,
    );
  }
  public renewDaily(claim: DailyClaim): Promise<void> {
    return new DailyResetClaims(this.database).renew(claim);
  }
  public finishDaily(
    claim: DailyClaim,
    error?: unknown,
    retryable = false,
  ): Promise<void> {
    return new DailyResetClaims(this.database).finish(claim, error, retryable);
  }
}
