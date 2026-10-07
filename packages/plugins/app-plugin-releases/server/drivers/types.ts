/**
 * Deployment targets. An environment names a driver and holds its connection settings and credentials; the plugin
 * opens one session per environment and asks it to apply, start, stop and remove Apps. The plugin keeps the desired
 * state (Apps, releases, deployments, configuration) in its own tables; a driver only makes it real and reports what
 * runs. The plugin's driver deploys through App Hosts (`drivers/host`), whose activation backends run Apps in process
 * or in Docker containers; an application may register another driver on `releasesDriversToken`.
 */
import type { Readable } from 'node:stream';

import type { JournalPage, JournalQuery } from '@nocobase/logging';

export interface I18nText {
  readonly key: string;
  readonly ns: string;
}

export interface DriverCapabilities {
  /**
   * Whether the driver honours an App's runtime policy: `onDemand` activation (a request starts a stopped App), the
   * idle stop and dormancy. Without it the policy is stored but the App runs as `eager` with no timers.
   */
  readonly onDemand?: boolean;
  /** Whether `logs` returns the App's runtime log. */
  readonly logs: boolean;
  /** How public URLs are formed: a path under one origin, or a subdomain per App. */
  readonly urlModes: readonly ('path' | 'subdomain')[];
  /**
   * Whether the driver runs release images pulled by digest (`AppDeploymentSpec.images`, image releases) and reports
   * what it ran (`DeploymentEvent.artifact`). Without it, it runs release archives, recorded as `tarball`.
   */
  readonly images?: boolean;
}

/** The environment as a driver sees it: settings, decrypted credentials and the URL rule. */
export interface DriverEnvironment {
  readonly id: string;
  readonly name: string;
  readonly config: Readonly<Record<string, unknown>>;
  /** Decrypted write-only credentials, or null when none are stored. */
  readonly secret: Readonly<Record<string, unknown>> | null;
  /** URL pattern with `{appId}`, or null for the driver's default. */
  readonly publicUrl: string | null;
}

/** What the plugin offers a session besides the environment. */
export interface DriverContext {
  /**
   * The complete desired set for this environment, read fresh from the plugin's tables. A driver whose backend
   * restarts (the Host child, a daemon) calls it and re-applies the result.
   */
  desired(): Promise<readonly AppDeploymentSpec[]>;
}

export interface DeploymentDriver {
  /** `host`, `docker`, `kubernetes`, …: what `Environment.driver` names. */
  readonly kind: string;
  readonly title: I18nText;
  /** JSON Schema of the non-secret `Environment.config`. */
  readonly configSchema: Readonly<Record<string, unknown>>;
  /** JSON Schema of the write-only credentials (TLS keys, kubeconfig, tokens), when the driver takes any. */
  readonly secretSchema?: Readonly<Record<string, unknown>>;
  /** What the driver can do with any of its settings. */
  readonly capabilities: DriverCapabilities;
  /** What it can do with one environment's settings, when that depends on them (the Host driver's run mode). */
  capabilitiesOf?(
    config: Readonly<Record<string, unknown>>,
  ): DriverCapabilities;
  /** The settings key `capabilitiesOf` reads, with the capabilities of each value, for forms that change it. */
  readonly variants?: {
    readonly key: string;
    readonly capabilities: Readonly<Record<string, DriverCapabilities>>;
  };
  /**
   * How the application configured the driver itself (not per environment), shown read-only with an environment's
   * settings. Never put credentials here: every reader of environments sees it.
   */
  readonly facts?: Readonly<Record<string, unknown>>;
  /** Refuses settings the driver cannot use, before they are saved. */
  validate?(
    config: Readonly<Record<string, unknown>>,
    secret: Readonly<Record<string, unknown>> | null,
  ): void | Promise<void>;
  open(
    environment: DriverEnvironment,
    context: DriverContext,
  ): Promise<DriverSession>;
}

/** The release archive a deployment applies, read from the plugin's artifact storage. */
export interface ArtifactSource {
  /** Storage key on the plugin's artifact disk (a driver sharing that disk may resolve it directly). */
  readonly key: string;
  readonly checksum: string;
  readonly version: string;
  readonly size: number;
  open(): Promise<Readable>;
}

export type DeploymentConfig =
  | {
      readonly mode: 'file';
      readonly content: string;
      /** Changes whenever the content does; the deployment ID. */
      readonly revision: string;
    }
  | { readonly mode: 'external' };

export interface AppDeploymentSpec {
  readonly deploymentId: string;
  readonly appId: string;
  readonly kind: 'deploy' | 'rollback';
  readonly release: {
    readonly id: string;
    readonly version: string;
    readonly checksum: string;
  };
  /** The release archive, for an archive release; absent for an image release, which runs `images`. */
  readonly artifact?: ArtifactSource;
  readonly config: DeploymentConfig;
  /**
   * The App's environment variables for this deployment: its environment's and its own, with what release management
   * generated. A driver gives them to the App alone (never to the process that runs it, and never to a log), and puts
   * the variables it sets itself after them, so none of these replaces one.
   */
  readonly env?: Readonly<Record<string, string>>;
  readonly desiredState: 'running' | 'stopped';
  /** `onDemand`: a restarted runtime leaves the App stopped until its first request. */
  readonly activation: 'eager' | 'onDemand';
  /** Stop the App after this many minutes without a request (null: never). */
  readonly idleStopMinutes: number | null;
  /** Remove its expanded release after this many hours without a request (null: never); configuration and data stay. */
  readonly dormantAfterHours: number | null;
  /**
   * For a driver with `images`: the release's images (in the environment's registry when it names one), one per
   * platform, to pull by digest.
   */
  readonly images?: readonly ImageArtifact[];
  /** The registry's pull credentials for `images`; absent for anonymous pulls. */
  readonly registryAuth?: RegistryAuth;
}

/** A release's image: its repository (without tag or digest), digest and platform. */
export interface ImageArtifact {
  readonly ref: string;
  readonly digest: string;
  readonly platform: string;
}

/** Credentials for a registry, as Docker's `X-Registry-Auth` carries them. */
export interface RegistryAuth {
  /** The registry host (`ghcr.io`, `localhost:5000`). */
  readonly serveraddress: string;
  readonly username?: string;
  readonly password?: string;
}

/** A progress entry while a deployment runs; it is written to the deployment log as it arrives. */
export interface DeploymentEvent {
  readonly time?: string;
  readonly level?: string | number;
  /** A `DeploymentPhase` the plugin records; other values are only logged. */
  readonly phase?: string;
  readonly msg?: string;
  /** Increasing per deployment; the plugin drops repeats. */
  readonly sequence?: number;
  /**
   * What the target runs for this deployment, from a driver with `images`, once it knows: the image it pulled by
   * digest. The plugin records it on the deployment.
   */
  readonly artifact?: {
    readonly kind: 'image';
    readonly ref: string;
    readonly digest: string;
    readonly platform: string;
  };
  readonly [key: string]: unknown;
}

export interface AppObservedStatus {
  /** `starting` and `dormant` only from a driver with `onDemand`. */
  readonly state:
    | 'pending'
    | 'running'
    | 'starting'
    | 'stopped'
    | 'dormant'
    | 'failed'
    | 'unknown';
  readonly version: string | null;
  readonly deploymentId: string | null;
  readonly startedAt: string | null;
  readonly error: string | null;
  /** The App's last request (or start), when the driver knows it. */
  readonly lastAccessedAt?: string | null;
}

export interface DriverSession {
  /** Whether the target is reachable and usable with these settings. */
  check(): Promise<{
    readonly ok: boolean;
    readonly message?: string;
    readonly details?: Readonly<Record<string, unknown>>;
  }>;
  /**
   * Deploys or rolls back one App and resolves once it runs or has failed; on failure the previous version keeps
   * running. A `failed` state resolves rather than throws.
   */
  apply(
    spec: AppDeploymentSpec,
    onEvent?: (event: DeploymentEvent) => void,
  ): Promise<AppObservedStatus>;
  /** Starts the App's current deployment. */
  start(spec: AppDeploymentSpec): Promise<AppObservedStatus>;
  stop(appId: string): Promise<AppObservedStatus>;
  restart(appId: string): Promise<AppObservedStatus>;
  /** Removes the App from the target; with `purgeData`, its volumes and data too. */
  remove(
    appId: string,
    options: { readonly purgeData: boolean },
  ): Promise<void>;
  /** Observed state of the given Apps (all known when omitted); an App the target does not know is absent. */
  status(
    appIds?: readonly string[],
  ): Promise<ReadonlyMap<string, AppObservedStatus>>;
  /** Sends the complete desired set, after the plugin starts or the backend restarted. */
  restore(desired: readonly AppDeploymentSpec[]): Promise<void>;
  /** Applies new file configuration to a running App without a new deployment, when the target can. */
  reloadConfig?(appId: string, content: string): Promise<void>;
  logs(appId: string, query: JournalQuery): Promise<JournalPage>;
  /**
   * The recorded outcome of a deployment a previous process of this application left `deploying`, answered promptly
   * from what the target keeps (the App Host's operation log): `running` means it succeeded, another state that it
   * failed, null that the target never saw it or forgot it, which marks it interrupted. The plugin asks before it sends
   * the environment its desired set again, so a deployment that finished while this application restarted is restored
   * as the App's current one. Without it, every deployment a restart cut short is marked interrupted.
   */
  operation?(deployment: {
    readonly deploymentId: string;
    readonly appId: string;
  }): Promise<AppObservedStatus | null>;
  /** Absolute public URL, or null when the environment has no reachable address yet. */
  url(appId: string): string | null;
  close(): Promise<void>;
}

/** The drivers an application offers; environments can only name a registered kind. */
export interface DriverRegistry {
  register(driver: DeploymentDriver): () => void;
  get(kind: string): DeploymentDriver | undefined;
  list(): readonly DeploymentDriver[];
}

export function createDriverRegistry(): DriverRegistry {
  const drivers = new Map<string, DeploymentDriver>();
  return {
    register(driver) {
      if (!/^[a-z][a-z0-9-]{0,31}$/.test(driver.kind))
        throw new TypeError(`Invalid driver kind "${driver.kind}".`);
      if (drivers.has(driver.kind))
        throw new Error(
          `A deployment driver "${driver.kind}" is already registered.`,
        );
      drivers.set(driver.kind, driver);
      return () => {
        if (drivers.get(driver.kind) === driver) drivers.delete(driver.kind);
      };
    },
    get: (kind) => drivers.get(kind),
    list: () => [...drivers.values()],
  };
}

/** What a driver can do with an environment's settings. */
export function capabilitiesFor(
  driver: DeploymentDriver,
  config: Readonly<Record<string, unknown>>,
): DriverCapabilities {
  return driver.capabilitiesOf?.(config) ?? driver.capabilities;
}

/** Expands an environment's URL pattern for one App. */
export function expandPublicUrl(pattern: string, appId: string): string {
  return pattern.replaceAll('{appId}', encodeURIComponent(appId));
}
