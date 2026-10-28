import {
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';

import type { JobExecutorService } from '@nocobase/jobs';
import type { JobsBackendRegistry } from '@nocobase/jobs/backend';

/**
 * The application's ordinary and recurring jobs service. Each consumer asks
 * for its own JobExecutor or ScheduleExecutor under its package name as scope.
 */
export const jobExecutorServiceToken: ServiceToken<JobExecutorService> =
  createServiceToken<JobExecutorService>('@nocobase/jobs/service');

/** Application-local paired backend registration, available during register(). */
export const jobsBackendRegistryToken: ServiceToken<JobsBackendRegistry> =
  createServiceToken<JobsBackendRegistry>('@nocobase/jobs/backends');
