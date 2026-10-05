import type { HostStatus } from '@nocobase/app-host/management';
import type { AuthorizationTitle } from '@nocobase/authorization/core';
import type { JournalEntry } from '@nocobase/logging';

import type {
  HubAppDetail,
  HubAppSummary,
  HubConfigMode,
  HubDeploymentPhase,
  HubDeploymentRecord,
  HubDeploymentListItem,
  HubDeploymentStatus,
  HubReleaseRecord,
  HubReleaseSummary,
  HubReleaseUploadState,
} from '../tokens.js';

// What each Hub route answers with. The API document's response schemas in `schemas.ts` are typed against these, so a
// field added here or removed from a view without updating its schema fails the typecheck.

type AppIdentity = Pick<
  HubAppDetail['app'],
  'id' | 'name' | 'updatedAt' | 'currentDeploymentId'
>;
type Runtime = Pick<HubAppDetail['runtime'], 'hostAvailable' | 'state'>;
export interface AppSummaryResponse {
  app: AppIdentity;
  runtime: Runtime;
  currentVersion: string | null;
  hasReleases: boolean;
  hasPendingDeployment: boolean;
  enabled: boolean;
  startupMode: 'lazy' | 'eager';
}
export interface AppDetailResponse extends AppSummaryResponse {
  deployment: Pick<
    HubAppDetail['deployment'],
    | 'desiredReleaseId'
    | 'observedReleaseId'
    | 'observedState'
    | 'activation'
    | 'basePath'
    | 'updatedAt'
  >;
  hostUrl: string | null;
  buildTarget: HubAppDetail['buildTarget'];
}
export type ReleaseResponse = Pick<
  HubReleaseRecord,
  'id' | 'version' | 'checksum' | 'size' | 'createdAt'
> & { hasConfigTemplate: boolean };
export type ReleaseSummaryResponse = ReleaseResponse &
  Pick<HubReleaseSummary, 'buildTarget' | 'running' | 'everDeployed'>;
/** What a finished upload answers with, whether it arrived in one request or in chunks. */
export type UploadedReleaseResponse = ReleaseResponse & {
  readonly releaseId: string;
  readonly reused: boolean;
};
export type DeploymentResponse = Pick<
  HubDeploymentRecord,
  | 'id'
  | 'releaseId'
  | 'kind'
  | 'status'
  | 'phase'
  | 'cacheHit'
  | 'error'
  | 'createdAt'
> & {
  config: Pick<HubDeploymentRecord['config'], 'mode'>;
};
export type DeploymentListResponse = DeploymentResponse &
  Pick<HubDeploymentListItem, 'finishedAt' | 'release'>;

/** A resumable upload session as it stands. */
export type ReleaseUploadResponse = HubReleaseUploadState;
/** A resumable upload session as starting one reports it, with the chunk size to send. */
export type StartedReleaseUploadResponse = HubReleaseUploadState & {
  readonly chunkSize: number;
};
/** Starting an upload of an archive the App already has: no session, and the Release it already is. */
export interface ReusedReleaseUploadResponse {
  readonly offset: number;
  readonly size: number;
  readonly chunkSize: number;
  readonly releaseId: string;
  readonly version: string;
  readonly reused: true;
}

export interface ConfigTemplateResponse {
  readonly content: string | null;
}
export interface ConfigResponse {
  readonly mode: HubConfigMode;
  readonly content: string | null;
}
export interface SettingsResponse {
  readonly name: string;
  readonly activation: 'lazy' | 'eager';
}
export interface DeploymentAcceptedResponse {
  readonly id: string;
  readonly operationId: string;
  readonly status: HubDeploymentStatus;
  readonly reused: boolean;
  readonly createdAt: Date;
}
export interface RollbackAcceptedResponse {
  readonly id: string;
  readonly operationId: string;
  readonly status: HubDeploymentStatus;
}
export interface DeploymentStatusResponse {
  readonly operationId: string;
  readonly releaseId: string;
  readonly status: HubDeploymentStatus;
  readonly phase: HubDeploymentPhase;
}

/** The journal's state next to a log read: where to read on from, and whether more is already there. */
export interface LogMetaResponse {
  readonly nextPageToken: string;
  readonly hasMore: boolean;
  readonly available: boolean;
  readonly reset: boolean;
  readonly enabled: boolean;
  readonly status?: string;
  readonly phase?: string;
}
export interface LogFeedResponse {
  readonly data: readonly JournalEntry[];
  readonly meta: LogMetaResponse;
}

export interface HubRoleResponse {
  readonly key: string;
  readonly title?: AuthorizationTitle;
  readonly grants: readonly {
    readonly resource: { readonly type: string; readonly id: string };
    readonly actions: readonly string[];
  }[];
}

export type HostStatusResponse = HostStatus;

export function appSummaryResponse(
  value: HubAppSummary | HubAppDetail,
): AppSummaryResponse {
  return {
    app: {
      id: value.app.id,
      name: value.app.name,
      updatedAt: value.app.updatedAt,
      currentDeploymentId: value.app.currentDeploymentId,
    },
    runtime: {
      hostAvailable: value.runtime.hostAvailable,
      state: value.runtime.state,
    },
    currentVersion: value.currentVersion,
    hasReleases: value.hasReleases,
    hasPendingDeployment: value.hasPendingDeployment,
    enabled: value.app.enabled,
    startupMode: value.app.startupMode,
  };
}

export function appDetailResponse(value: HubAppDetail): AppDetailResponse {
  const deployment = value.deployment;
  return {
    ...appSummaryResponse(value),
    enabled: value.app.enabled,
    deployment: {
      desiredReleaseId: deployment.desiredReleaseId,
      observedReleaseId: deployment.observedReleaseId,
      observedState: deployment.observedState,
      activation: deployment.activation,
      basePath: deployment.basePath,
      updatedAt: deployment.updatedAt,
    },
    hostUrl: value.hostUrl,
    buildTarget: value.buildTarget,
  };
}

export function releaseResponse(value: HubReleaseRecord): ReleaseResponse {
  return {
    id: value.id,
    version: value.version,
    checksum: value.checksum,
    size: value.size,
    createdAt: value.createdAt,
    hasConfigTemplate: value.configTemplate !== null,
  };
}

export function releaseSummaryResponse(
  value: HubReleaseSummary,
): ReleaseSummaryResponse {
  return {
    ...releaseResponse(value),
    buildTarget: value.buildTarget,
    running: value.running,
    everDeployed: value.everDeployed,
  };
}

export function deploymentResponse(
  value: HubDeploymentRecord,
): DeploymentResponse {
  return {
    id: value.id,
    releaseId: value.releaseId,
    kind: value.kind,
    status: value.status,
    phase: value.phase,
    cacheHit: value.cacheHit,
    error: value.error,
    createdAt: value.createdAt,
    config: { mode: value.config.mode },
  };
}

export function deploymentListResponse(
  value: HubDeploymentListItem,
): DeploymentListResponse {
  return {
    ...deploymentResponse(value),
    finishedAt: value.finishedAt,
    release: value.release,
  };
}

export function uploadedReleaseResponse(
  release: HubReleaseRecord,
): UploadedReleaseResponse {
  return {
    ...releaseResponse(release),
    releaseId: release.id,
    reused: release.reused ?? false,
  };
}
