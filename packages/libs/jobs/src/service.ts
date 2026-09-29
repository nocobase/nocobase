import {
  resolveJobsConfig,
  selectJobsConfig,
  type ResolvedMemoryJobsConfig,
  type ResolvedRedisJobsConfig,
  type ResolvedJobsConfig,
  type JobsConfig,
} from './config.js';
import type { ScheduleExecutor } from './schedule/types.js';
import type { JobExecutorService, JobsLogger } from './types.js';
import { assertValidScope } from './validation.js';
import type { JobExecutor } from './job/types.js';
import { BackendJobExecutor } from './job/executor.js';
import { MemoryJobBackend } from './job/memory/backend.js';
import { jobStateFilePath } from './job/memory/state-file.js';
import { RedisJobBackend } from './job/redis/backend.js';

/** Reports that an executor runs on the built-in memory configuration. */
export interface JobsFallbackEvent {
  readonly scope: string;
  /** The configuration key the consumer asked for, when it named one. */
  readonly name?: string;
}

/**
 * What the application supplies. The package reads neither application
 * settings nor the process environment itself.
 */
export interface JobExecutorServiceDependencies {
  /** The namespace of every configuration that sets none. */
  readonly appName: string;
  /** Where memory configurations without `persistence.path` keep their state. */
  readonly storagePath: string;
  readonly logger?: JobsLogger;
  /**
   * Called once for each executor created on the built-in memory
   * configuration, which runs on one host only.
   */
  readonly onFallback?: (event: JobsFallbackEvent) => void;
}

/** The service as its owner holds it: consumers see `JobExecutorService`. */
export interface ManagedJobExecutorService extends JobExecutorService {
  /** Shuts every executor down. Safe to call more than once. */
  shutdown(): Promise<void>;
}

export type ScheduleExecutorFactory<
  TConfig extends ResolvedJobsConfig = ResolvedJobsConfig,
> = (
  config: TConfig,
  dependencies: JobExecutorServiceDependencies,
) => ScheduleExecutor;

export interface ScheduleExecutorFactories {
  readonly memory: ScheduleExecutorFactory<ResolvedMemoryJobsConfig>;
  readonly redis: ScheduleExecutorFactory<ResolvedRedisJobsConfig>;
}

export interface JobExecutorFactories {
  readonly memory: (
    config: ResolvedMemoryJobsConfig,
    dependencies: JobExecutorServiceDependencies,
  ) => JobExecutor;
  readonly redis: (
    config: ResolvedRedisJobsConfig,
    dependencies: JobExecutorServiceDependencies,
  ) => JobExecutor;
}

const defaultJobFactories: JobExecutorFactories = {
  memory: (config, { logger }) =>
    new BackendJobExecutor(new MemoryJobBackend(config), logger),
  redis: (config, { logger }) =>
    new BackendJobExecutor(new RedisJobBackend(config, logger), logger),
};

export function createJobExecutorServiceWith(
  config: JobsConfig | undefined,
  dependencies: JobExecutorServiceDependencies,
  factories: ScheduleExecutorFactories,
  jobFactories: JobExecutorFactories = defaultJobFactories,
): ManagedJobExecutorService {
  const executors = new Map<string, ScheduleExecutor>();
  const jobs = new Map<string, JobExecutor>();
  const memoryJobs = new Map<
    string,
    { config: ResolvedJobsConfig; executor: JobExecutor }
  >();
  let shutdownPromise: Promise<void> | undefined;

  return {
    getScheduleExecutor(scope: string, name?: string): ScheduleExecutor {
      if (shutdownPromise) {
        throw new Error('The jobs service has been shut down.');
      }
      assertValidScope(scope);
      const selection = selectJobsConfig(config, name);
      // Cache identity includes the selected key. Existing Schedule queues do
      // not: equal connections, namespaces and scopes share physical firings.
      const identity = JSON.stringify([selection.key, scope]);
      const existing = executors.get(identity);
      if (existing) return existing;
      const resolved = resolveJobsConfig(selection, scope, dependencies);
      const executor =
        resolved.adapter === 'memory'
          ? factories.memory(resolved, dependencies)
          : factories.redis(resolved, dependencies);
      executors.set(identity, executor);
      if (resolved.builtIn) {
        dependencies.onFallback?.({
          scope,
          ...(name !== undefined ? { name } : {}),
        });
      }
      return executor;
    },

    getJobExecutor(scope: string, name?: string): JobExecutor {
      if (shutdownPromise)
        throw new Error('The jobs service has been shut down.');
      assertValidScope(scope);
      const selection = selectJobsConfig(config, name);
      const identity = JSON.stringify([selection.key, scope]);
      const existing = jobs.get(identity);
      if (existing) return existing;
      const resolved = resolveJobsConfig(selection, scope, dependencies);
      // Memory keys naming the same file share one executor: two in-process
      // writers would overwrite each other's pending snapshot at shutdown.
      const file =
        resolved.adapter === 'memory' ? jobStateFilePath(resolved) : undefined;
      const shared = file === undefined ? undefined : memoryJobs.get(file);
      if (shared) {
        if (
          shared.config.concurrency !== resolved.concurrency ||
          shared.config.attempts !== resolved.attempts
        ) {
          throw new Error(
            `Jobs configurations "${shared.config.key}" and "${resolved.key}" share the memory task file ${file} for scope "${scope}" but set different concurrency or attempts.`,
          );
        }
        jobs.set(identity, shared.executor);
        return shared.executor;
      }
      const executor =
        resolved.adapter === 'memory'
          ? jobFactories.memory(resolved, dependencies)
          : jobFactories.redis(resolved, dependencies);
      jobs.set(identity, executor);
      if (file !== undefined)
        memoryJobs.set(file, { config: resolved, executor });
      if (resolved.builtIn)
        dependencies.onFallback?.({
          scope,
          ...(name !== undefined ? { name } : {}),
        });
      return executor;
    },

    shutdown(): Promise<void> {
      shutdownPromise ??= Promise.allSettled(
        [...executors.values(), ...new Set(jobs.values())].map((executor) =>
          Promise.resolve().then(() => executor.shutdown()),
        ),
      ).then((results) => {
        const failures = results.flatMap((result) =>
          result.status === 'rejected' ? [result.reason as unknown] : [],
        );
        if (failures.length > 0) {
          throw new AggregateError(
            failures,
            'Some jobs executors failed to shut down.',
          );
        }
      });
      return shutdownPromise;
    },
  };
}
