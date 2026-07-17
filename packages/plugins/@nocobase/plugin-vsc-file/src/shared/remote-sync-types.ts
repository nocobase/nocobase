/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export const vscRemoteProviders = ['github'] as const;

export type VscRemoteProvider = (typeof vscRemoteProviders)[number];

export interface VscGitHubRemoteConfig {
  owner: string;
  repository: string;
  branch: string;
  subdirectory: string | null;
}

export type VscRemoteNormalizedConfig = VscGitHubRemoteConfig;

export interface VscRemoteSnapshotFile {
  path: string;
  content: string;
  mode?: string;
  language?: string;
}

export type VscRemoteSafeMetadataValue = string | number | boolean | null;

export type VscRemoteSafeMetadata = Record<string, VscRemoteSafeMetadataValue>;

export interface VscRemoteSnapshot {
  revision: string | null;
  contentHash: string;
  files: VscRemoteSnapshotFile[];
  metadata: VscRemoteSafeMetadata;
}

export interface VscRemoteSyncBaseline {
  remoteTargetVersion: number;
  lastLocalCommitId: string | null;
  lastRemoteRevision: string | null;
  lastSyncedContentHash: string | null;
}

export const vscRemotePlannerStates = [
  'unconfigured',
  'in-sync',
  'local-ahead',
  'remote-ahead',
  'diverged',
  'error',
] as const;

export type VscRemotePlannerState = (typeof vscRemotePlannerStates)[number];

export type VscRemotePlannerAction =
  | 'noop'
  | 'push'
  | 'pull'
  | 'establish-mapping'
  | 'repair-mapping'
  | 'conflict'
  | 'fetch-required';

export type VscRemoteSyncDirection = 'push' | 'pull' | 'bidirectional';

export interface VscRemotePlannerCapabilities {
  canPull: boolean;
  canPush: boolean;
}

export interface VscRemotePlannerLocalSummary {
  headCommitId: string | null;
  contentHash: string | null;
}

export interface VscRemotePlannerRemoteSummary {
  revision: string | null;
  contentHash: string | null;
  contentHashKnown: boolean;
}

export interface VscRemotePlannerInput {
  configured: boolean;
  remoteId: string | null;
  provider: VscRemoteProvider | null;
  remoteTargetVersion: number | null;
  direction: VscRemoteSyncDirection;
  capabilities: VscRemotePlannerCapabilities;
  local: VscRemotePlannerLocalSummary;
  remote: VscRemotePlannerRemoteSummary;
  baseline: VscRemoteSyncBaseline | null;
}

export interface VscRemoteSyncPlan {
  state: VscRemotePlannerState;
  action: VscRemotePlannerAction;
  reasonCode: string | null;
  canPull: boolean;
  canPush: boolean;
  fingerprint: string;
  remoteTargetVersion: number | null;
  local: VscRemotePlannerLocalSummary;
  remote: VscRemotePlannerRemoteSummary;
  baseline: VscRemoteSyncBaseline | null;
}

export const remoteSyncErrorCodes = [
  'UNSUPPORTED_PROVIDER',
  'CREDENTIAL_UNAVAILABLE',
  'AUTH_FAILED',
  'REMOTE_NOT_FOUND',
  'RATE_LIMITED',
  'REMOTE_CHANGED',
  'DIVERGED',
  'BUSY',
  'UNSAFE_CONTENT',
  'REMOTE_UNAVAILABLE',
  'PERMISSION_DENIED',
  'REPO_ARCHIVED',
  'LOCAL_OUTDATED',
  'CONFIG_INVALID',
  'AUTH_REF_INVALID',
] as const;

export type RemoteSyncErrorCode = (typeof remoteSyncErrorCodes)[number];

export type VscFileRemoteStatus = 'active' | 'disabled';

export interface VscFileRemoteRecord {
  id: string;
  repoId: string;
  name: string;
  provider: VscRemoteProvider;
  config: VscRemoteNormalizedConfig;
  authRef: string | null;
  status: VscFileRemoteStatus;
  version: number;
  lastCheckedAt: string | null;
  lastSyncedAt: string | null;
  lastErrorCode: RemoteSyncErrorCode | null;
  createdAt?: string;
  updatedAt?: string;
}

export type VscFileSyncOperation = 'probe' | 'push' | 'pull';

export type VscFileSyncJobStatus = 'pending' | 'running' | 'succeeded' | 'failed' | 'finalize-pending';

export type VscFileSyncJobPhase = 'prepared' | 'remote-started' | 'remote-succeeded' | 'finalize-pending' | 'finalized';

export interface VscFileSyncJobRecord {
  id: string;
  remoteId: string;
  remoteTargetVersion: number;
  operation: VscFileSyncOperation;
  status: VscFileSyncJobStatus;
  phase: VscFileSyncJobPhase;
  idempotencyKey: string;
  planFingerprint: string | null;
  expectedLocalCommitId: string | null;
  expectedRemoteRevision: string | null;
  resultLocalCommitId: string | null;
  resultRemoteRevision: string | null;
  contentHash: string | null;
  claimToken: string | null;
  leaseOwner: string | null;
  leaseExpiresAt: string | null;
  heartbeatAt: string | null;
  attempt: number;
  maxAttempts: number;
  startedAt: string | null;
  finishedAt: string | null;
  lastErrorCode: RemoteSyncErrorCode | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface VscFileExternalCommitMapRecord {
  id: string;
  remoteId: string;
  remoteTargetVersion: number;
  localCommitId: string;
  remoteRevision: string;
  contentHash: string;
  createdAt?: string;
}

export type VscFileConflictStatus = 'open' | 'resolved';

export interface VscFileConflictRecord {
  id: string;
  remoteId: string;
  remoteTargetVersion: number;
  status: VscFileConflictStatus;
  baseLocalCommitId: string | null;
  baseRemoteRevision: string | null;
  currentLocalCommitId: string | null;
  currentRemoteRevision: string | null;
  localContentHash: string | null;
  remoteContentHash: string | null;
  reasonCode: string;
  createdAt?: string;
  updatedAt?: string;
  resolvedAt?: string | null;
}
