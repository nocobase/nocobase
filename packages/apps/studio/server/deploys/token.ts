import {
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';

import type { DeployMarksService } from './service.js';

/** Deployment marks and the unreleased list (`service.ts`), bound by `StudioDeploysProvider`. */
export const studioDeploysToken: ServiceToken<DeployMarksService> =
  createServiceToken<DeployMarksService>('studio/deploys');
