import {
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';

import type { IdGeneratorService } from '@nocobase/snowflake';
import type { IdGeneratorLifecycle } from './lifecycle.js';

export const idGeneratorToken: ServiceToken<IdGeneratorService> =
  createServiceToken<IdGeneratorService>('@nocobase/snowflake');

export const idGeneratorLifecycleToken: ServiceToken<IdGeneratorLifecycle> =
  createServiceToken<IdGeneratorLifecycle>(
    '@nocobase/app-server/id-generator/lifecycle',
  );
