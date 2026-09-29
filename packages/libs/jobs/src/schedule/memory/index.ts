import type { ResolvedMemoryJobsConfig } from '../../config.js';
import { BackendScheduleExecutor } from '../executor.js';
import type { JobExecutorServiceDependencies } from '../../service.js';
import type { ScheduleExecutor } from '../types.js';
import { InMemoryScheduleBackend } from './backend.js';

export function createMemoryScheduleExecutor(
  config: ResolvedMemoryJobsConfig,
  dependencies: Pick<JobExecutorServiceDependencies, 'logger'>,
): ScheduleExecutor {
  return new BackendScheduleExecutor(
    new InMemoryScheduleBackend(config, dependencies.logger),
    dependencies.logger,
  );
}
