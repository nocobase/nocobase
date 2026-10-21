/**
 * The contract between the server, which collects what an application uses of NocoBase Core, and the page that shows
 * it. Values here are shared by both sides; everything else is a type, so nothing from `server/` reaches the browser.
 */

/** Built-in collector adapters, in their preferred display order; this is not the universe of available capabilities. */
export const FOUNDATION_CAPABILITIES = [
  'dataModeling',
  'files',
  'usersAndOrganizations',
  'permissions',
  'workflows',
  'aiAgents',
  'knowledge',
  'mail',
  'notifications',
  'integrations',
  'interface',
  'audit',
  'operations',
] as const;

export type FoundationBuiltinCapabilityKey =
  (typeof FOUNDATION_CAPABILITIES)[number];
export type FoundationCapabilityKey = string;

/**
 * `active`: the application uses it now. `needsSetup`: it is wired in but a required piece of configuration is missing.
 * `unused`: not wired in, not enabled, or not provided. A capability whose collection failed has no status (`null`): a
 * failure is never reported as `unused`.
 */
export type FoundationStatus = 'active' | 'needsSetup' | 'unused';

export const FOUNDATION_STATUSES: readonly FoundationStatus[] = [
  'active',
  'needsSetup',
  'unused',
];

/** How much of a capability's evidence could be read this time. */
export type FoundationCompleteness = 'complete' | 'partial' | 'failed';

/** A name as the application stores it: plain text, or a translation key in a namespace the page may have loaded. */
export type FoundationText =
  string | { readonly key: string; readonly ns: string };

export type FoundationFactParam = string | number | readonly FoundationText[];

/**
 * One established fact about how the application uses a capability, such as "12 collections of its own". The page
 * words it from `code`; `params` carries the values the wording quotes.
 */
export interface FoundationFact {
  readonly code: string;
  readonly params?: Readonly<Record<string, FoundationFactParam>>;
}

export type FoundationMetricUnit = 'count' | 'bytes' | 'tokens';

export interface FoundationMetric {
  readonly key: string;
  /** Null when it could not be read; never a stand-in zero. */
  readonly value: number | null;
  readonly unit: FoundationMetricUnit;
  /** False when some of the sources it adds up could not be read, so the value is a lower bound. */
  readonly complete: boolean;
}

/** A part of a composite capability, such as accounts and organizations under users and organizations. */
export interface FoundationPart {
  readonly key: string;
  readonly status: FoundationStatus;
  readonly reason?: string;
}

export interface FoundationPackage {
  readonly name: string;
  /** The version the application actually resolves. */
  readonly version: string | null;
}

export type FoundationIssueCode =
  'COLLECTOR_FAILED' | 'COLLECTOR_TIMEOUT' | 'SOURCE_UNREADABLE';

/** Something that could not be read. `source` names a Collection or a service, never an error message. */
export interface FoundationIssue {
  readonly code: FoundationIssueCode;
  readonly source?: string;
}

export interface FoundationCapability {
  readonly key: FoundationCapabilityKey;
  readonly title?: FoundationText;
  readonly description?: string;
  readonly status: FoundationStatus | null;
  /** Why the capability needs setup or is unused, such as `noChannel`. */
  readonly reason?: string;
  readonly facts: readonly FoundationFact[];
  readonly metrics: readonly FoundationMetric[];
  readonly parts: readonly FoundationPart[];
  readonly packages: readonly FoundationPackage[];
  readonly completeness: FoundationCompleteness;
  readonly issues: readonly FoundationIssue[];
}

export interface FoundationOverview {
  readonly capabilities: readonly FoundationCapability[];
  /** Runtime-specific capability items; built-in adapter observations remain available above for existing consumers. */
  readonly availableCapabilities?: readonly FoundationCapability[];
  /** Additive for clients receiving an overview from an older server. */
  readonly inventory?: FoundationProviderInventory;
  /** Static integration evidence; the browser joins this with the current registered navigation. */
  readonly moduleSources?: FoundationModuleSources;
  /** When this result was collected, RFC 3339. A cached result keeps its original time. */
  readonly checkedAt: string;
  /** The independent collection time of the last successful, explicitly requested business row count. */
  readonly recordCountCheckedAt?: string;
  readonly durationMs: number;
  /** The database connection the statistics read: always the default one. */
  readonly connection: string;
}

/** One bounded, on-demand page of application-owned Collections. */
export interface FoundationCollectionPage {
  readonly items: readonly {
    readonly name: string;
    readonly title?: string;
    readonly kind: string;
  }[];
  readonly total: number;
}

export interface FoundationModuleSource {
  readonly packageName: string;
  readonly routeName: string;
  /** Value imports reachable from the page; type-only imports and installed-only packages are excluded. */
  readonly providers: readonly string[];
  readonly apiProviders?: readonly string[];
  readonly collections?: readonly string[];
  readonly complete: boolean;
}

export interface FoundationModuleSources {
  readonly routes: readonly FoundationModuleSource[];
  readonly complete: boolean;
}

export interface FoundationModuleLink {
  readonly capability: FoundationCapabilityKey;
  readonly evidence: readonly (
    | 'page'
    | 'authentication'
    | 'authorization'
    | 'provider'
    | 'source'
    | 'apiSource'
  )[];
  readonly providers: readonly string[];
  readonly collections?: readonly string[];
}

export interface FoundationBusinessModule {
  readonly id: string;
  readonly title: FoundationText;
  readonly pageCount: number;
  readonly complete: boolean;
  readonly links: readonly FoundationModuleLink[];
}

/** Package discovery and usage detection are deliberately separate facts. */
export interface FoundationProviderEntry {
  readonly name: string;
  readonly displayName?: string;
  readonly description?: string;
  readonly version: string | null;
  readonly installed: boolean;
  readonly kind: 'core' | 'plugin';
  /** An explicit Foundation catalog entry, never inferred from an npm scope or a license string. */
  readonly origin: 'nocobase' | 'unverified';
  readonly categories: readonly FoundationCapabilityKey[];
  /** Only public, current runtime contributions prove registration; absence means unknown, not disabled. */
  readonly registration: 'observed' | 'unknown';
  readonly evidence: readonly (
    | 'manifest'
    | 'databaseContribution'
    | 'apiContribution'
    | 'foundationRuntime'
    | 'serverRegistration'
    | 'clientContribution'
  )[];
}

export interface FoundationProviderInventory {
  readonly entries: readonly FoundationProviderEntry[];
  readonly complete: boolean;
  /** Symbolic sources only: never paths, dependency URLs, credentials or raw errors. */
  readonly unreadable: readonly string[];
  /** Whether the host supplied its complete explicit Server registration snapshot. */
  readonly serverRegistrationsComplete?: boolean;
}

/** The key numbers above the capability details, each one a metric of a capability. */
export const FOUNDATION_HIGHLIGHTS: readonly {
  readonly capability: FoundationCapabilityKey;
  readonly metric: string;
}[] = [
  { capability: 'dataModeling', metric: 'businessRecords' },
  { capability: 'usersAndOrganizations', metric: 'accounts' },
  { capability: 'permissions', metric: 'grants' },
  { capability: 'workflows', metric: 'transitions' },
  { capability: 'notifications', metric: 'acceptedDeliveries' },
  { capability: 'operations', metric: 'migrations' },
];

/** The URL namespace of the plugin's routes and the domain of its errors. */
export const FOUNDATION_NAMESPACE = 'foundation';

/** The i18n namespace of the plugin's wording. */
export const FOUNDATION_I18N_NAMESPACE = '@nocobase/app-plugin-foundation';
