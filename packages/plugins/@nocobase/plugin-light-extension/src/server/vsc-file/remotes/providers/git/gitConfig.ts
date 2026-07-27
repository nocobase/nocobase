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
import { RemoteSyncError } from '../../RemoteSyncAdapter';

const maxUrlLength = 2048;
const maxBranchLength = 255;
const maxSubdirectoryLength = 1024;
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

  if (value.kind === 'https') {
    assertExactKeys(value, ['kind', 'username', 'password']);
    if (transport !== 'https') {
      throw credentialInvalid('Git remote credential does not match the transport', 'credential-kind-mismatch');
    }
    return {
      kind: 'https',
      username: requireCredentialString(value.username, 'username'),
      password: requireCredentialString(value.password, 'password'),
    };
  }

  if (value.kind === 'ssh') {
    assertExactKeys(value, ['kind', 'privateKey', 'passphrase', 'knownHosts'], ['passphrase']);
    if (transport !== 'ssh') {
      throw credentialInvalid('Git remote credential does not match the transport', 'credential-kind-mismatch');
    }
    const passphrase = value.passphrase;
    if (passphrase !== undefined && typeof passphrase !== 'string') {
      throw credentialInvalid('Git remote credential passphrase must be a string', 'invalid-passphrase');
    }
    return {
      kind: 'ssh',
      privateKey: requireCredentialString(value.privateKey, 'private-key'),
      ...(passphrase === undefined ? {} : { passphrase }),
      knownHosts: requireCredentialString(value.knownHosts, 'known-hosts'),
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
  if (
    typeof value !== 'string' ||
    value.length === 0 ||
    value.length > maxUrlLength ||
    value.trim() !== value ||
    /[\0\r\n]/u.test(value)
  ) {
    throw invalidConfig('Git remote URL is invalid', 'invalid-url');
  }

  const scpLikeMatch = /^(?<username>[A-Za-z0-9._-]+)@(?<hostname>[^:/\s]+):(?<path>[^\s]+)$/u.exec(value);
  const candidate = scpLikeMatch?.groups
    ? `ssh://${scpLikeMatch.groups.username}@${scpLikeMatch.groups.hostname}/${scpLikeMatch.groups.path.replace(
        /^\/+/,
        '',
      )}`
    : value;

  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    throw invalidConfig('Git remote URL is invalid', 'invalid-url');
  }

  const transport = protocolToTransport(url.protocol);
  if (!url.hostname || !url.pathname || url.pathname === '/' || url.search || url.hash) {
    throw invalidConfig('Git remote URL is invalid', 'invalid-url');
  }
  if (transport === 'https' && (url.username || url.password)) {
    throw invalidConfig('HTTPS Git remote URLs must not contain credentials', 'url-credentials-forbidden');
  }
  if (transport === 'ssh' && url.password) {
    throw invalidConfig('SSH Git remote URLs must not contain a password', 'url-credentials-forbidden');
  }
  if (url.pathname.includes('\\')) {
    throw invalidConfig('Git remote URL is invalid', 'invalid-url');
  }

  return { url: url.toString(), transport };
}

function protocolToTransport(protocol: string): VscGitRemoteTransport {
  if (protocol === 'https:') {
    return 'https';
  }
  if (protocol === 'ssh:') {
    return 'ssh';
  }
  throw invalidConfig('Git remote URL protocol is not supported', 'unsupported-url-protocol');
}

function normalizeGitBranch(value: unknown, optional: boolean): string | null {
  if (value === undefined || value === null || value === '') {
    if (optional) {
      return null;
    }
    throw invalidConfig('Git remote branch is invalid', 'invalid-branch');
  }
  if (
    typeof value !== 'string' ||
    value.length > maxBranchLength ||
    value.trim() !== value ||
    !isValidGitBranch(value)
  ) {
    throw invalidConfig('Git remote branch is invalid', 'invalid-branch');
  }
  return value;
}

function isValidGitBranch(branch: string): boolean {
  if (
    !branch ||
    branch === '@' ||
    branch === 'HEAD' ||
    branch.startsWith('-') ||
    branch.startsWith('/') ||
    branch.endsWith('/') ||
    branch.endsWith('.') ||
    branch.startsWith('refs/') ||
    branch.includes('//') ||
    branch.includes('..') ||
    branch.includes('@{')
  ) {
    return false;
  }
  for (const character of branch) {
    const code = character.charCodeAt(0);
    if (code <= 0x20 || code === 0x7f || '~^:?*[\\'.includes(character)) {
      return false;
    }
  }
  return branch.split('/').every((segment) => segment && !segment.startsWith('.') && !segment.endsWith('.lock'));
}

function normalizeGitSubdirectory(value: unknown): string | null {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  if (
    typeof value !== 'string' ||
    value.length > maxSubdirectoryLength ||
    value.trim() !== value ||
    value.startsWith('/') ||
    value.endsWith('/') ||
    value.includes('\\') ||
    value.includes('\0')
  ) {
    throw invalidConfig('Git remote subdirectory is invalid', 'invalid-subdirectory');
  }
  const segments = value.split('/');
  if (
    segments.some(
      (segment) => !segment || segment === '.' || segment === '..' || segment.toLocaleLowerCase('en-US') === '.git',
    )
  ) {
    throw invalidConfig('Git remote subdirectory is invalid', 'invalid-subdirectory');
  }
  return segments.join('/');
}

function parseCredentialValue(input: unknown): unknown {
  if (typeof input !== 'string') {
    return input;
  }
  try {
    return JSON.parse(input) as unknown;
  } catch {
    throw credentialInvalid('Git remote credential must contain valid JSON', 'invalid-credential-json');
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
