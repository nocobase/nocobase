/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { PortalState } from './events';

export type PortalDisposer = () => void | Promise<void>;

export interface PortalFetchApp {
  fetch(request: Request, env?: unknown, executionCtx?: unknown): Response | Promise<Response>;
}

export interface PortalScope {
  readonly id: string;
  readonly appName?: string;
  readonly portalName?: string;
  readonly version: number;
  readonly basePath: string;
  readonly rootDir?: string;
  readonly dataDir?: string;
  readonly config?: unknown;
  readonly signal: AbortSignal;
  registerDisposer(name: string, dispose: PortalDisposer): void;
  onBeforeDestroy(handler: () => void | Promise<void>): () => void;
}

export type PortalAppFactory = (scope: PortalScope) => PortalFetchApp | Promise<PortalFetchApp>;

export type PortalBackendKind = 'in-process' | 'worker' | 'process' | 'external-service';

export type PortalIsolation = PortalBackendKind;

export type PortalTier = 'cold' | 'warm' | 'hot' | 'dedicated';

export interface PortalCodeReference {
  version: string;
  rootDir: string;
  entrypoint: string;
  checksum?: string;
}

export interface PortalReleaseReference extends PortalCodeReference {
  releaseDir: string;
  manifestPath?: string;
}

export interface PortalResourcePolicy {
  memoryLimitMb?: number;
  startupTimeoutMs?: number;
  requestTimeoutMs?: number;
  drainTimeoutMs?: number;
  idleTtlMs?: number;
  maxConcurrentRequests?: number;
}

export interface PortalRuntimeEndpoint {
  kind: 'in-process' | 'local-http' | 'external-http';
  host?: string;
  port?: number;
  url?: string;
  pid?: number;
  workerId?: string;
}

export interface PortalDefinition<TConfig = unknown> {
  id: string;
  appName?: string;
  portalName?: string;
  basePath: string;
  enabled: boolean;
  backend: PortalBackendKind;
  configVersion: string;
  isolation: PortalIsolation;
  tier: PortalTier;
  desiredVersion: string;
  rootDir?: string;
  dataDir?: string;
  entrypoint?: string;
  code?: PortalCodeReference;
  release?: PortalReleaseReference;
  healthPath?: string;
  resourcePolicy?: PortalResourcePolicy;
  config?: TConfig;
}

export interface CreatePortalDefinitionOptions<TConfig = unknown> {
  appName?: string;
  portalName?: string;
  basePath?: string;
  enabled?: boolean;
  backend?: PortalBackendKind;
  configVersion?: string;
  isolation?: PortalIsolation;
  tier?: PortalTier;
  desiredVersion?: string;
  rootDir?: string;
  dataDir?: string;
  entrypoint?: string;
  code?: PortalCodeReference;
  release?: PortalReleaseReference;
  healthPath?: string;
  resourcePolicy?: PortalResourcePolicy;
  config?: TConfig;
}

export interface PortalDestroyOptions {
  reason?: string;
  timeoutMs?: number;
}

export interface PortalSnapshot {
  id: string;
  appName?: string;
  portalName?: string;
  version: number;
  basePath: string;
  backend: PortalBackendKind;
  configVersion: string;
  desiredVersion: string;
  codeVersion: string;
  isolation: PortalIsolation;
  tier: PortalTier;
  state: PortalState;
  endpoint: PortalRuntimeEndpoint;
  activeRequests: number;
  createdAt: string;
  updatedAt: string;
  lastAccessedAt: string | null;
  lastError: string | null;
  disposerCount: number;
}

export interface ActivePortalHandle {
  readonly id: string;
  readonly version: number;
  readonly basePath: string;
  readonly backend: PortalBackendKind;
  readonly signal: AbortSignal;
  readonly state: PortalState;
  dispatch(request: Request, metadata?: PortalRequestMetadata): Promise<Response>;
  destroy(options?: string | PortalDestroyOptions): Promise<void>;
  snapshot(): PortalSnapshot;
}

export interface PortalRequestMetadata {
  method?: string;
  path?: string;
}

export interface PortalActivationRequest {
  definition: PortalDefinition;
  version: number;
  createApp: PortalAppFactory;
}

export interface PortalActivationBackend {
  readonly kind: PortalBackendKind;
  activate(request: PortalActivationRequest): Promise<ActivePortalHandle>;
}

export interface DeployPortalOptions {
  version?: string;
  reason?: string;
  strategy?: 'restart' | 'blue-green';
  destroyTimeoutMs?: number;
  waitForReady?: boolean;
}

export interface PortalDeploymentResult {
  id: string;
  strategy: 'restart' | 'blue-green';
  previousVersion: string | null;
  desiredVersion: string;
  activeVersion: string;
  changed: boolean;
  portal: PortalSnapshot;
}
