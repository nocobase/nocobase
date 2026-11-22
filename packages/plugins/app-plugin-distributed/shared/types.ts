/** The plugin's URL namespace, which is also the domain of its error reasons. */
export const DISTRIBUTED_NAMESPACE = 'distributed';

/** The page whose access grant governs both the settings page and `GET /api/distributed/status`. */
export const DISTRIBUTED_STATUS_PAGE = 'distributed.status';

/** The grant the server checks and the client route declares, so hiding the entry and refusing the API are one grant. */
export const DISTRIBUTED_STATUS_ACCESS: {
  readonly resource: {
    readonly type: 'page';
    readonly id: 'distributed.status';
  };
  readonly action: 'access';
} = {
  resource: { type: 'page', id: DISTRIBUTED_STATUS_PAGE },
  action: 'access',
} as const;

/** The services whose backend decides whether two instances see the same state. */
export const DISTRIBUTED_SERVICES = [
  'caching',
  'concurrency',
  'jobs',
  'queue',
  'realtime',
] as const;

export type DistributedServiceKey = (typeof DISTRIBUTED_SERVICES)[number];

/** `shared` reaches every instance, `local` stays in this process, `unknown` was not declared by the adapter. */
export type DistributedSharing = 'local' | 'shared' | 'unknown';

/** `default` is a code default; `configured` is set by the application's configuration file or environment. */
export type DistributedSource = 'default' | 'configured';

export interface DistributedBackend {
  readonly name: string;
  readonly adapter: string;
  readonly sharing: DistributedSharing;
  readonly registered: boolean;
}

export interface DistributedSelection {
  /** Who chose the backend, such as a jobs scope or a queue name; absent when the service cannot tell. */
  readonly consumer?: string;
  readonly backend: string;
}

export interface DistributedService {
  readonly key: DistributedServiceKey;
  /** Whether this application runs the service at all. */
  readonly available: boolean;
  /** The configuration path that selects the default backend, such as `queue.default`. */
  readonly configPath: string;
  readonly source: DistributedSource;
  /** The default backend's configured name; `null` when nothing is configured and the built-in backend runs. */
  readonly default: string | null;
  readonly adapter: string;
  readonly sharing: DistributedSharing;
  readonly registered: boolean;
  readonly backends: readonly DistributedBackend[];
  readonly selections: readonly DistributedSelection[];
}

export interface DistributedIdGeneration {
  /** `auto` when a plugin assigns each instance its worker ID, `manual` when `snowflake.workerId` is fixed. */
  readonly mode: 'auto' | 'manual';
  readonly workerId: number | null;
  readonly source: DistributedSource;
}

export type DistributedCheckLevel = 'required' | 'recommended' | 'ok';

export type DistributedCheckParam = string | number | readonly string[];

export interface DistributedCheckResult {
  /** Stable id; the page translates built-in ids and shows `title` and `detail` for others. */
  readonly id: string;
  readonly level: DistributedCheckLevel;
  /** English fallback text. */
  readonly title: string;
  readonly detail: string;
  /** Values the translated text interpolates. */
  readonly params?: Readonly<Record<string, DistributedCheckParam>>;
  readonly fix?: {
    readonly text: string;
    /** A configuration fragment with placeholders, never a real address or credential. */
    readonly snippet?: string;
  };
}

export interface DistributedStatus {
  /**
   * `multi` when the configuration already shows the intent to run several instances: a shared backend or automatic
   * worker IDs. Required checks then block scaling out; with `single`, nothing needs to change.
   */
  readonly mode: 'single' | 'multi';
  readonly services: readonly DistributedService[];
  readonly idGeneration: DistributedIdGeneration;
  readonly checks: readonly DistributedCheckResult[];
  /** Data other plugins add through `distributedStatusToken`, by key. */
  readonly extensions: Readonly<Record<string, unknown>>;
}
