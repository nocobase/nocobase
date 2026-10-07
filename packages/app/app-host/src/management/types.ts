import type { AppRuntimeLogging } from '@nocobase/app-server/logging';
/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { ArtifactReference } from '../artifact-resolver.ts';
import type {
  AppBackendKind,
  AppLifecycleView,
  AppSnapshot,
} from '../app-types.ts';
import type { AppHostMode } from '../host-mode.ts';

export type DeploymentDesiredState = 'running' | 'stopped';
export type AppActivationPolicy = 'lazy' | 'eager';

export interface HostFileConfig {
  provider: 'file';
  path?: string;
  content?: string;
  revision?: string;
}

/** The backend name of Apps that run in the Host process. */
export const IN_PROCESS_BACKEND = 'in-process' as const;

/**
 * A control-plane environment on this Host. A deployment set naming a scope replaces only that scope's Apps, under the
 * scope's own revision, and an App belongs to one scope; calls without a scope behave as before scopes existed. The
 * scope also names the backend its Apps run on and carries that backend's settings and credentials, which the Host
 * keeps in memory only.
 */
export interface HostScope {
  /** `[a-zA-Z0-9_.-]`, at most 64 characters. */
  id: string;
  /**
   * `in-process` (the default), or the name of an external-service backend this Host offers (`docker`, see
   * `describeHost`).
   */
  backend?: string;
  /** That backend's settings; `in-process` takes none. */
  backendConfig?: Record<string, unknown>;
  /**
   * The backend's credentials, including the registry pull credentials of release images. Refused by `in-process`,
   * so nothing secret reaches a Host that runs untrusted App code.
   */
  secret?: Record<string, unknown> | null;
}

/** A release's OCI image: repository (without tag or digest), digest and platform. */
export interface HostImageArtifact {
  ref: string;
  digest: string;
  platform: string;
}

export interface HostDeploymentSpec {
  /** The control plane's deployment ID. With a scope, a deployment runs at most once per ID and is recorded. */
  operationId?: string;
  logging?: AppRuntimeLogging;
  id: string;
  appId: string;
  artifact: ArtifactReference;
  desiredState: DeploymentDesiredState;
  /**
   * Where the App runs: `in-process` in the Host, or `external-service` on the external-service backend its scope
   * names (a container the Host proxies to).
   */
  backend: AppBackendKind;
  /** The App's environment; in a set, the set's scope applies. */
  scope?: HostScope;
  /** The App's backend settings on top of its scope's. */
  backendConfig?: Record<string, unknown>;
  /** The release's images, by digest: what an external-service backend runs (it pulls the one for its platform). */
  images?: HostImageArtifact[];
  /** A host name the App answers on whatever the path, for an App with its own subdomain (it then runs at `/`). */
  hostname?: string;
  /**
   * `eager` starts the App when it is deployed or restored; `lazy` registers it and starts it on its first request.
   */
  activation?: AppActivationPolicy;
  /**
   * Stop the runtime after this many milliseconds without a request; the next request starts it again. `0` never
   * stops it; omitted, the Host's `idleTtlMs` applies.
   */
  idleStopMs?: number;
  /**
   * Make the App dormant after this many milliseconds without a request: its runtime is stopped and its expanded
   * release removed, while its definition, configuration and data stay; the next request expands the release from the
   * artifact store again and starts it. `0` or omitted never makes it dormant.
   */
  dormantAfterMs?: number;
  basePath?: string;
  config?: HostFileConfig;
  /**
   * The App's environment variables. They reach that App alone — an in-process App's scope, an external service's
   * container — never the Host's own environment, and are never logged.
   */
  env?: Record<string, string>;
}

export interface HostDeploymentSet {
  /** Without a scope, the Host's whole set; with one, that scope's, and `revision` counts per scope. */
  revision: number;
  deployments: HostDeploymentSpec[];
  /** The environment the set is for: it replaces only that scope's Apps. */
  scope?: HostScope;
}

export type DeploymentObservedState =
  'pending' | 'running' | 'stopped' | 'failed';

export interface HostDeploymentStatus {
  id: string;
  appId: string;
  /** The scope the App belongs to; null for an App deployed without one. */
  scopeId?: string | null;
  /** The control-plane deployment the App runs (the spec's `operationId`). */
  operationId?: string | null;
  /** The release version it runs. */
  version?: string | null;
  /** The archive checksum, or the image digest an external service runs. */
  artifact?: string | null;
  desiredState: DeploymentDesiredState;
  observedState: DeploymentObservedState;
  revision: number;
  cacheHit: boolean | null;
  app: AppSnapshot | null;
  error: string | null;
  /** Where the App's runtime stands (`running`, `starting`, `stopped`, `dormant`) and when it was last requested. */
  lifecycle?: AppLifecycleView | null;
}

/** Runtime changes since this Host process started; a supervisor uses them to decide when to recycle it. */
export interface HostRuntimeCounters {
  activations: number;
  idleStops: number;
  dormancies: number;
  materializations: number;
}

/**
 * The platform the Host process runs applications on, in the shape `pnpm build` records as
 * `nocobase.buildTarget` in an application's `dist/package.json`.
 */
export interface HostRuntime {
  platform: string;
  arch: string;
  /** The C library on Linux; `null` on every other platform. */
  libc: 'glibc' | 'musl' | null;
  nodeAbi: number;
  nodeMajor: number;
}

export interface HostStatus {
  mode: AppHostMode;
  runtime: HostRuntime;
  ready: boolean;
  desiredRevision: number;
  reconciledRevision: number;
  deployments: HostDeploymentStatus[];
  counters?: HostRuntimeCounters;
  /**
   * For a status asked about one scope: the revision of its last applied set. Absent while the Host has no set for
   * it (it restarted, say), so its Apps' absence means nothing yet.
   */
  scope?: { id: string; revision: number };
}

export interface HostStatusQuery {
  /** Only this scope's Apps. */
  scope?: string;
  /** Only these Apps. */
  appIds?: string[];
}

export interface ApplyDeploymentSetResult {
  accepted: boolean;
  status: HostStatus;
  /** For a set with a scope: the scope's revision after the call, which a newer set has to exceed. */
  revision?: number;
}

/** How a recorded deployment stands. `interrupted`: the Host that ran it stopped before it finished. */
export type HostOperationState =
  'running' | 'succeeded' | 'failed' | 'interrupted';

/** A deployment's outcome as the operation log keeps it, also after the Host or its control plane restarted. */
export interface HostOperation {
  operationId: string;
  scopeId: string;
  appId: string;
  state: HostOperationState;
  /** The App once the deployment finished. */
  status: HostDeploymentStatus | null;
  error: string | null;
  startedAt: string;
  finishedAt: string | null;
}

/** What a backend can do, so a control plane offers only that. */
export interface HostBackendCapabilities {
  /** Start on the first request, stop when idle, become dormant. */
  onDemand: boolean;
  /** How a deployment replaces a running App. */
  rollout: 'stop-first' | 'start-first';
  /** Runs release images (`HostDeploymentSpec.images`) rather than only the archive. */
  images: boolean;
  /** Backs an App's data up before a deployment, when configured. */
  backup: boolean;
  logs: boolean;
  urlModes: ('path' | 'subdomain')[];
}

export interface HostBackendDescription {
  /** What a scope names: `in-process`, `docker`. */
  name: string;
  kind: AppBackendKind;
  capabilities: HostBackendCapabilities;
  /** JSON Schema of the scope's `backendConfig`. */
  configSchema: Record<string, unknown>;
  /** JSON Schema of the scope's `secret`, for a backend that takes credentials. */
  secretSchema?: Record<string, unknown>;
}

export interface HostDescription {
  mode: AppHostMode;
  /** Identifies this Host process; changes when it restarts. */
  hostId: string;
  backends: HostBackendDescription[];
}

export interface HostScopeCheck {
  ok: boolean;
  message?: string;
  details?: Record<string, unknown>;
}
