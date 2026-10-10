import {
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';

import type { ProjectInits } from './service.js';

/** New projects and their initialization, bound by `StudioProjectInitsProvider`. */
export const studioProjectInitsToken: ServiceToken<ProjectInits> =
  createServiceToken<ProjectInits>('studio/project-inits');
