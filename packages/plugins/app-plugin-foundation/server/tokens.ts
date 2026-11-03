import {
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';

import type {
  FoundationOverview,
  FoundationCollectionPage,
  FoundationSnapshot,
  FoundationScanStatus,
} from '../shared/foundation.js';

export interface FoundationOverviewOptions {
  /** Submits a background scan and returns the last saved result without waiting. */
  readonly refresh?: boolean;
  /** Explicitly count rows in observed tables outside the known system catalog. Ordinary refreshes retain the last known count. */
  readonly countRecords?: boolean;
}

/** What the application uses of NocoBase Core, collected by this plugin alone and saved privately. */
export interface FoundationService {
  overview(options?: FoundationOverviewOptions): Promise<FoundationOverview>;
  snapshot(): Promise<FoundationSnapshot>;
  scanStatus(): Promise<FoundationScanStatus>;
  ensureScan(options?: {
    readonly refresh?: boolean;
    readonly countRecords?: boolean;
  }): Promise<FoundationScanStatus>;
  collections(options: {
    readonly offset: number;
    readonly search: string;
  }): Promise<FoundationCollectionPage | undefined>;
}

export const foundationServiceToken: ServiceToken<FoundationService> =
  createServiceToken<FoundationService>(
    '@nocobase/app-plugin-foundation/service',
  );
