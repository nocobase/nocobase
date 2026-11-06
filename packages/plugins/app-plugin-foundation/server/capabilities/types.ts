import type { AppConfigAccessor } from '@nocobase/app-server/config';
import type { ServiceContainer } from '@nocobase/service-provider';

import type {
  FoundationCapabilityKey,
  FoundationFact,
  FoundationMetric,
  FoundationMetricUnit,
  FoundationPart,
  FoundationStatus,
} from '../../shared/foundation.js';
import type { Probe } from '../inventory.js';

export interface CollectorContext {
  /** Reads of the default connection; absent when the application runs without a database. */
  readonly probe: Probe | undefined;
  readonly container: ServiceContainer;
  readonly config: Pick<AppConfigAccessor, 'get'>;
  /** The application's package name, which its own migrations are recorded under. */
  readonly applicationName: string | undefined;
  /** Whether the application ships a client the NocoBase client runtime serves. */
  readonly hasClient: boolean;
  /** Exact business row counts are opt-in because every business table must be queried. */
  readonly countRecords?: boolean;
  /** Publish completed evidence so a later timeout cannot discard it. Does not start any additional reads. */
  readonly report?: (findings: CapabilityFindings) => void;
}

/** What one capability's collector established. The service adds packages, completeness and issues. */
export interface CapabilityFindings {
  /** Unknown when no execution path can be confirmed and a required read failed. */
  readonly status: FoundationStatus | null;
  readonly reason?: string;
  readonly facts?: readonly FoundationFact[];
  readonly metrics?: readonly FoundationMetric[];
  readonly parts?: readonly FoundationPart[];
}

export interface CapabilityCollector {
  readonly key: FoundationCapabilityKey;
  /** The NocoBase packages that provide it; only those the application resolves are reported. */
  readonly packages: readonly string[];
  collect(context: CollectorContext): Promise<CapabilityFindings>;
}

export function metric(
  key: string,
  value: number | null,
  options: {
    readonly unit?: FoundationMetricUnit;
    readonly complete?: boolean;
  } = {},
): FoundationMetric {
  return {
    key,
    value,
    unit: options.unit ?? 'count',
    complete: value !== null && (options.complete ?? true),
  };
}

export function fact(
  code: string,
  params?: FoundationFact['params'],
): FoundationFact {
  return params === undefined ? { code } : { code, params };
}

/** Sums the counts of the given keys in a per-status map. */
export function countOf(
  groups: ReadonlyMap<string, number> | null,
  keys: readonly string[],
): number | null {
  if (groups === null) return null;
  return keys.reduce((sum, key) => sum + (groups.get(key) ?? 0), 0);
}

/** A capability whose evidence lives in a database the application runs without. */
export const NO_DATABASE: CapabilityFindings = {
  status: 'unused',
  reason: 'noDatabase',
};
