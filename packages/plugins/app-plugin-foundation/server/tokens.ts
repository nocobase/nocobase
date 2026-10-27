import {
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';

import type {
  FoundationOverview,
  FoundationCollectionPage,
} from '../shared/foundation.js';

export interface FoundationOverviewOptions {
  /** Collects again instead of answering a result younger than the cache lifetime. */
  readonly refresh?: boolean;
  /** Explicitly count rows in observed tables outside the known system catalog. Ordinary refreshes retain the last known count. */
  readonly countRecords?: boolean;
}

/** What the application uses of NocoBase Core, collected by this plugin alone. Read-only. */
export interface FoundationService {
  overview(options?: FoundationOverviewOptions): Promise<FoundationOverview>;
  collections(options: {
    readonly offset: number;
    readonly search: string;
  }): Promise<FoundationCollectionPage | undefined>;
}

export const foundationServiceToken: ServiceToken<FoundationService> =
  createServiceToken<FoundationService>(
    '@nocobase/app-plugin-foundation/service',
  );
