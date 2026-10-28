import type { JobsConfig } from './config.js';
import { JobsBackendRegistry } from './adapters.js';
import {
  createJobExecutorServiceWith,
  type ManagedJobExecutorService,
  type JobExecutorServiceDependencies,
} from './service.js';

/** Creates a lazy service. External backends must be explicitly registered. */
export function createJobExecutorService(
  config: JobsConfig | undefined,
  dependencies: JobExecutorServiceDependencies,
  registry: JobsBackendRegistry = new JobsBackendRegistry(),
): ManagedJobExecutorService {
  return createJobExecutorServiceWith(config, dependencies, registry);
}
