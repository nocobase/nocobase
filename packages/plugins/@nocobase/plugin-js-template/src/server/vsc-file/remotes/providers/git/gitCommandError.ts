/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { VscGitRemoteTransport } from '../../../../../shared/vsc-file/remote-sync-types';
import { RemoteSyncError } from '../../RemoteSyncAdapter';

export type GitCommandTerminationReason = 'aborted' | 'stdout-limit' | 'stderr-limit' | 'timeout';

export interface GitCommandErrorContext {
  binary: 'git' | 'ssh';
  operation?: string;
  transport?: VscGitRemoteTransport;
  exitCode?: number | null;
  stderr?: Buffer | string;
  errorCode?: string;
  terminationReason?: GitCommandTerminationReason;
  credentialProvided?: boolean;
}

export function mapGitCommandError(context: GitCommandErrorContext): RemoteSyncError {
  const details = {
    provider: 'git',
    ...(context.operation ? { operation: context.operation } : {}),
  };

  if (context.errorCode === 'ENOENT') {
    return unavailable(
      context.binary === 'git' ? 'Git executable is unavailable' : 'SSH executable is unavailable',
      `${context.binary}-binary-unavailable`,
      details,
    );
  }
  if (context.terminationReason === 'timeout') {
    return unavailable('Git command timed out', 'command-timeout', details);
  }
  if (context.terminationReason === 'aborted') {
    return unavailable('Git command was cancelled', 'command-aborted', details);
  }
  if (context.terminationReason === 'stdout-limit' || context.terminationReason === 'stderr-limit') {
    return unavailable('Git command exceeded its output limit', 'command-output-limit', details);
  }

  const stderr = decodeForClassification(context.stderr).toLowerCase();
  if (
    stderr.includes('remote host identification has changed') ||
    stderr.includes('offending ') ||
    stderr.includes('host key verification failed')
  ) {
    return unavailable('SSH host key verification failed', 'ssh-host-key-mismatch', details);
  }
  if (stderr.includes('no hostkey for host') || stderr.includes('no host key is known')) {
    return unavailable('SSH host key verification failed', 'ssh-known-host-unavailable', details);
  }
  if (
    stderr.includes('invalid format') ||
    stderr.includes('error in libcrypto') ||
    (stderr.includes('load key') && stderr.includes('error'))
  ) {
    return authFailed('SSH private key is invalid', 'ssh-private-key-invalid', details);
  }
  if (stderr.includes('permission denied (publickey')) {
    return authFailed('SSH authentication failed', 'ssh-permission-denied', details);
  }
  if (
    stderr.includes('authentication failed') ||
    stderr.includes('invalid username or password') ||
    stderr.includes('the requested url returned error: 401') ||
    stderr.includes('could not read username') ||
    stderr.includes('terminal prompts disabled')
  ) {
    return context.credentialProvided
      ? authFailed('Git authentication failed', 'invalid-credential', details)
      : credentialUnavailable(details);
  }
  if (
    stderr.includes('repository not found') ||
    stderr.includes('does not appear to be a git repository') ||
    stderr.includes("couldn't find remote ref") ||
    stderr.includes('the requested url returned error: 404')
  ) {
    return new RemoteSyncError('REMOTE_NOT_FOUND', 'Git remote target was not found', {
      details: { ...details, reasonCode: 'remote-not-found' },
    });
  }
  if (
    stderr.includes('the requested url returned error: 403') ||
    stderr.includes('pre-receive hook declined') ||
    stderr.includes('remote rejected') ||
    stderr.includes('permission denied')
  ) {
    return new RemoteSyncError('PERMISSION_DENIED', 'Git remote denied the operation', {
      details: { ...details, reasonCode: 'permission-denied' },
    });
  }
  if (
    stderr.includes('certificate') ||
    stderr.includes('ssl certificate problem') ||
    (stderr.includes('tls') && stderr.includes('verify'))
  ) {
    return unavailable('Git TLS verification failed', 'tls-validation-failed', details);
  }
  if (
    stderr.includes('could not resolve host') ||
    stderr.includes('connection timed out') ||
    stderr.includes('connection refused') ||
    stderr.includes('network is unreachable') ||
    stderr.includes('connection reset')
  ) {
    return unavailable('Git remote is unavailable', 'network-error', details);
  }

  return unavailable('Git command failed', 'git-command-failed', details);
}

export function mapGitNetworkPolicyError(operation?: string): RemoteSyncError {
  return new RemoteSyncError('REMOTE_UNAVAILABLE', 'Git remote was blocked by network policy', {
    details: {
      provider: 'git',
      ...(operation ? { operation } : {}),
      reasonCode: 'network-policy-blocked',
    },
  });
}

export function toSafeGitDisplayUrl(remoteUrl: string): string {
  try {
    const url = new URL(remoteUrl);
    url.username = '';
    url.password = '';
    return url.toString();
  } catch {
    return 'git-remote';
  }
}

function decodeForClassification(value: Buffer | string | undefined): string {
  if (!value) {
    return '';
  }
  return Buffer.isBuffer(value) ? value.toString('utf8') : value;
}

function unavailable(
  message: string,
  reasonCode: string,
  details: { provider: string; operation?: string },
): RemoteSyncError {
  return new RemoteSyncError('REMOTE_UNAVAILABLE', message, {
    details: { ...details, reasonCode },
  });
}

function authFailed(
  message: string,
  reasonCode: string,
  details: { provider: string; operation?: string },
): RemoteSyncError {
  return new RemoteSyncError('AUTH_FAILED', message, {
    details: { ...details, reasonCode },
  });
}

function credentialUnavailable(details: { provider: string; operation?: string }): RemoteSyncError {
  return new RemoteSyncError('CREDENTIAL_UNAVAILABLE', 'Git remote credential is required', {
    details: { ...details, reasonCode: 'credential-required' },
  });
}
