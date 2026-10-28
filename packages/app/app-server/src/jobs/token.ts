import {
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';

import type { JobExecutorService } from '@nocobase/jobs';

/**
 * The application's ordinary and recurring jobs service. Each consumer asks
 * for its own JobExecutor or ScheduleExecutor under its package name as scope.
 */
export const jobExecutorServiceToken: ServiceToken<JobExecutorService> =
  createServiceToken<JobExecutorService>('@nocobase/jobs/service');
