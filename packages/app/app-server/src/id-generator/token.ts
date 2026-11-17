import {
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';

import type { IdGeneratorService } from '@nocobase/snowflake';

export const idGeneratorToken: ServiceToken<IdGeneratorService> =
  createServiceToken<IdGeneratorService>('@nocobase/snowflake');

/** Optional synchronous ID implementation, initialized before consumers boot. */
export interface IdGeneratorImplementation extends IdGeneratorService {
  /** May share a sticky initialization promise with an earlier database task hook. */
  initialize(): Promise<void>;
}

/** Register at most one implementation per application, during provider registration. */
export const idGeneratorImplementationToken: ServiceToken<IdGeneratorImplementation> =
  createServiceToken<IdGeneratorImplementation>(
    '@nocobase/app-server/id-generator/implementation',
  );
