import type { ResolvedRedisJobsConfig } from '../../config.js';
import { BackendScheduleExecutor } from '../executor.js';
import type { JobExecutorServiceDependencies } from '../../service.js';
import type { ScheduleExecutor } from '../types.js';
import {
  defaultRedisFactories,
  RedisScheduleBackend,
  type RedisScheduleBackendFactories,
} from './backend.js';

export function createRedisScheduleExecutor(
  config: ResolvedRedisJobsConfig,
  dependencies: Pick<JobExecutorServiceDependencies, 'logger'>,
  factories: RedisScheduleBackendFactories = defaultRedisFactories,
): ScheduleExecutor {
  return new BackendScheduleExecutor(
    new RedisScheduleBackend(config, dependencies.logger, factories),
    dependencies.logger,
  );
}
