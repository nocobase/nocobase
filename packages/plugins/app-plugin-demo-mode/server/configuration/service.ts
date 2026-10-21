import { DemoAgentProxy, type DemoAgentAdapter } from './agent-proxy.js';
import { AsyncLocalStorage } from 'node:async_hooks';
import type { DatabaseManager } from '@nocobase/db';
import type { DemoModeSettings } from '../config.js';
import type { DemoWriteGuard } from '../guard.js';
import { demoDataError } from '../data/service.js';
import { ConfigurationInput } from './schemas.js';
import { firstWallMinute, localMinute, nextDailyRun } from './schedule.js';
import type {
  DemoConfiguration,
  DemoConfigurationView,
  DemoDailySchedule,
  DemoMockAdapter,
  DemoWriteCapability,
  DemoWriteRule,
  DemoTableRule,
} from './types.js';

const protectedTable =
  /^(?:user|account|session|verification|auth|ag_|demo_mode_|permission|role|secret|api_key)/u;
const invalid = (message: string) =>
  demoDataError('DEMO_CONFIGURATION_INVALID', message, 'INVALID_ARGUMENT');
interface Stored {
  revision: number;
  value: unknown;
  lastDay: string | null;
}

/** All instances read shared configuration; no process-local policy cache can retain revoked access. */
export class DemoConfigurationService {
  private readonly policy = new AsyncLocalStorage<DemoConfigurationView>();
  public async runWithPolicy<T>(run: () => Promise<T>): Promise<T> {
    if (!this.enabled || this.policy.getStore()) return run();
    return this.policy.run(await this.read(false), run);
  }
  private async currentPolicy(): Promise<DemoConfigurationView> {
    return this.policy.getStore() ?? this.read(false);
  }
  private readonly writes = new Map<string, DemoWriteCapability>();
  private readonly adapters = new Map<string, DemoMockAdapter>();
  public constructor(
    private readonly database: DatabaseManager,
    private readonly settings: DemoModeSettings,
    private readonly guard: DemoWriteGuard,
    private readonly data: () => Promise<{
      importing: unknown;
      languages: readonly string[];
    }>,
  ) {}
  public get enabled(): boolean {
    return this.settings.mode !== 'off';
  }
  public requireEnabled(): void {
    if (!this.enabled)
      throw demoDataError(
        'DEMO_MODE_REQUIRED',
        'Demo management is unavailable in this deployment.',
        'NOT_FOUND',
      );
  }
  public registerWrite(capability: DemoWriteCapability): void {
    if (this.writes.has(capability.id))
      throw new Error(`Duplicate demo capability: ${capability.id}`);
    if (
      !/^[a-z][a-z0-9_]*$/u.test(capability.table) ||
      protectedTable.test(capability.table)
    )
      throw invalid('A protected or invalid table cannot be exposed.');
    if (
      !capability.operations.length ||
      !capability.scopes.length ||
      capability.scopes.some(
        (scope) => scope.id !== 'all' && !capability.checkScope,
      )
    )
      throw invalid('Each scoped capability needs a scope resolver.');
    this.writes.set(capability.id, capability);
  }
  public registerMock(adapter: DemoMockAdapter): void {
    if (this.adapters.has(adapter.id))
      throw new Error(`Duplicate demo mock: ${adapter.id}`);
    this.adapters.set(adapter.id, adapter);
  }
  public registerAgent<Input, Output>(
    adapter: DemoAgentAdapter<Input, Output>,
  ): DemoAgentProxy<Input, Output> {
    return new DemoAgentProxy(this, adapter);
  }
  /** Async workers must not inherit the originating HTTP request's stale policy snapshot. */
  public withFreshPolicy<T>(run: () => Promise<T>): Promise<T> {
    return this.policy.exit(() => this.runWithPolicy(run));
  }
  public async initialize(): Promise<void> {
    if (!this.enabled) return;
    if (await this.row()) return;
    try {
      await this.database
        .query()
        .insertInto('demoModeConfiguration')
        .values({
          id: 'default',
          revision: 0,
          value: JSON.stringify({ rules: [], mocks: {}, schedule: null }),
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
      rules: stored.rules,
      tableRules: stored.tableRules ?? [],
      schedule: stored.schedule,
      chat: stored.chat ?? { enabled: false, model: null, tools: {} },
      mocks: {
        ...Object.fromEntries(
          [...this.adapters.values()].map((a) => [
            a.id,
            a.defaultEnabled === true,
          ]),
        ),
        ...stored.mocks,
      },
    };
  }
  public async read(includeBusy = true): Promise<DemoConfigurationView> {
    this.requireEnabled();
    const row = await this.row();
    if (!row) throw new Error('Demo configuration has not been initialized.');
    const value = this.decode(row);
    return {
      ...value,
      busy: includeBusy && Boolean((await this.data()).importing),
      mode: this.settings.mode,
      fixedTables: [...this.settings.allowTables],
      capabilities: [...this.writes.values()].map((item) => ({
        id: item.id,
        title: item.title,
        table: item.table,
        operations: item.operations,
        scopes: item.scopes,
      })),
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
  public async save(
    section: 'rules' | 'tableRules' | 'mocks' | 'schedule' | 'chat',
    expectedRevision: number,
    input: unknown,
  ): Promise<DemoConfigurationView> {
    this.requireEnabled();
    const parsed = ConfigurationInput[section].safeParse({
      expectedRevision,
      value: input,
    });
    if (!parsed.success) throw invalid('Invalid demo configuration.');
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
    if (section === 'tableRules') {
      const tables = new Set<string>();
      for (const rule of input as DemoTableRule[]) {
        if (
          protectedTable.test(rule.table) ||
          tables.has(rule.table) ||
          new Set(rule.operations).size !== rule.operations.length
        )
          throw invalid(
            'Protected tables and duplicate table operations cannot be configured.',
          );
        tables.add(rule.table);
      }
    } else if (section === 'rules') {
      const rules = input as DemoWriteRule[];
      const keys = new Set<string>();
      for (const rule of rules) {
        const capability = this.writes.get(rule.capability);
        const key = `${rule.capability}:${rule.operation}`;
        if (
          !capability ||
          !capability.operations.includes(rule.operation) ||
          !capability.scopes.some((scope) => scope.id === rule.scope) ||
          keys.has(key)
        )
          throw invalid('Unknown or duplicate write rule.');
        keys.add(key);
      }
    } else if (section === 'mocks') {
      if (Object.keys(input as object).some((id) => !this.adapters.has(id)))
        throw invalid('Unknown mock adapter.');
      value = { ...current.mocks, ...(input as object) };
    } else if (section === 'schedule') {
      const schedule = input as DemoDailySchedule;
      if (schedule.enabled) {
        try {
          localMinute(new Date(), schedule.timezone);
        } catch {
          throw invalid('Invalid timezone.');
        }
        if (!status.languages.includes(schedule.language))
          throw invalid('Unsupported dataset language.');
      }
    }
    const updated = {
      rules: current.rules,
      tableRules: current.tableRules,
      mocks: current.mocks,
      schedule: current.schedule,
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
    return this.read();
  }
  /** Read fresh at admission and before model/tool I/O, including restored sessions and workers. */
  public async chatModel(simulated: {
    modelService: string;
    model: string;
  }): Promise<{ modelService: string; model: string } | undefined> {
    if (!this.enabled) return undefined;
    const { chat } = await this.read(false);
    if (!chat.enabled)
      throw demoDataError(
        'DEMO_CHAT_DISABLED',
        'Online demo chat is disabled.',
      );
    return chat.model ?? simulated;
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
    const { chat } = await this.read(false);
    if (!chat.enabled)
      throw demoDataError(
        'DEMO_CHAT_DISABLED',
        'Online demo chat is disabled.',
      );
    const policy = chat.tools[id] ?? 'deny';
    if (policy === 'read' && operation.readOnly === true)
      return operation.run();
    if (policy === 'mock' && operation.mock) return operation.mock();
    throw demoDataError(
      'DEMO_TOOL_UNAVAILABLE',
      'This tool is unavailable in demo chat.',
    );
  }
  /**
   * Persistence boundary for the legacy Agents online conversation service. The host must verify ownership and
   * online-agent invocation first, then call only the original conversation operation inside this callback.
   * Never wrap a route dispatcher, tool, model call, attachment upload or agent configuration operation.
   * This is not a global allowlist: parallel requests and later commands remain guarded.
   */
  public async runLegacyOnlineConversation<T>(
    run: () => Promise<T>,
  ): Promise<T> {
    if (!this.enabled) return run();
    await this.chatModel({ modelService: 'demo', model: 'demo' });
    return this.guard.runAllowed(
      [
        ...[
          'ag_conversations',
          'ag_conversation_messages',
          'ag_runs',
          'ag_run_inputs',
        ].flatMap((table) =>
          ['insert', 'update'].map((statement) => ({ table, statement })),
        ),
        // The legacy service locks the invoked agent by updating lastClaimAt before enqueueing.
        { table: 'ag_agents', statement: 'update' },
        // Stopping an owned queued run revokes existing tokens; it never issues one.
        { table: 'ag_run_tokens', statement: 'update' },
      ],
      run,
    );
  }
  /** Rules usable by the SQL guard without application row context. */
  public async wholeTableRules(): Promise<
    readonly { table: string; statement: string }[]
  > {
    if (!this.enabled) return [];
    const { rules, tableRules } = await this.currentPolicy();
    return [
      ...tableRules.flatMap((rule) =>
        rule.operations.map((statement) => ({ table: rule.table, statement })),
      ),
      ...rules.flatMap((rule) => {
        const capability = this.writes.get(rule.capability);
        return capability &&
          rule.scope === 'all' &&
          capability.scopes.some((scope) => scope.id === 'all') &&
          capability.operations.includes(rule.operation)
          ? [{ table: capability.table, statement: rule.operation }]
          : [];
      }),
    ];
  }
  /** Call only around the declared, already-authorized business operation, never around a general dispatcher. */
  public runWrite<T>(
    id: string,
    operation: DemoWriteRule['operation'],
    input: unknown,
    run: () => Promise<T>,
  ): Promise<T> {
    return this.runWrites([[id, operation]], input, run);
  }
  /**
   * As `runWrite`, for an operation that writes through several capabilities: each configured, in-scope rule adds
   * its table and statement to what the guard lets through; an entry with no rule allows nothing. One entry whose
   * rule is configured but out of scope refuses the whole operation.
   */
  public async runWrites<T>(
    entries: readonly (readonly [
      id: string,
      operation: DemoWriteRule['operation'],
    ])[],
    input: unknown,
    run: () => Promise<T>,
  ): Promise<T> {
    if (!this.enabled) return run();
    const { rules } = await this.currentPolicy();
    const allowed: { table: string; statement: string }[] = [];
    for (const [id, operation] of entries) {
      const capability = this.writes.get(id);
      const rule = rules.find(
        (item) => item.capability === id && item.operation === operation,
      );
      if (
        !capability ||
        !rule ||
        !capability.operations.includes(operation) ||
        !capability.scopes.some((scope) => scope.id === rule.scope)
      )
        continue;
      if (
        rule.scope !== 'all' &&
        !(await capability.checkScope?.(rule.scope, input))
      )
        throw demoDataError(
          'DEMO_SCOPE_DENIED',
          'This operation is outside the configured demo scope.',
        );
      allowed.push({ table: capability.table, statement: operation });
    }
    return allowed.length ? this.guard.runAllowed(allowed, run) : run();
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
  /** A durable claim prevents repeated DST minutes and multiple processes from resetting the same local day twice. */
  public async claimDaily(now: Date): Promise<DemoDailySchedule | null> {
    if (!this.enabled) return null;
    const row = await this.row();
    if (!row) return null;
    const config = this.decode(row);
    const schedule = config.schedule;
    if (!schedule?.enabled) return null;
    const local = localMinute(now, schedule.timezone);
    if (
      local.hour !== schedule.hour ||
      local.minute !== schedule.minute ||
      row.lastDay === local.day ||
      !firstWallMinute(now, schedule.timezone)
    )
      return null;
    const result = await this.database
      .query()
      .updateTable('demoModeConfiguration')
      .set({ lastDay: local.day })
      .where('id', '=', 'default')
      .where('revision', '=', config.revision)
      .where('lastDay', row.lastDay === null ? 'is' : '=', row.lastDay)
      .execute();
    return result.updatedCount === 1 ? schedule : null;
  }
}
