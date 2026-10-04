export type ConfigMode = 'file' | 'managed' | 'external';

export type ActivationPolicy = 'eager' | 'lazy';

export type ViewMode = 'grid' | 'list';

export type DetailTab =
  | 'deployments'
  | 'logs'
  | 'releases'
  | 'development'
  | 'resources'
  | 'configuration'
  | 'settings';

export const DETAIL_TABS: readonly DetailTab[] = [
  'deployments',
  'releases',
  'logs',
  'development',
  'resources',
  'configuration',
  'settings',
];

export interface ReleaseRecord {
  readonly id: string;
  readonly version: string;
  readonly size: number;
  readonly checksum: string;
  readonly hasConfigTemplate: boolean;
  readonly createdAt: string;
}

export interface DeploymentRecord {
  readonly release: {
    readonly version: string;
    readonly checksum: string;
  } | null;
  readonly id: string;
  readonly releaseId: string;
  readonly kind: 'deploy' | 'rollback';
  readonly status:
    'queued' | 'deploying' | 'succeeded' | 'failed' | 'cancelled';
  readonly phase: string;
  readonly config: { readonly mode: 'file' | 'external' };
  readonly cacheHit: boolean | null;
  readonly error: string | null;
  readonly createdAt: string;
}

export interface AppDetail {
  readonly enabled: boolean;
  readonly hasReleases: boolean;
  readonly hasPendingDeployment: boolean;
  readonly currentVersion: string | null;
  readonly app: {
    readonly id: string;
    readonly name: string;
    readonly updatedAt: string;
    readonly currentDeploymentId: string | null;
  };
  readonly deployments: readonly DeploymentRecord[];
  readonly runtime: {
    readonly hostAvailable: boolean;
    // Mirrors HubObservedState on the server. A wider type here let the status mapping compare against deployment
    // statuses the runtime never reports.
    readonly state: 'pending' | 'running' | 'stopped' | 'failed' | 'unknown';
  };
  readonly deployment: {
    readonly desiredReleaseId: string | null;
    readonly observedReleaseId: string | null;
    readonly observedState: string;
    readonly activation: ActivationPolicy;
    readonly basePath: string;
    readonly updatedAt: string;
  };
  readonly releases: readonly ReleaseRecord[];
  readonly hostUrl: string | null;
}

export interface ApiResponse<T> {
  readonly data: T;
}

export interface AppSummary {
  readonly app: AppDetail['app'];
  readonly runtime: AppDetail['runtime'];
  readonly currentVersion: string | null;
  readonly hasReleases: boolean;
  readonly hasPendingDeployment: boolean;
  readonly enabled: boolean;
  readonly startupMode: ActivationPolicy;
}

export type AppOverview = Omit<AppDetail, 'releases' | 'deployments'>;

/** The `meta` of a list paged by page number. */
export interface PageMeta {
  readonly page: number;
  readonly pageSize: number;
  readonly total: number;
}

/** A list response: the items, and what the server says about the list in `meta`. */
export interface ListResponse<T, M = PageMeta> {
  readonly data: readonly T[];
  readonly meta: M;
}

export interface ConfigResponse {
  readonly mode: 'file' | 'external';
  readonly content: string | null;
}

export interface ConfigTemplateResponse {
  readonly content: string | null;
}

export type ResourceKind = 'databases' | 'drives' | 'caching' | 'llm';

export interface ResourceSummary {
  readonly key: string;
  readonly type: string;
  readonly isDefault: boolean;
  readonly details: readonly ResourceDetail[];
}

export interface ResourceDetail {
  readonly label: string;
  readonly value: string;
}

export interface ConfigChangeSummary {
  readonly added: number;
  readonly removed: number;
  readonly sourceChanged: boolean;
  readonly unchanged: boolean;
}

export type DiffLine = {
  readonly id: string;
  readonly kind: 'unchanged' | 'added' | 'removed';
  readonly value: string;
};
