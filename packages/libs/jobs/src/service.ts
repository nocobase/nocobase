import {
  resolveScheduleExecutorConfig,
  selectScheduleConfig,
  type ResolvedMemoryScheduleExecutorConfig,
  type ResolvedRedisScheduleExecutorConfig,
  type ResolvedScheduleExecutorConfig,
  type ScheduleConfig,
} from './config.js';
import type {
  JobExecutorService,
  ScheduleExecutor,
  ScheduleLogger,
} from './types.js';
import { assertValidScope } from './validation.js';

/** Reports that an executor runs on the built-in memory configuration. */
export interface ScheduleFallbackEvent {
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
  readonly logger?: ScheduleLogger;
  /**
   * Called once for each executor created on the built-in memory
   * configuration, which runs on one host only.
   */
  readonly onFallback?: (event: ScheduleFallbackEvent) => void;
}

/** The service as its owner holds it: consumers see `JobExecutorService`. */
export interface ManagedJobExecutorService extends JobExecutorService {
  /** Shuts every executor down. Safe to call more than once. */
  shutdown(): Promise<void>;
}

export type ScheduleExecutorFactory<
  TConfig extends ResolvedScheduleExecutorConfig =
    ResolvedScheduleExecutorConfig,
> = (
  config: TConfig,
  dependencies: JobExecutorServiceDependencies,
) => ScheduleExecutor;

export interface ScheduleExecutorFactories {
  readonly memory: ScheduleExecutorFactory<ResolvedMemoryScheduleExecutorConfig>;
  readonly redis: ScheduleExecutorFactory<ResolvedRedisScheduleExecutorConfig>;
}

export function createJobExecutorServiceWith(
  config: ScheduleConfig | undefined,
  dependencies: JobExecutorServiceDependencies,
  factories: ScheduleExecutorFactories,
): ManagedJobExecutorService {
  const executors = new Map<string, ScheduleExecutor>();
  let shutdownPromise: Promise<void> | undefined;

  return {
    getScheduleExecutor(scope: string, name?: string): ScheduleExecutor {
      if (shutdownPromise) {
        throw new Error('The schedule service has been shut down.');
      }
      assertValidScope(scope);
      const selection = selectScheduleConfig(config, name);
      // A scope and a configuration key identify one queue, so they identify
      // one executor: two would compete for the same firings.
      const identity = JSON.stringify([selection.key, scope]);
      const existing = executors.get(identity);
      if (existing) return existing;
      const resolved = resolveScheduleExecutorConfig(
        selection,
        scope,
        dependencies,
      );
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

    shutdown(): Promise<void> {
      shutdownPromise ??= Promise.allSettled(
        [...executors.values()].map((executor) => executor.shutdown()),
      ).then((results) => {
        const failures = results.flatMap((result) =>
          result.status === 'rejected' ? [result.reason as unknown] : [],
        );
        if (failures.length > 0) {
          throw new AggregateError(
            failures,
            'Some schedule executors failed to shut down.',
          );
        }
      });
      return shutdownPromise;
    },
  };
}
