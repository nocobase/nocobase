import type { AppRuntimeLogging } from '@nocobase/app-server/logging';
/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { AppState } from './events.ts';
import type { AppInstance } from '@nocobase/app-server/runtime';
import type { AppConfigReloadResult } from '@nocobase/app-server/config';
export type { AppInstance } from '@nocobase/app-server/runtime';
import type { AppWebSocketAcceptResult } from '@nocobase/app-websocket';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Duplex } from 'node:stream';

export type AppDisposer = () => void | Promise<void>;

export interface AppScope {
  readonly logging?: AppRuntimeLogging;
  readonly id: string;
  readonly appName?: string;
  readonly version: number;
  readonly basePath: string;
  readonly assetsBasePath: string;
  readonly clientDir?: string;
  /**
   * Deprecated. App servers should define their own API routes under the
   * app-local path they receive, for example `/api/*`.
   */
  readonly apiBasePath: string;
  readonly rootDir?: string;
  readonly dataDir?: string;
  readonly configPath?: string;
  /** The App's environment variables, from its deployment; an embedded App reads its configuration from them. */
  readonly env?: Readonly<Record<string, string>>;
  readonly signal: AbortSignal;
  registerDisposer(name: string, dispose: AppDisposer): void;
  onBeforeDestroy(handler: () => void | Promise<void>): () => void;
}

export type AppFactory = (
  scope: AppScope,
) => AppInstance | Promise<AppInstance>;

export type AppBackendKind =
  'in-process' | 'worker' | 'process' | 'external-service';

export type AppIsolation = AppBackendKind;

export type AppTier = 'cold' | 'warm' | 'hot' | 'dedicated';

export interface AppCodeReference {
  version: string;
  rootDir: string;
  entrypoint: string;
  fingerprint?: string;
}

export interface AppClientReference {
  rootDir: string;
  index?: string;
  assetsDir?: string;
}

export interface AppServerReference {
  rootDir: string;
  entrypoint: string;
  healthPath?: string;
}

/**
 * Deprecated. Use AppServerReference.
 */
export type AppApiReference = AppServerReference;

export interface AppReleaseReference extends AppCodeReference {
  releaseDir: string;
  manifestPath?: string;
}

export interface AppResourcePolicy {
  memoryLimitMb?: number;
  startupTimeoutMs?: number;
  requestTimeoutMs?: number;
  drainTimeoutMs?: number;
  /**
   * Stop the App's runtime after this long without a request; the next request starts it again. `0` never stops it
   * for idleness; omitted, the registry-wide `idleTtlMs` applies.
   */
  idleTtlMs?: number;
  /**
   * Make the App dormant after this long without a request: its runtime is stopped and its expanded files are removed,
   * while its definition, configuration and data stay. The next request expands the release again and starts it. Only
   * a registry with dormancy hooks (a managed Host) honours it; `0` or omitted never makes it dormant.
   */
  dormantAfterMs?: number;
  maxConcurrentRequests?: number;
}

/**
 * Where a registered App's runtime stands: `running` (a runtime serves it), `starting` (one is being activated),
 * `stopped` (no runtime; files ready, the next request starts one) or `dormant` (no runtime and no expanded files; the
 * next request prepares the release again first).
 */
export type AppLifecycleState = 'running' | 'starting' | 'stopped' | 'dormant';

export interface AppLifecycleView {
  state: AppLifecycleState;
  /** The last request (or activation), or when the definition was registered; null when unknown. */
  lastAccessedAt: string | null;
  /** The last activation failure, while it is recent enough to stop a request from retrying at once. */
  lastFailure: { at: string; error: string } | null;
}

export interface AppRuntimeEndpoint {
  kind: 'in-process' | 'local-http' | 'external-http';
  host?: string;
  port?: number;
  url?: string;
  pid?: number;
  workerId?: string;
}

export interface AppDefinition {
  deploymentId?: string;
  logging?: AppRuntimeLogging;
  id: string;
  appName?: string;
  basePath: string;
  enabled: boolean;
  backend: AppBackendKind;
  configVersion: string;
  isolation: AppIsolation;
  tier: AppTier;
  desiredVersion: string;
  rootDir?: string;
  dataDir?: string;
  configPath?: string;
  client?: AppClientReference;
  server?: AppServerReference;
  /**
   * Deprecated. Use `server`.
   */
  api?: AppApiReference;
  code?: AppCodeReference;
  release?: AppReleaseReference;
  healthPath?: string;
  resourcePolicy?: AppResourcePolicy;
  /**
   * What the App's backend needs beyond this definition, such as the image and settings of an `external-service`
   * backend's container. Plain JSON the registry passes through untouched; never credentials.
   */
  backendOptions?: Readonly<Record<string, unknown>>;
  /**
   * A host name the App answers on, whatever the path (an App reached at its own subdomain). Requests whose `Host`
   * header names it are the App's; the App then sees the whole path, not the path after `basePath`.
   */
  hostname?: string;
  /**
   * The App's own environment variables: an in-process App reads them as its scope's environment, an external service
   * gets them in its container. Never written to a log.
   */
  env?: Readonly<Record<string, string>>;
}

export interface CreateAppDefinitionOptions {
  deploymentId?: string;
  logging?: AppRuntimeLogging;
  appName?: string;
  basePath?: string;
  enabled?: boolean;
  backend?: AppBackendKind;
  configVersion?: string;
  isolation?: AppIsolation;
  tier?: AppTier;
  desiredVersion?: string;
  rootDir?: string;
  dataDir?: string;
  configPath?: string;
  /**
   * Deprecated shortcut for a server artifact entrypoint. Prefer `server.entrypoint`.
   */
  entrypoint?: string;
  client?: AppClientReference;
  server?: AppServerReference;
  /**
   * Deprecated. Use `server`.
   */
  api?: AppApiReference;
  code?: AppCodeReference;
  release?: AppReleaseReference;
  healthPath?: string;
  resourcePolicy?: AppResourcePolicy;
  backendOptions?: Readonly<Record<string, unknown>>;
  hostname?: string;
  env?: Readonly<Record<string, string>>;
}

export interface AppDestroyOptions {
  reason?: string;
  timeoutMs?: number;
  /**
   * The runtime goes away for good (a newer one replaced it, or the App was removed), rather than being stopped to be
   * started again; a backend may then free what it keeps for a restart, such as an external service's container.
   */
  retire?: boolean;
}

export interface AppSnapshot {
  id: string;
  appName?: string;
  version: number;
  basePath: string;
  backend: AppBackendKind;
  configVersion: string;
  desiredVersion: string;
  codeVersion: string;
  isolation: AppIsolation;
  tier: AppTier;
  state: AppState;
  endpoint: AppRuntimeEndpoint;
  activeRequests: number;
  createdAt: string;
  updatedAt: string;
  lastAccessedAt: string | null;
  lastError: string | null;
  disposerCount: number;
}

export interface ActiveAppHandle {
  reloadConfig(): Promise<AppConfigReloadResult>;
  readonly id: string;
  readonly version: number;
  readonly basePath: string;
  readonly backend: AppBackendKind;
  readonly signal: AbortSignal;
  readonly state: AppState;
  dispatch(request: Request, metadata?: AppRequestMetadata): Promise<Response>;
  acceptWebSocket(
    request: Request,
    metadata?: AppRequestMetadata,
  ): Promise<AppWebSocketAcceptResult>;
  destroy(options?: string | AppDestroyOptions): Promise<void>;
  snapshot(): AppSnapshot;
  /**
   * Forwards a request to the App as it arrived, path and all, and writes its answer: a reverse proxy, for a runtime
   * that serves HTTP itself elsewhere (an `external-service` backend). The Host uses it instead of `dispatch` when
   * present.
   */
  forward?(req: IncomingMessage, res: ServerResponse): Promise<void>;
  /** Forwards a WebSocket upgrade the same way, joining the two connections once the App accepts it. */
  forwardUpgrade?(
    req: IncomingMessage,
    socket: Duplex,
    head: Buffer,
  ): Promise<void>;
  /**
   * Lets the runtime go without stopping it, when the Host shuts down and the next Host takes the App over (an
   * external service keeps serving). Without it the Host destroys the runtime.
   */
  detach?(): Promise<void>;
}

export interface AppRequestMetadata {
  method?: string;
  path?: string;
}

export interface AppActivationRequest {
  definition: AppDefinition;
  version: number;
  createApp: AppFactory;
}

export interface AppActivationBackend {
  readonly kind: AppBackendKind;
  activate(request: AppActivationRequest): Promise<ActiveAppHandle>;
  /**
   * The backend's own name where its kind says too little: `docker` for an `external-service` backend that runs
   * containers. Defaults to the kind.
   */
  readonly name?: string;
  /**
   * Whether activation loads the App's server module in this process (`AppActivationRequest.createApp`). A backend
   * that runs the App elsewhere sets `false`, and the registry does not resolve a factory for it.
   */
  readonly loadsAppCode?: boolean;
  /**
   * How a changed definition replaces a running runtime: `stop-first` (the default) stops the old one before the new
   * one starts; `start-first` starts the new one beside it and switches only once it is ready, so a release that never
   * becomes ready never takes traffic.
   */
  readonly replacement?: 'stop-first' | 'start-first';
  /** Makes an App of this backend dormant, instead of the registry's dormancy hooks. Called with no runtime. */
  hibernate?(definition: AppDefinition): Promise<void>;
  /** Prepares a dormant App of this backend again before it is activated, instead of the registry's hooks. */
  materialize?(definition: AppDefinition): Promise<void>;
}

export interface DeployAppOptions {
  version?: string;
  reason?: string;
  strategy?: 'restart';
  destroyTimeoutMs?: number;
  waitForReady?: boolean;
}

export interface AppDeploymentResult {
  id: string;
  strategy: 'restart';
  previousVersion: string | null;
  desiredVersion: string;
  activeVersion: string;
  changed: boolean;
  app: AppSnapshot;
}

export interface ReplaceAppDefinitionOptions {
  activate?: boolean;
  reason?: string;
  destroyTimeoutMs?: number;
}

export interface ReplaceAppDefinitionResult {
  definition: AppDefinition;
  app: AppSnapshot | null;
  changed: boolean;
}
