/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type {
  RemoteSyncErrorCode,
  VscRemoteNormalizedConfig,
  VscRemoteProvider,
  VscRemoteSafeMetadata,
  VscRemoteSnapshot,
} from '../../../shared/vsc-file/remote-sync-types';

export interface RemoteSyncErrorOptions {
  status?: number;
  details?: RemoteSyncErrorDetails;
}

export interface RemoteSyncErrorDetails {
  provider?: string;
  operation?: string;
  reasonCode?: string;
  requestId?: string;
  rateLimitReset?: string | number;
  retryAfterSeconds?: number;
  remoteTargetVersion?: number;
  expectedRemoteRevision?: string | null;
  currentRemoteRevision?: string | null;
  expectedHeadCommitId?: string | null;
  currentHeadCommitId?: string | null;
}

const defaultRemoteSyncStatus: Record<RemoteSyncErrorCode, number> = {
  UNSUPPORTED_PROVIDER: 422,
  CREDENTIAL_UNAVAILABLE: 422,
  AUTH_FAILED: 422,
  REMOTE_NOT_FOUND: 404,
  RATE_LIMITED: 429,
  REMOTE_CHANGED: 409,
  DIVERGED: 409,
  BUSY: 409,
  UNSAFE_CONTENT: 422,
  REMOTE_UNAVAILABLE: 502,
  PERMISSION_DENIED: 403,
  REPO_ARCHIVED: 409,
  LOCAL_OUTDATED: 409,
  CONFIG_INVALID: 422,
  AUTH_REF_INVALID: 422,
};

/** A safe provider-neutral error. It intentionally has no cause or raw provider payload. */
export class RemoteSyncError extends Error {
  readonly code: RemoteSyncErrorCode;

  readonly status: number;

  readonly details?: RemoteSyncErrorDetails;

  constructor(code: RemoteSyncErrorCode, message?: string, options: RemoteSyncErrorOptions = {}) {
    super(message || code);
    this.name = 'RemoteSyncError';
    this.code = code;
    this.status = options.status ?? defaultRemoteSyncStatus[code];
    this.details = options.details;
  }

  toResponseBody() {
    return {
      errors: [{ code: this.code, message: this.message, status: this.status, details: this.details }],
    };
  }
}

export interface RemoteSyncAdapterCapabilities {
  probe: boolean;
  fetch: boolean;
  publish: boolean;
  readOnly: boolean;
}

export interface RemoteSyncAdapterTarget {
  config: VscRemoteNormalizedConfig;
  authRef: string | null;
  signal?: AbortSignal;
}

export interface RemoteSyncProbeResult {
  revision: string | null;
  metadata: VscRemoteSafeMetadata;
}

export interface RemoteSyncPublishResult {
  revision: string;
  contentHash: string;
  metadata: VscRemoteSafeMetadata;
}

/**
 * Provider adapters exchange snapshots only. Database, transaction, js-template services, and provider SDK
 * errors are deliberately absent from this contract. Credential material must remain confined to target resolution
 * and must never be copied into snapshots or safe metadata.
 */
export interface RemoteSyncAdapter {
  readonly provider: VscRemoteProvider;
  readonly title: string;
  readonly capabilities: RemoteSyncAdapterCapabilities;
  normalizeConfig(input: unknown): VscRemoteNormalizedConfig;
  resolveConfigDraft?(input: unknown, authRef: string | null, signal?: AbortSignal): Promise<VscRemoteNormalizedConfig>;
  probe(target: RemoteSyncAdapterTarget): Promise<RemoteSyncProbeResult>;
  fetchSnapshot(target: RemoteSyncAdapterTarget, revision?: string | null): Promise<VscRemoteSnapshot>;
  publishSnapshot(
    target: RemoteSyncAdapterTarget,
    snapshot: VscRemoteSnapshot,
    expectedRevision: string | null,
  ): Promise<RemoteSyncPublishResult>;
}
