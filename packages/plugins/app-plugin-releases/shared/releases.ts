/**
 * The records the HTTP API returns and the client renders. The server keeps more on its rows (artifact keys, config
 * file paths, encrypted credentials); these are what leaves it.
 */

import type { AppAction } from './access.js';

/**
 * Who performed an operation. `human` is a signed-in person, `agent` a person's agent acting for them (the assembling
 * application marks it), `key` an API key with a scope, a service account's key or an upload ticket, `rule` an automation of the assembling
 * application, `system` the plugin or the assembling application acting on its own (an installation's setup).
 */
export type ActorKind = 'human' | 'agent' | 'key' | 'rule' | 'system';

export const ACTOR_KINDS: readonly ActorKind[] = [
  'human',
  'agent',
  'key',
  'rule',
  'system',
];

/** Opaque key/value labels the assembling application attaches and filters by (`issue=FG-12`, `branch=main`). */
export type Labels = Readonly<Record<string, string>>;

/** A label name: a letter or digit, then letters, digits, `.`, `_`, `/` or `-`, at most 63 characters. */
export const LABEL_KEY_PATTERN: RegExp = /^[A-Za-z0-9][A-Za-z0-9._/-]{0,62}$/;
export const MAX_LABELS = 32;
export const MAX_LABEL_VALUE_LENGTH = 255;

/**
 * What the runtime reports. `starting`: a stopped App is being started by a request; `dormant`: stopped, with its
 * expanded release removed until a request prepares it again (both only on a driver with `onDemand`).
 */
export type ObservedState =
  | 'pending'
  | 'running'
  | 'starting'
  | 'stopped'
  | 'dormant'
  | 'failed'
  | 'unknown';

/**
 * When an App runs. `eager`: started when deployed and whenever the runtime restarts. `onDemand`: started by its first
 * request after a deployment or a runtime restart. Either may stop after `idleStopMinutes` without a request (the next
 * request starts it again) and become dormant after `dormantAfterHours` without one.
 */
export type AppActivation = 'eager' | 'onDemand';

export const APP_ACTIVATIONS: readonly AppActivation[] = ['eager', 'onDemand'];

/** Bounds of the idle and dormancy policies. */
export const APP_POLICY_LIMITS: {
  readonly idleStopMinutes: { readonly min: number; readonly max: number };
  /** Hours; fractions are accepted (0.05 is three minutes). */
  readonly dormantAfterHours: { readonly min: number; readonly max: number };
} = {
  idleStopMinutes: { min: 1, max: 10_080 },
  dormantAfterHours: { min: 1 / 60, max: 8_760 },
};

/** The runtime policy of an App, as created or changed. `null` turns a timer off. */
export interface AppRuntimePolicy {
  readonly activation: AppActivation;
  /** Stop the App after this many minutes without a request; null never stops it for idleness. */
  readonly idleStopMinutes: number | null;
  /**
   * After this many hours without a request, also remove its expanded release (configuration and data stay); the next
   * request prepares it again. Null never does.
   */
  readonly dormantAfterHours: number | null;
}

export type DeploymentStatus = 'queued' | 'deploying' | 'succeeded' | 'failed';

export type DeploymentPhase =
  | 'queued'
  | 'resolving'
  | 'verifying'
  | 'extracting'
  | 'preparing'
  | 'starting'
  | 'health_check'
  | 'switching'
  | 'cleaning'
  | 'completed';

export type ConfigMode = 'file' | 'external';

export interface DriverCapabilitiesView {
  readonly onDemand: boolean;
  readonly logs: boolean;
  readonly urlModes: readonly ('path' | 'subdomain')[];
  /** Whether the driver runs a release's OCI image pulled by digest when its environment has a registry. */
  readonly images: boolean;
}

export interface DriverSummary {
  readonly kind: string;
  readonly title: { readonly key: string; readonly ns: string };
  readonly configSchema: Readonly<Record<string, unknown>>;
  readonly secretSchema: Readonly<Record<string, unknown>> | null;
  readonly capabilities: DriverCapabilitiesView;
  /**
   * When what the driver can do depends on one setting (the Host driver's run mode, `backend`): that key and the
   * capabilities of each value; null otherwise.
   */
  readonly variants: {
    readonly key: string;
    readonly capabilities: Readonly<Record<string, DriverCapabilitiesView>>;
  } | null;
  /**
   * How the application configured the driver itself, shown read-only beside an environment's settings (the Host's
   * environment allowlist and launch prefix, for example); null when the driver reports nothing.
   */
  readonly facts: Readonly<Record<string, unknown>> | null;
}

/**
 * What an environment runs, from its driver and settings: release archives uploaded to it (`archives`), release images
 * CI registers (`images`; an environment runs one or the other), and the runtime policy (`onDemand`). A driver this
 * application no longer has runs nothing.
 */
export interface EnvironmentCapabilities {
  readonly archives: boolean;
  readonly images: boolean;
  readonly onDemand: boolean;
}

export interface EnvironmentRecord {
  readonly id: string;
  readonly name: string;
  readonly driver: string;
  /** Driver connection settings without credentials. */
  readonly config: Readonly<Record<string, unknown>>;
  /** Whether write-only credentials are stored; they are never returned. */
  readonly hasSecret: boolean;
  /** Names of the stored credentials, so a form can say which are set; their values are never returned. */
  readonly secretKeys: readonly string[];
  /** Public URL pattern with `{appId}`, or null for the driver's default. */
  readonly publicUrl: string | null;
  /**
   * Every deployment here goes through a deployment request a person other than the requester approves, typing the App
   * ID again; nothing deploys directly.
   */
  readonly protected: boolean;
  /**
   * Opaque approver references the assembling application resolves (`ReleasesAccess.approversOf`); with none, the
   * people holding `deploy-protected` on the App approve.
   */
  readonly approvers: readonly string[];
  readonly maxApps: number | null;
  /**
   * The runtime policy an App created here without its own takes: stop after this many minutes without a request, and
   * become dormant after this many hours (null: never).
   */
  readonly defaultIdleStopMinutes: number | null;
  readonly defaultDormantAfterHours: number | null;
  /**
   * The image registry a Docker environment pulls release images from (`RegistryRecord.id`), with its pull
   * credentials; null pulls anonymously.
   */
  readonly registryId: string | null;
  readonly capabilities: EnvironmentCapabilities;
  /** An App's first deployment here loads its sample data (`APP_SAMPLE_DATA=true`, generated). */
  readonly sampleDataOnFirstDeploy: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface EnvironmentInput {
  readonly id?: string;
  readonly name?: string;
  readonly driver?: string;
  readonly config?: Record<string, unknown>;
  /** Replaces the stored credentials; `null` clears them; omitted keeps them. */
  readonly secret?: Record<string, unknown> | null;
  /**
   * Changes some credentials and keeps the rest: a value replaces that credential, `null` removes it. Applied after
   * `secret` when both are given.
   */
  readonly secretChanges?: Record<string, unknown>;
  readonly publicUrl?: string | null;
  readonly protected?: boolean;
  readonly approvers?: readonly string[];
  readonly maxApps?: number | null;
  readonly defaultIdleStopMinutes?: number | null;
  readonly defaultDormantAfterHours?: number | null;
  readonly registryId?: string | null;
  readonly sampleDataOnFirstDeploy?: boolean;
}

/** Settings to try before they are saved (`POST environments/check`). */
export interface EnvironmentCheckInput {
  /** The environment being edited, whose stored credentials fill in the ones not changed; omitted for a new one. */
  readonly id?: string;
  readonly name?: string;
  readonly driver: string;
  readonly config?: Record<string, unknown>;
  readonly secret?: Record<string, unknown> | null;
  readonly secretChanges?: Record<string, unknown>;
  readonly publicUrl?: string | null;
}

/** What a driver's `check()` reported. */
export interface EnvironmentCheckResult {
  readonly ok: boolean;
  readonly message?: string;
  readonly details?: unknown;
}

/**
 * An OCI image registry (OCI Distribution API): where an App's CI pushes release images and Docker environments pull
 * them by digest. The pull password is write-only.
 */
export interface RegistryRecord {
  readonly id: string;
  readonly name: string;
  /** `https://ghcr.io`, `http://localhost:5000`. */
  readonly url: string;
  /** The host images are named under (`ghcr.io`, `localhost:5000`). */
  readonly host: string;
  /** The path release images go under (`acme`, `team/apps`); null for the registry's root. */
  readonly namespace: string | null;
  readonly pullUsername: string | null;
  /** Which passwords are stored (`pullPassword`); their values are never returned. */
  readonly secretKeys: readonly string[];
  /** The environments that pull from it. */
  readonly environmentIds: readonly string[];
  readonly createdAt: string;
  readonly updatedAt: string;
}

export const REGISTRY_SECRET_KEYS = ['pullPassword'] as const;

export type RegistrySecretKey = (typeof REGISTRY_SECRET_KEYS)[number];

export interface RegistryInput {
  readonly id?: string;
  readonly name?: string;
  readonly url?: string;
  readonly namespace?: string | null;
  readonly pullUsername?: string | null;
  /** A password replaces the stored one, `null` removes it; a key left out keeps it. */
  readonly secretChanges?: Partial<Record<RegistrySecretKey, string | null>>;
}

/** What `POST registries/check` (and `registries/:registryId/check`) found, per credential. */
export interface RegistryCheckResult {
  readonly ok: boolean;
  readonly message?: string;
  readonly details?: {
    /** The registry answered `/v2/` without credentials. */
    readonly anonymous?: boolean;
    readonly pull?: 'ok' | 'failed' | 'notSet';
  };
}

/** A release's artifact: its archive (an archive release), or one of its OCI images (an image release). */
export type ReleaseArtifactView =
  | {
      readonly kind: 'tarball';
      readonly checksum: string;
      readonly size: number;
    }
  | {
      readonly kind: 'oci-image';
      readonly id: string;
      /** The repository, without tag or digest (`ghcr.io/acme/app`). */
      readonly ref: string;
      readonly digest: string;
      readonly platform: string;
      readonly sourceCommit: string | null;
      readonly createdBy: string | null;
      readonly createdVia: ActorKind;
      readonly createdAt: string;
    };

/**
 * `POST /apps/:appId/imageReleases`: an image CI built and pushed, registered by digest as a release of `version`.
 * The same digest again answers its release; another platform's image of the same version joins that release.
 */
export interface RegisterImageReleaseInput {
  readonly version: string;
  /** The repository, without tag or digest; a tag after the name is dropped. */
  readonly ref: string;
  readonly digest: string;
  /** `linux/amd64` when omitted. */
  readonly platform?: string;
  readonly sourceCommit?: string;
  /** The build that pushed it, such as a CI run's URL. */
  readonly build?: string;
  readonly labels?: Labels;
  /** The build's `dist/variables.json`, which an image carries no other way. */
  readonly variables?: ReleaseVariablesManifest;
}

/** What a deployment ran. `tarball`: the archive, in process; `image`: the release's image pulled by digest. */
export type DeploymentArtifact =
  | { readonly kind: 'tarball' }
  | {
      readonly kind: 'image';
      readonly ref: string;
      readonly digest: string;
      readonly platform: string;
    };

export interface RuntimeStatus {
  readonly available: boolean;
  readonly state: ObservedState;
  readonly version: string | null;
  readonly startedAt: string | null;
  readonly error: string | null;
  /** The last request the runtime saw (or its last start), when the driver reports it. */
  readonly lastAccessedAt: string | null;
}

export interface AppView {
  readonly id: string;
  readonly environmentId: string;
  readonly name: string;
  readonly description: string | null;
  readonly currentDeploymentId: string | null;
  readonly enabled: boolean;
  readonly activation: AppActivation;
  readonly idleStopMinutes: number | null;
  readonly dormantAfterHours: number | null;
  readonly labels: Labels;
  /** The App this App is a preview of, removed with it; null for any other App. */
  readonly previewOf: string | null;
  readonly createdBy: string | null;
  readonly createdVia: ActorKind;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface AppSummary {
  readonly app: AppView;
  readonly environment: {
    readonly id: string;
    readonly name: string;
    readonly protected: boolean;
    /** It runs release images CI registers (`acme release image`), so archives are not uploaded to it. */
    readonly runsImages: boolean;
  };
  readonly runtime: RuntimeStatus;
  readonly url: string | null;
  readonly currentVersion: string | null;
  readonly hasReleases: boolean;
  readonly hasPendingDeployment: boolean;
  /**
   * What the caller may do on this App, decided as the server decides each request (a `related` scope counts only on
   * the Apps the caller created or the application relates to them). Only the single-App read answers it.
   */
  readonly allowed?: readonly AppAction[];
  /**
   * The current release's variables: the required ones nothing supplies (`missing`), and whether a value changed since
   * the running deployment (`changed`; one read only on the first start does not count). Only the single-App read
   * answers it.
   */
  readonly variables?: {
    readonly missing: readonly string[];
    readonly changed: boolean;
  };
}

export interface AppPage {
  readonly items: readonly AppSummary[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
}

export interface CreateAppInput {
  readonly id: string;
  readonly name: string;
  readonly environmentId: string;
  readonly description?: string;
  readonly labels?: Labels;
  /** `eager` when omitted. */
  readonly activation?: AppActivation;
  /** Omitted: the environment's default; null: never stopped for idleness. */
  readonly idleStopMinutes?: number | null;
  /** Omitted: the environment's default; null: never dormant. */
  readonly dormantAfterHours?: number | null;
  /** Makes it a preview App of that App, removed with it. */
  readonly previewOf?: string;
}

export interface UpdateAppInput {
  readonly name?: string;
  readonly description?: string | null;
  readonly activation?: AppActivation;
  readonly idleStopMinutes?: number | null;
  readonly dormantAfterHours?: number | null;
  readonly labels?: Labels;
}

export type ReleaseKind = 'archive' | 'image';

export interface ReleaseView {
  readonly id: string;
  readonly appId: string;
  /**
   * `archive`: an uploaded `dist.tar.gz`, which in-process environments run; `image`: OCI images CI pushed, which
   * Docker environments pull by digest.
   */
  readonly kind: ReleaseKind;
  readonly version: string;
  /** The archive's SHA-256, or for an image release the hex of its first image's digest: the release's identity. */
  readonly checksum: string;
  /** The archive's size; null for an image release. */
  readonly size: number | null;
  readonly hasConfigTemplate: boolean;
  readonly labels: Labels;
  /** The release this one was promoted from, in another App. */
  readonly sourceReleaseId: string | null;
  /** The commit it was built from, when the build said so. */
  readonly sourceCommit: string | null;
  /** The build that produced it (a CI run, a build job), when the build said so. */
  readonly build: string | null;
  /** Its archive, or its images; answered by the release reads, not by uploads. */
  readonly artifacts?: readonly ReleaseArtifactView[];
  /**
   * What its variables manifest declares, and the required variables nothing supplies in its App; null for a build
   * without a manifest. Answered by the release list.
   */
  readonly variables?: {
    readonly declared: number;
    readonly required: number;
    readonly missing: readonly string[];
  } | null;
  readonly createdBy: string | null;
  readonly createdVia: ActorKind;
  readonly createdAt: string;
  /** Set when an upload or promotion answered with an existing release. */
  readonly reused?: boolean;
  /** The deployment an upload started, when it deployed. */
  readonly deploymentId?: string | null;
}

export interface DeploymentView {
  readonly id: string;
  readonly appId: string;
  readonly releaseId: string;
  readonly kind: 'deploy' | 'rollback';
  readonly rollbackTargetDeploymentId: string | null;
  readonly previousDeploymentId: string | null;
  readonly status: DeploymentStatus;
  readonly phase: DeploymentPhase;
  readonly configMode: ConfigMode;
  readonly error: string | null;
  readonly actorId: string | null;
  readonly actorKind: ActorKind;
  readonly requestId: string | null;
  readonly createdAt: string;
  readonly startedAt: string | null;
  readonly finishedAt: string | null;
  readonly release: {
    readonly version: string;
    readonly checksum: string;
  } | null;
  /** What the target ran, once the deployment got that far; null before, and for deployments that never started. */
  readonly artifact: DeploymentArtifact | null;
  /** Set when an idempotent request answered with an earlier deployment. */
  readonly reused?: boolean;
}

export interface DeploymentPage {
  readonly items: readonly DeploymentView[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
}

export interface DeployInput {
  readonly releaseId: string;
  /** Replaces the App's configuration for this deployment (file mode only). */
  readonly config?: { readonly mode: ConfigMode; readonly content?: string };
  readonly idempotencyKey?: string;
}

export interface RollbackInput {
  readonly deploymentId: string;
}

export type DeploymentRequestStatus =
  'pending' | 'approved' | 'rejected' | 'cancelled' | 'deployed' | 'failed';

export interface DeploymentRequestView {
  readonly id: string;
  readonly appId: string;
  readonly environmentId: string;
  /** The release it deploys, fixed when it was asked for: approving deploys exactly this release. */
  readonly releaseId: string;
  /** That release's checksum then; approval refuses a release whose bytes are not these. */
  readonly releaseChecksum: string;
  readonly kind: 'deploy' | 'rollback';
  readonly rollbackTargetDeploymentId: string | null;
  readonly status: DeploymentRequestStatus;
  readonly note: string | null;
  readonly labels: Labels;
  readonly requestedBy: string | null;
  readonly requestedVia: ActorKind;
  readonly decidedBy: string | null;
  readonly decidedAt: string | null;
  readonly decisionNote: string | null;
  readonly deploymentId: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  /** What the request deploys, as the request reads answer it; null when the release is gone. */
  readonly release?: DeploymentRequestRelease | null;
  /** Where it deploys, as the request reads answer it; null when the environment is gone. */
  readonly environment?: {
    readonly name: string;
    readonly protected: boolean;
  } | null;
  /** Whether the caller may approve or reject it now; answered by the request reads. */
  readonly decidable?: boolean;
}

export interface DeploymentRequestRelease {
  readonly version: string;
  /** The commit it was built from, when the build said so. */
  readonly sourceCommit: string | null;
  /** The build that produced it, such as a CI run's URL, when the build said so. */
  readonly build: string | null;
}

export interface CreateDeploymentRequestInput {
  readonly releaseId?: string;
  /** For a rollback request: the successful deployment to return to. */
  readonly rollbackToDeploymentId?: string;
  readonly note?: string;
  readonly labels?: Labels;
}

export interface UploadTicketView {
  readonly id: string;
  readonly appId: string;
  /** Shown once: `Authorization: Bearer <token>` on the upload request. */
  readonly token: string;
  /** API-relative path of the upload endpoint. */
  readonly path: string;
  readonly deploy: boolean;
  readonly expiresAt: string;
}

/**
 * What an App's `config.yml` shows in place of a secret value. Configuration leaves the server only with its secrets
 * replaced by this mask; content saved with the mask still in place keeps the stored value at that path.
 */
export const CONFIG_SECRET_MASK = '••••••••';

/** Where a value sits in `config.yml`: map keys and sequence indexes from the root (`['auth', 'secret']`). */
export type ConfigPath = readonly (string | number)[];

/** `auth.secret`, `apiKeys[0]`: how a path is shown. */
export function formatConfigPath(path: ConfigPath): string {
  return path
    .map((segment, index) =>
      typeof segment === 'number'
        ? `[${segment}]`
        : index === 0
          ? segment
          : `.${segment}`,
    )
    .join('');
}

/** A secret the configuration holds. Its value is never returned. */
export interface ConfigSecret {
  readonly path: ConfigPath;
}

/** A secret to set (`value`) or remove (`null`) at a path, applied after the content's masked values are restored. */
export interface ConfigSecretChange {
  readonly path: ConfigPath;
  readonly value: string | null;
}

export interface ConfigDocument {
  readonly mode: ConfigMode;
  /** `config.yml` with every secret value replaced by `CONFIG_SECRET_MASK`; null for an external configuration. */
  readonly content: string | null;
  /** The secrets `content` masks, in document order. */
  readonly secrets: readonly ConfigSecret[];
}

/** `PUT /apps/:appId/config`. */
export interface UpdateConfigInput {
  /** The whole `config.yml`. A masked value keeps the stored secret at its path. */
  readonly content: string;
  readonly secretChanges?: readonly ConfigSecretChange[];
}

/** The prefix of the one bearer credential the API accepts besides a session or an API key. */
export const UPLOAD_TICKET_PREFIX = 'rel_ticket_';

// --- Variables --------------------------------------------------------------------------------------------------

/** How a deployment can produce a value nobody set. */
export type VariableGenerator = 'secret' | 'secretKeys' | 'password';

/** One variable of a build's manifest (`dist/variables.json`, written by `pnpm build`). */
export interface ReleaseVariable {
  readonly name: string;
  /** The configuration path it sets; none for one the runtime reads itself (`runtime`). */
  readonly path?: string;
  readonly type?: string;
  readonly description?: string;
  readonly secret: boolean;
  readonly required: boolean;
  readonly hasDefault?: boolean;
  readonly exampleProvided?: boolean;
  readonly firstStartOnly: boolean;
  readonly generate: VariableGenerator | null;
  readonly runtime?: boolean;
}

/** A build's variables manifest. */
export interface ReleaseVariablesManifest {
  readonly schemaVersion: 1;
  readonly app?: { readonly name?: string; readonly version?: string };
  readonly generatedAt?: string;
  readonly variables: readonly ReleaseVariable[];
}

/** A variable name: an upper-case letter, then upper-case letters, digits and underscores. */
export const VARIABLE_NAME_PATTERN: RegExp = /^[A-Z][A-Z0-9_]{0,127}$/;

/** At most this many variables in a manifest. */
export const MAX_MANIFEST_VARIABLES = 200;

/** A variable's value is at most this many bytes. */
export const MAX_VARIABLE_VALUE_BYTES: number = 64 * 1024;

/** Names the runtime sets itself, which no variable may replace. */
export const RESERVED_VARIABLE_NAMES: readonly string[] = [
  'NODE_ENV',
  'APP_BASE_PATH',
  'APP_SERVER_HOST',
  'APP_SERVER_PORT',
  'APP_CONFIG_FILE',
  'PATH',
  'HOME',
];

/**
 * Where a variable's value comes from, strongest first: the App (`app`), the environment, the App's `config.yml`
 * (`configFile`, which a variable would override), release management (`generated`), the build's code defaults
 * (`default`); `unset` when nothing gives it one.
 */
export type VariableSource =
  'app' | 'environment' | 'configFile' | 'generated' | 'default' | 'unset';

/** A value as it is shown: a secret's never leaves the server, only whether it is set. */
export interface VariableValueView {
  readonly set: boolean;
  /** Null for a secret. */
  readonly value: string | null;
}

/** An environment's variable (`GET /environments/:environmentId/variables`). */
export interface EnvironmentVariableView extends VariableValueView {
  readonly name: string;
  readonly secret: boolean;
  readonly description: string | null;
  readonly updatedBy: string | null;
  readonly updatedAt: string;
}

/** `PUT /environments/:environmentId/variables/:name`. */
export interface SetEnvironmentVariableInput {
  readonly value: string;
  /** Inferred from the name when left out (`…_PASSWORD`, `…_SECRET`, `…_TOKEN`, `…_KEY`). */
  readonly secret?: boolean;
  readonly description?: string | null;
}

/** `PUT /apps/:appId/variables/:name`. */
export interface SetAppVariableInput {
  readonly value: string;
  readonly secret?: boolean;
}

/** One variable of an App, as the release in question declares it and as the App would get it. */
export interface AppVariableView {
  readonly name: string;
  /** The release's manifest declares it; an undeclared one is passed to the App all the same. */
  readonly declared: boolean;
  readonly description: string | null;
  readonly secret: boolean;
  readonly required: boolean;
  /** Read only on the first start: changing it later has no effect, and it never counts as changed. */
  readonly firstStartOnly: boolean;
  readonly generate: VariableGenerator | null;
  readonly source: VariableSource;
  /** The value it takes, when it is no secret; null otherwise. */
  readonly value: string | null;
  /** Required, and nothing supplies it. */
  readonly missing: boolean;
  /** Its value differs from what the running deployment got. */
  readonly changed: boolean;
  /** What the App itself sets, and whether release management generated it. */
  readonly app: (VariableValueView & { readonly generated: boolean }) | null;
  /** What its environment sets. */
  readonly environment: VariableValueView | null;
}

/** `meta` of `GET /apps/:appId/variables`. */
export interface AppVariablesMeta {
  readonly total: number;
  /**
   * The release the variables were read against: the one asked for, else the App's most recent build (its newest
   * release that carries a variables manifest), else the release it runs, else its newest; null before it has any.
   */
  readonly releaseId: string | null;
  readonly releaseVersion: string | null;
  /** The App's environment, where a value every App there gets is set. */
  readonly environmentId: string;
  /** Whether that release declares its variables; without a manifest nothing is required. */
  readonly declared: boolean;
  readonly missing: readonly string[];
  /** Whether a value changed since the running deployment. */
  readonly changed: boolean;
}

/**
 * A variable the most recent build of some App of an environment declares (`GET
 * /environments/:environmentId/declaredVariables`), with whether the environment sets it and which Apps miss it.
 */
export interface EnvironmentDeclaredVariableView {
  readonly name: string;
  /** The first description a declaring build gives. */
  readonly description: string | null;
  /** Some declaring build says it is a secret. */
  readonly secret: boolean;
  /** Some declaring build requires it. */
  readonly required: boolean;
  /** The environment sets a value. */
  readonly set: boolean;
  /** The Apps whose most recent build declares it, by ID. */
  readonly apps: readonly string[];
  /** The Apps that require it and get no value from anything (their own value, the environment, `config.yml`, …). */
  readonly missingIn: readonly string[];
}

/** The first administrator a first deployment generated (`GET /apps/:appId/initialAdmin`). */
export interface InitialAdminView {
  readonly deploymentId: string;
  readonly username: string;
  readonly email: string;
  readonly password: string;
  /** When it is deleted; null when it is kept until the App goes (a preview App's). */
  readonly expiresAt: string | null;
}
