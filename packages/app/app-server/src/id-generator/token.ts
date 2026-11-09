import {
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';

import type { IdGeneratorService } from '@nocobase/snowflake';

export const idGeneratorToken: ServiceToken<IdGeneratorService> =
  createServiceToken<IdGeneratorService>('@nocobase/snowflake');
