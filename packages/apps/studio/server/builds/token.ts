import {
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';

import type { CiSetup } from './ci-setup.js';
import type { Builds } from './service.js';

/** CI builds (`service.ts`), bound by `StudioPreviewsProvider`. */
export const studioBuildsToken: ServiceToken<Builds> =
  createServiceToken<Builds>('studio/builds');

/** Setting repositories' CI up (`ci-setup.ts`), bound by `StudioCiProvider`. */
export const studioCiSetupToken: ServiceToken<CiSetup> =
  createServiceToken<CiSetup>('studio/builds/ci-setup');
