import {
  resolveJobsConfig,
  resolveMemoryJobsConfig,
  selectJobsConfig,
  type JobsAdapterConfig,
  type JobsConfig,
  type JobsConfigDefaults,
  type ResolvedJobsConfig,
  type ResolvedMemoryJobsConfig,
} from './config.js';
import { BackendJobExecutor } from './job/executor.js';
import { MemoryJobBackend } from './job/memory/backend.js';
import { createMemoryScheduleExecutor } from './schedule/memory/index.js';
import type { JobExecutor } from './job/types.js';
import type { ScheduleExecutor } from './schedule/types.js';
import type { JobExecutorServiceDependencies } from './service.js';

/** A deployment error, never a reason to fall back to another backend. */
export class JobsBackendNotRegisteredError extends Error {
  public constructor(
    public readonly adapter: string,
    public readonly key: string,
  ) {
    super(
      `Jobs backend "${adapter}" for configuration "${key}" is not registered. Install and register its server plugin before using this configuration.`,
    );
    this.name = 'JobsBackendNotRegisteredError';
  }
}

/** Pure parsing and both executor factories are registered atomically. */
export interface JobsBackendAdapter<TConfig extends ResolvedJobsConfig> {
  readonly name: string;
  resolve(
    config: JobsAdapterConfig,
    base: ResolvedJobsConfig,
    defaults: JobsConfigDefaults,
  ): TConfig;
  createJobExecutor(
    config: TConfig,
    dependencies: JobExecutorServiceDependencies,
  ): JobExecutor;
  createScheduleExecutor(
    config: TConfig,
    dependencies: JobExecutorServiceDependencies,
  ): ScheduleExecutor;
}

interface SelectedBackend {
  readonly config: ResolvedJobsConfig;
  readonly memory?: ResolvedMemoryJobsConfig;
  createJobExecutor(): JobExecutor;
  createScheduleExecutor(): ScheduleExecutor;
}

type Resolver = (
  raw: JobsAdapterConfig,
  base: ResolvedJobsConfig,
  dependencies: JobExecutorServiceDependencies,
) => SelectedBackend;

/** One registry per service/application. Host registries open only after register. */
export class JobsBackendRegistry {
  private readonly adapters = new Map<string, Resolver>();
  private frozen = false;
  public constructor(private readonly requireFreeze: boolean = false) {
    this.register({
      name: 'memory',
      resolve: resolveMemoryJobsConfig,
      createJobExecutor: (config, { logger }) =>
        new BackendJobExecutor(new MemoryJobBackend(config), logger),
      createScheduleExecutor: (config, { logger }) =>
        createMemoryScheduleExecutor(config, { logger }),
    });
  }

  public register<TConfig extends ResolvedJobsConfig>(
    adapter: JobsBackendAdapter<TConfig>,
  ): void {
    if (this.frozen) throw new Error('Jobs backend registration is closed.');
    if (!adapter.name || this.adapters.has(adapter.name))
      throw new Error(
        `Jobs backend "${adapter.name}" is already registered or invalid.`,
      );
    if (
      typeof adapter.resolve !== 'function' ||
      typeof adapter.createJobExecutor !== 'function' ||
      typeof adapter.createScheduleExecutor !== 'function'
    )
      throw new Error(
        'A jobs backend requires a resolver and both executor factories.',
      );
    this.adapters.set(adapter.name, (raw, base, dependencies) => {
      const config = adapter.resolve(raw, base, dependencies);
      return {
        config,
        createJobExecutor: () =>
          adapter.createJobExecutor(config, dependencies),
        createScheduleExecutor: () =>
          adapter.createScheduleExecutor(config, dependencies),
      };
    });
  }

  public freeze(): void {
    this.frozen = true;
  }

  public select(
    config: JobsConfig | undefined,
    name: string | undefined,
    scope: string,
    dependencies: JobExecutorServiceDependencies,
  ): SelectedBackend {
    if (this.requireFreeze && !this.frozen)
      throw new Error(
        'Jobs executors cannot be used during provider registration.',
      );
    const selection = selectJobsConfig(config, name);
    const base = resolveJobsConfig(selection, scope, dependencies);
    const resolve = this.adapters.get(base.adapter);
    if (!resolve)
      throw new JobsBackendNotRegisteredError(base.adapter, base.key);
    const raw = selection.config ?? { adapter: 'memory' };
    const selected = resolve(raw, base, dependencies);
    return base.adapter === 'memory'
      ? {
          ...selected,
          memory: resolveMemoryJobsConfig(raw, base, dependencies),
        }
      : selected;
  }
}
