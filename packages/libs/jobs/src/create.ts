import type { ScheduleConfig } from './config.js';
import { createMemoryScheduleExecutor } from './memory/index.js';
import { createRedisScheduleExecutor } from './redis/index.js';
import {
  createJobExecutorServiceWith,
  type ManagedJobExecutorService,
  type JobExecutorServiceDependencies,
} from './service.js';

/**
 * Creates the schedule service for one application. `config` is the
 * application's `jobs` section; `dependencies` carry what the package
 * would otherwise have to read from the application.
 */
export function createJobExecutorService(
  config: ScheduleConfig | undefined,
  dependencies: JobExecutorServiceDependencies,
): ManagedJobExecutorService {
  return createJobExecutorServiceWith(config, dependencies, {
    memory: (resolved, { logger }) =>
      createMemoryScheduleExecutor(resolved, { logger }),
    redis: (resolved, { logger }) =>
      createRedisScheduleExecutor(resolved, { logger }),
  });
}
