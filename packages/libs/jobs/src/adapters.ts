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
export interface JobsImplementation<TConfig extends ResolvedJobsConfig> {
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

/** One registry per service/application; implementations cannot be replaced. */
export class JobsBackendRegistry {
  private readonly adapters = new Map<string, Resolver>();
  public constructor() {
    this.register('memory', {
      resolve: resolveMemoryJobsConfig,
      createJobExecutor: (config, { logger }) =>
        new BackendJobExecutor(new MemoryJobBackend(config), logger),
      createScheduleExecutor: (config, { logger }) =>
        createMemoryScheduleExecutor(config, { logger }),
    });
  }

  public register<TConfig extends ResolvedJobsConfig>(
    name: string,
    implementation: JobsImplementation<TConfig>,
  ): void {
    if (typeof name !== 'string' || name.trim() === '')
      throw new TypeError('A jobs adapter name must be a non-empty string.');
    if (this.adapters.has(name))
      throw new Error(`Jobs backend "${name}" is already registered.`);
    if (
      implementation === null ||
      (typeof implementation !== 'object' &&
        typeof implementation !== 'function') ||
      typeof implementation.resolve !== 'function' ||
      typeof implementation.createJobExecutor !== 'function' ||
      typeof implementation.createScheduleExecutor !== 'function'
    )
      throw new TypeError(
        'A jobs implementation requires a resolver and both executor factories.',
      );
    this.adapters.set(name, (raw, base, dependencies) => {
      const config = implementation.resolve(raw, base, dependencies);
      return {
        config,
        createJobExecutor: () =>
          implementation.createJobExecutor(config, dependencies),
        createScheduleExecutor: () =>
          implementation.createScheduleExecutor(config, dependencies),
      };
    });
  }

  public select(
    config: JobsConfig | undefined,
    name: string | undefined,
    scope: string,
    dependencies: JobExecutorServiceDependencies,
  ): SelectedBackend {
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
