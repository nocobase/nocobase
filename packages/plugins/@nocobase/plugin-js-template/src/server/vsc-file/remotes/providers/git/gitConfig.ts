/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type {
  GitRemoteCredential,
  VscGitRemoteConfig,
  VscGitRemoteConfigDraft,
  VscGitRemoteTransport,
} from '../../../../../shared/vsc-file/remote-sync-types';
import {
  normalizeGitRepositoryUrlSyntax,
  validateGitBranchSyntax,
  validateGitSubdirectorySyntax,
} from '../../../../../shared/vsc-file/git-config-validation';
import { RemoteSyncError } from '../../RemoteSyncAdapter';

const draftConfigKeys = new Set(['url', 'branch', 'subdirectory', 'transport']);

export interface NormalizedVscGitRemoteConfigDraft {
  url: string;
  branch: string | null;
  subdirectory: string | null;
  transport: VscGitRemoteTransport;
}

export function normalizeGitRemoteConfigDraft(input: unknown): NormalizedVscGitRemoteConfigDraft {
  const config = requireConfigObject(input, false);
  const normalizedUrl = normalizeGitRemoteUrl(config.url);
  const suppliedTransport = config.transport;
  if (suppliedTransport !== undefined && suppliedTransport !== 'https' && suppliedTransport !== 'ssh') {
    throw invalidConfig('Git remote transport is invalid', 'invalid-transport');
  }
  if (suppliedTransport !== undefined && suppliedTransport !== normalizedUrl.transport) {
    throw invalidConfig('Git remote transport does not match the URL', 'transport-mismatch');
  }

  return {
    url: normalizedUrl.url,
    branch: normalizeGitBranch(config.branch, true),
    subdirectory: normalizeGitSubdirectory(config.subdirectory),
    transport: normalizedUrl.transport,
  };
}

export function normalizeGitRemoteConfig(input: unknown): VscGitRemoteConfig {
  const config = requireConfigObject(input, true);
  const normalized = normalizeGitRemoteConfigDraft(config);
  if (!normalized.branch) {
    throw invalidConfig('Git remote branch must be resolved before persistence', 'branch-required');
  }
  return {
    ...normalized,
    branch: normalized.branch,
  };
}

export function parseGitRemoteCredential(input: unknown, transport: VscGitRemoteTransport): GitRemoteCredential {
  const value = parseCredentialValue(input);
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw credentialInvalid('Git remote credential must be a JSON object', 'invalid-credential-shape');
  }
  const credential = value as Record<string, unknown>;

  if (credential.kind === 'https') {
    assertExactKeys(credential, ['kind', 'username', 'password']);
    if (transport !== 'https') {
      throw credentialInvalid('Git remote credential does not match the transport', 'credential-kind-mismatch');
    }
    return {
      kind: 'https',
      username: requireCredentialString(credential.username, 'username'),
      password: requireCredentialString(credential.password, 'password'),
    };
  }

  if (credential.kind === 'ssh') {
    assertExactKeys(credential, ['kind', 'privateKey', 'passphrase', 'knownHosts'], ['passphrase']);
    if (transport !== 'ssh') {
      throw credentialInvalid('Git remote credential does not match the transport', 'credential-kind-mismatch');
    }
    const passphrase = credential.passphrase;
    if (passphrase === undefined) {
      return {
        kind: 'ssh',
        privateKey: requireCredentialString(credential.privateKey, 'private-key'),
        knownHosts: requireCredentialString(credential.knownHosts, 'known-hosts'),
      };
    }
    if (typeof passphrase !== 'string') {
      throw credentialInvalid('Git remote credential passphrase must be a string', 'invalid-passphrase');
    }
    return {
      kind: 'ssh',
      privateKey: requireCredentialString(credential.privateKey, 'private-key'),
      passphrase,
      knownHosts: requireCredentialString(credential.knownHosts, 'known-hosts'),
    };
  }

  throw credentialInvalid('Git remote credential kind is invalid', 'invalid-credential-kind');
}

function requireConfigObject(input: unknown, persisted: boolean): Record<string, unknown> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw invalidConfig('Git remote config has invalid or unknown fields', 'invalid-config-shape');
  }
  const keys = Object.keys(input);
  if (keys.some((key) => !draftConfigKeys.has(key))) {
    throw invalidConfig('Git remote config has invalid or unknown fields', 'invalid-config-shape');
  }
  const requiredKeys = persisted ? ['url', 'branch', 'subdirectory', 'transport'] : ['url'];
  if (requiredKeys.some((key) => !Object.hasOwn(input, key))) {
    throw invalidConfig('Git remote config has invalid or unknown fields', 'invalid-config-shape');
  }
  return input as Record<string, unknown>;
}

function normalizeGitRemoteUrl(value: unknown): { url: string; transport: VscGitRemoteTransport } {
  if (typeof value !== 'string') {
    throw invalidConfig('Git remote URL is invalid', 'invalid-url');
  }
  const result = normalizeGitRepositoryUrlSyntax(value);
  if (result.valid === true) {
    return result;
  }
  if (result.reason === 'unsupported-url-protocol') {
    throw invalidConfig('Git remote URL protocol is not supported', result.reason);
  }
  if (result.reason === 'url-credentials-forbidden') {
    const message =
      result.transport === 'https'
        ? 'HTTPS Git remote URLs must not contain credentials'
        : 'SSH Git remote URLs must not contain a password';
    throw invalidConfig(message, result.reason);
  }
  throw invalidConfig('Git remote URL is invalid', result.reason);
}

function normalizeGitBranch(value: unknown, optional: boolean): string | null {
  if (value === undefined || value === null || value === '') {
    if (optional) {
      return null;
    }
    throw invalidConfig('Git remote branch is invalid', 'invalid-branch');
  }
  if (typeof value !== 'string') {
    throw invalidConfig('Git remote branch is invalid', 'invalid-branch');
  }
  const result = validateGitBranchSyntax(value);
  if (result.valid === false) {
    throw invalidConfig('Git remote branch is invalid', result.reason);
  }
  return result.branch;
}

function normalizeGitSubdirectory(value: unknown): string | null {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  if (typeof value !== 'string') {
    throw invalidConfig('Git remote subdirectory is invalid', 'invalid-subdirectory');
  }
  const result = validateGitSubdirectorySyntax(value);
  if (result.valid === false) {
    throw invalidConfig('Git remote subdirectory is invalid', result.reason);
  }
  return result.subdirectory;
}

function parseCredentialValue(input: unknown): unknown {
  if (typeof input !== 'string') {
    return input;
  }
  try {
    return JSON.parse(input) as unknown;
  } catch {
    throw credentialInvalid(
      'Git remote credential Secret must contain a structured JSON object',
      'invalid-credential-json',
    );
  }
}

function assertExactKeys(
  value: Record<string, unknown>,
  allowedKeys: readonly string[],
  optionalKeys: readonly string[] = [],
): void {
  const allowed = new Set(allowedKeys);
  if (
    Object.keys(value).some((key) => !allowed.has(key)) ||
    allowedKeys.some((key) => !optionalKeys.includes(key) && !Object.hasOwn(value, key))
  ) {
    throw credentialInvalid('Git remote credential has invalid or unknown fields', 'invalid-credential-shape');
  }
}

function requireCredentialString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw credentialInvalid(`Git remote credential ${field} is invalid`, `invalid-${field}`);
  }
  return value;
}

function invalidConfig(message: string, reasonCode: string): RemoteSyncError {
  return new RemoteSyncError('CONFIG_INVALID', message, {
    details: { provider: 'git', reasonCode },
  });
}

function credentialInvalid(message: string, reasonCode: string): RemoteSyncError {
  return new RemoteSyncError('AUTH_REF_INVALID', message, {
    details: { provider: 'git', reasonCode },
  });
}

export type { GitRemoteCredential, VscGitRemoteConfig, VscGitRemoteConfigDraft };
