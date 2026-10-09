import {
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';

import type { OfficeFlowsService } from './services/office-flows.js';

export const officeFlowsServiceToken: ServiceToken<OfficeFlowsService> =
  createServiceToken<OfficeFlowsService>(
    '@nocobase/app-plugin-office-flows-example/service',
  );
