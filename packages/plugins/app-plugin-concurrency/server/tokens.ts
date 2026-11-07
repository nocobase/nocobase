import {
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';
import type { ConcurrencyService } from '../shared/types.js';
export const concurrencyServiceToken: ServiceToken<ConcurrencyService> =
  createServiceToken<ConcurrencyService>(
    '@nocobase/app-plugin-concurrency/service',
  );
