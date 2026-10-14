import {
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';

import type { StudioReports } from './service.js';

/** Studio's reports service, bound by `StudioAgentsProvider`. */
export const studioReportsToken: ServiceToken<StudioReports> =
  createServiceToken<StudioReports>('studio/reports');
