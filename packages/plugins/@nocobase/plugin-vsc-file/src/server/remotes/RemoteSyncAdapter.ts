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
  VscGitHubRemoteConfig,
  VscRemoteNormalizedConfig,
  VscRemoteProvider,
  VscRemoteSafeMetadata,
  VscRemoteSnapshot,
} from '../../shared/remote-sync-types';

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
 * Provider adapters exchange snapshots only. Database, transaction, light-extension services, provider SDK errors,
 * and raw credential values are deliberately absent from this contract.
 */
export interface RemoteSyncAdapter {
  readonly provider: VscRemoteProvider;
  readonly title: string;
  readonly capabilities: RemoteSyncAdapterCapabilities;
  normalizeConfig(input: unknown): VscRemoteNormalizedConfig;
  probe(target: RemoteSyncAdapterTarget): Promise<RemoteSyncProbeResult>;
  fetchSnapshot(target: RemoteSyncAdapterTarget): Promise<VscRemoteSnapshot>;
  publishSnapshot(
    target: RemoteSyncAdapterTarget,
    snapshot: VscRemoteSnapshot,
    expectedRevision: string | null,
  ): Promise<RemoteSyncPublishResult>;
}

function isGitHubConfigObject(input: unknown): input is Record<string, unknown> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return false;
  }
  const keys = ['owner', 'repository', 'branch', 'subdirectory'] as const;
  const inputKeys = Object.keys(input);
  return (
    ['owner', 'repository', 'branch'].every((key) => inputKeys.includes(key)) &&
    inputKeys.every((key) => keys.includes(key as (typeof keys)[number]))
  );
}

function requireRemoteSegment(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.length === 0 || value.trim() !== value) {
    throw new RemoteSyncError('CONFIG_INVALID', `GitHub ${field} must be a non-empty trimmed string`, {
      details: { provider: 'github', reasonCode: `invalid-${field}` },
    });
  }
  return value;
}

function requireRemoteBranch(value: unknown): string {
  if (typeof value !== 'string' || value.trim() !== value) {
    throw new RemoteSyncError('CONFIG_INVALID', 'GitHub branch must be a trimmed string', {
      details: { provider: 'github', reasonCode: 'invalid-branch' },
    });
  }
  return value;
}

export function normalizeGitHubRemoteConfig(input: unknown): VscGitHubRemoteConfig {
  if (!isGitHubConfigObject(input)) {
    throw new RemoteSyncError('CONFIG_INVALID', 'GitHub remote config has invalid or unknown fields', {
      details: { provider: 'github', reasonCode: 'invalid-config-shape' },
    });
  }

  let subdirectory: string | null = null;
  if (input.subdirectory !== undefined && input.subdirectory !== null) {
    if (typeof input.subdirectory !== 'string' || input.subdirectory.trim() !== input.subdirectory) {
      throw new RemoteSyncError('CONFIG_INVALID', 'GitHub subdirectory must be a trimmed string or null', {
        details: { provider: 'github', reasonCode: 'invalid-subdirectory' },
      });
    }
    subdirectory = input.subdirectory || null;
  }

  return {
    owner: requireRemoteSegment(input.owner, 'owner'),
    repository: requireRemoteSegment(input.repository, 'repository'),
    branch: requireRemoteBranch(input.branch),
    subdirectory,
  };
}
