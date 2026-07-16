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
  VscRemoteNormalizedConfig,
  VscRemoteProvider,
  VscRemoteSnapshot,
  VscRemoteSyncPlan,
} from '../../shared/remote-sync-types';

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
}

/** Public server boundary used by domain plugins; collection repositories are not exposed. */
export interface RemoteSyncRuntime {
  normalizeConfig(provider: VscRemoteProvider, input: unknown): VscRemoteNormalizedConfig;
  getRemote(repoId: string, name: string): Promise<VscFileRemoteRecord | null>;
  configureRemote(input: RemoteSyncConfigureInput): Promise<VscFileRemoteRecord>;
  disconnectRemote(remoteId: string): Promise<void>;
  probeRemote(remoteId: string): Promise<VscRemoteSnapshot>;
  fetchRemoteSnapshot(remoteId: string): Promise<VscRemoteSnapshot>;
  planRemote(remoteId: string): Promise<VscRemoteSyncPlan>;
  push(input: RemoteSyncExecutionInput): Promise<RemoteSyncExecutionResult>;
  pull(input: RemoteSyncExecutionInput): Promise<RemoteSyncExecutionResult>;
}
