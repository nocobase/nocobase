/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type {
  VscFileRemoteRecord,
  VscFileSyncJobRecord,
  RemoteSyncErrorCode,
  VscRemoteNormalizedConfig,
  VscRemoteProvider,
  VscRemoteSnapshot,
  VscRemoteSyncPlan,
} from '../../shared/remote-sync-types';
import type { Transaction } from '@nocobase/database';
import type { VscPermissionRequestMetadata } from '../permissions';
import type {
  VscRemotePullDiscoveryContext,
  VscRemotePullDiscoveryInput,
  VscRemotePullDiscoveryResult,
  VscRemotePullHandle,
  VscRemotePullOwnerApply,
} from './VscRemotePullDiscoveryService';

export interface RemoteSyncConfigureInput {
  repoId: string;
  name: string;
  provider: VscRemoteProvider;
  config: unknown;
  authRef: string | null;
}

export interface RemoteSyncExecutionInput {
  remoteId: string;
  expectedLocalCommitId: string | null;
  expectedRemoteRevision: string | null;
  expectedRemoteTargetVersion: number;
  planFingerprint: string;
}

export interface RemoteSyncExecutionResult {
  remote: VscFileRemoteRecord;
  job: VscFileSyncJobRecord;
  snapshot: VscRemoteSnapshot;
  plan: VscRemoteSyncPlan;
}

export interface RemoteSyncContext {
  authorId?: string | null;
  request?: VscPermissionRequestMetadata;
}

export interface RemoteSyncTestTargetInput {
  provider: VscRemoteProvider;
  config: unknown;
  authRef: string | null;
}

export interface RemoteSyncTestTargetResult {
  provider: VscRemoteProvider;
  config: VscRemoteNormalizedConfig;
  snapshot: VscRemoteSnapshot;
}

export interface RemoteSyncEstablishInitialBaselineInput {
  repoId: string;
  name: string;
  provider: VscRemoteProvider;
  config: VscRemoteNormalizedConfig;
  authRef: string | null;
  localCommitId: string;
  snapshot: VscRemoteSnapshot;
}

export interface RemoteSyncEstablishInitialBaselineResult {
  remote: VscFileRemoteRecord;
  job: VscFileSyncJobRecord;
  plan: VscRemoteSyncPlan;
}

/** Server-only owner apply boundary. Claim tokens and source snapshots must never be returned by a client Resource. */
export interface RemoteSyncPullCoordinator {
  discover(
    input: VscRemotePullDiscoveryInput,
    ctx?: VscRemotePullDiscoveryContext,
  ): Promise<VscRemotePullDiscoveryResult>;
  apply<TOwner, TResult>(
    handle: VscRemotePullHandle,
    ownerApply: VscRemotePullOwnerApply<TOwner, TResult>,
  ): Promise<{ job: VscFileSyncJobRecord; result: { localCommitId: string; contentHash: string } & TResult }>;
  failApply(handle: VscRemotePullHandle, code: RemoteSyncErrorCode): Promise<void>;
  listRecoverablePullJobs(): Promise<VscFileSyncJobRecord[]>;
}

/** Public server boundary used by domain plugins; collection repositories are not exposed. */
export interface RemoteSyncRuntime {
  normalizeConfig(provider: VscRemoteProvider, input: unknown): VscRemoteNormalizedConfig;
  getRemote(repoId: string, name: string): Promise<VscFileRemoteRecord | null>;
  getRemoteById(remoteId: string): Promise<VscFileRemoteRecord>;
  getLatestMappedRevision(remoteId: string): Promise<string | null>;
  configureRemote(input: RemoteSyncConfigureInput): Promise<VscFileRemoteRecord>;
  disconnectRemote(remoteId: string): Promise<void>;
  testTarget(input: RemoteSyncTestTargetInput): Promise<RemoteSyncTestTargetResult>;
  fetchTarget(input: RemoteSyncTestTargetInput): Promise<RemoteSyncTestTargetResult>;
  establishInitialBaseline(
    input: RemoteSyncEstablishInitialBaselineInput,
    transaction: Transaction,
  ): Promise<RemoteSyncEstablishInitialBaselineResult>;
  probeRemote(remoteId: string): Promise<VscRemoteSnapshot>;
  fetchRemoteSnapshot(remoteId: string): Promise<VscRemoteSnapshot>;
  planRemote(remoteId: string): Promise<VscRemoteSyncPlan>;
  planUnconfigured(repoId: string): Promise<VscRemoteSyncPlan>;
  push(input: RemoteSyncExecutionInput, ctx?: RemoteSyncContext): Promise<RemoteSyncExecutionResult>;
  pull(input: RemoteSyncExecutionInput, ctx?: RemoteSyncContext): Promise<RemoteSyncExecutionResult>;
  getPullCoordinator(): RemoteSyncPullCoordinator;
  assertRepositoryIdle(repoId: string, transaction?: Transaction): Promise<void>;
  recoverPushJobs(): Promise<void>;
}
