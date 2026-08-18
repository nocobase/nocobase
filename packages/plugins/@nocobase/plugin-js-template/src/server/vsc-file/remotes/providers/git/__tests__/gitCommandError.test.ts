/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';

import { mapGitCommandError, mapGitNetworkPolicyError, toSafeGitDisplayUrl } from '../gitCommandError';

describe('git command error mapping', () => {
  it.each([
    ['Authentication failed for secret-password', true, 'AUTH_FAILED', 'invalid-credential'],
    [
      'fatal: could not read Username for https://git.example.com',
      false,
      'CREDENTIAL_UNAVAILABLE',
      'credential-required',
    ],
    ['fatal: repository not found', true, 'REMOTE_NOT_FOUND', 'remote-not-found'],
    ['fatal: unable to access: The requested URL returned error: 403', true, 'PERMISSION_DENIED', 'permission-denied'],
    [
      'fatal: SSL certificate problem: unable to get local issuer certificate',
      true,
      'REMOTE_UNAVAILABLE',
      'tls-validation-failed',
    ],
    ['fatal: Could not resolve host: git.example.com', true, 'REMOTE_UNAVAILABLE', 'network-error'],
    ['fatal: unable to access: Connection refused', false, 'REMOTE_UNAVAILABLE', 'network-error'],
  ] as const)('maps a stable safe error for %s', (stderr, credentialProvided, code, reasonCode) => {
    const error = mapGitCommandError({
      binary: 'git',
      operation: 'fetch',
      stderr,
      exitCode: 128,
      credentialProvided,
    });
    expect(error).toMatchObject({ code, details: { provider: 'git', operation: 'fetch', reasonCode } });
    const serialized = JSON.stringify(error.toResponseBody());
    expect(serialized).not.toContain(stderr);
    expect(serialized).not.toMatch(/secret-password|\/private\/job\/key|git\.example\.com/u);
  });

  it.each([
    [{ binary: 'git', errorCode: 'ENOENT' }, 'git-binary-unavailable'],
    [{ binary: 'git', terminationReason: 'timeout' }, 'command-timeout'],
    [{ binary: 'git', terminationReason: 'aborted' }, 'command-aborted'],
    [{ binary: 'git', terminationReason: 'stdout-limit' }, 'command-output-limit'],
    [{ binary: 'git', terminationReason: 'stderr-limit' }, 'command-output-limit'],
  ] as const)('maps process failures to %s', (context, reasonCode) => {
    expect(mapGitCommandError(context)).toMatchObject({
      code: 'REMOTE_UNAVAILABLE',
      details: { provider: 'git', reasonCode },
    });
  });

  it('returns a safe error for outbound policy rejection', () => {
    expect(mapGitNetworkPolicyError('ls-remote')).toMatchObject({
      code: 'REMOTE_UNAVAILABLE',
      details: { provider: 'git', operation: 'ls-remote', reasonCode: 'network-policy-blocked' },
    });
  });

  it('removes URL userinfo from safe display values', () => {
    expect(toSafeGitDisplayUrl('https://git:should-not-appear@git.example.com:8443/team/project.git')).toBe(
      'https://git.example.com:8443/team/project.git',
    );
    expect(toSafeGitDisplayUrl('not-a-url')).toBe('git-remote');
  });
});
