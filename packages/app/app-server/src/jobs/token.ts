import {
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';

import type { JobExecutorService } from '@nocobase/jobs';

/**
 * The application's schedule service. Each consumer asks it for an executor
 * of its own, under its package name as the scope.
 */
export const jobExecutorServiceToken: ServiceToken<JobExecutorService> =
  createServiceToken<JobExecutorService>('@nocobase/jobs/service');
