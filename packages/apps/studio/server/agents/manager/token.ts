import {
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';

import type { ProjectManager } from './service.js';

/** The project manager (`service.ts`), bound by Studio's agents provider. */
export const studioProjectManagerToken: ServiceToken<ProjectManager> =
  createServiceToken<ProjectManager>('studio/project-manager');
