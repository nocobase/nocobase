import {
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';

import type { FoundationOverview } from '../shared/foundation.js';

export interface FoundationOverviewOptions {
  /** Collects again instead of answering a result younger than the cache lifetime. */
  readonly refresh?: boolean;
}

/** What the application uses of NocoBase Core, collected by this plugin alone. Read-only. */
export interface FoundationService {
  overview(options?: FoundationOverviewOptions): Promise<FoundationOverview>;
}

export const foundationServiceToken: ServiceToken<FoundationService> =
  createServiceToken<FoundationService>(
    '@nocobase/app-plugin-foundation/service',
  );
