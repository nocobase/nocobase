import {
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';

import type { Delegations } from './delegation.js';

/** The work conversations delegated and follow (`delegation.ts`), bound by `StudioAgentsProvider`. */
export const studioDelegationsToken: ServiceToken<Delegations> =
  createServiceToken<Delegations>('studio/delegations');
