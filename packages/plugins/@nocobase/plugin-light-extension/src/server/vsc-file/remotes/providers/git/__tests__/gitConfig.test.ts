/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';

import { RemoteSyncError } from '../../../RemoteSyncAdapter';
import { normalizeGitRemoteConfig, normalizeGitRemoteConfigDraft, parseGitRemoteCredential } from '../gitConfig';

function captureRemoteSyncError(callback: () => unknown): RemoteSyncError {
  try {
    callback();
  } catch (error) {
    expect(error).toBeInstanceOf(RemoteSyncError);
    return error as RemoteSyncError;
  }
  throw new Error('Expected callback to throw RemoteSyncError');
}

describe('git remote config', () => {
  it.each([
    ['https://git.example.com/team/project.git', 'https://git.example.com/team/project.git', 'https'],
    ['ssh://git@git.example.com/team/project.git', 'ssh://git@git.example.com/team/project.git', 'ssh'],
    ['git@git.example.com:team/project.git', 'ssh://git@git.example.com/team/project.git', 'ssh'],
  ] as const)('normalizes %s', (input, url, transport) => {
    expect(normalizeGitRemoteConfigDraft({ url: input })).toEqual({
      url,
      branch: null,
      subdirectory: null,
      transport,
    });
  });

  it('normalizes a resolved persistent config canonically', () => {
    expect(
      normalizeGitRemoteConfig({
        url: 'git@git.example.com:team/project.git',
        branch: 'feature/git-sync',
        subdirectory: 'extensions/sales',
        transport: 'ssh',
      }),
    ).toEqual({
      url: 'ssh://git@git.example.com/team/project.git',
      branch: 'feature/git-sync',
      subdirectory: 'extensions/sales',
      transport: 'ssh',
    });
  });

  it('requires a resolved branch and complete shape for persistence', () => {
    for (const config of [
      {
        url: 'https://git.example.com/team/project.git',
        branch: null,
        subdirectory: null,
        transport: 'https',
      },
      {
        url: 'https://git.example.com/team/project.git',
        branch: 'main',
        transport: 'https',
      },
    ]) {
      expect(() => normalizeGitRemoteConfig(config)).toThrowError(expect.objectContaining({ code: 'CONFIG_INVALID' }));
    }
  });

  it.each([
    'http://git.example.com/team/project.git',
    'git://git.example.com/team/project.git',
    'file:///srv/project.git',
    '/srv/project.git',
    './project.git',
    'ext::ssh git.example.com',
    'https://token@git.example.com/team/project.git',
    'https://git.example.com/team/project.git?token=secret',
    'https://git.example.com/team/project.git#branch',
    'ssh://git:password@git.example.com/team/project.git',
  ])('rejects unsafe or unsupported URL %s', (url) => {
    expect(() => normalizeGitRemoteConfigDraft({ url })).toThrowError(
      expect.objectContaining({ code: 'CONFIG_INVALID' }),
    );
  });

  it.each([
    ['http://git.example.com/team/project.git', 'unsupported-url-protocol'],
    ['https://token@git.example.com/team/project.git', 'url-credentials-forbidden'],
    ['ssh://git:password@git.example.com/team/project.git', 'url-credentials-forbidden'],
    ['https://git.example.com/team/project.git?token=secret', 'invalid-url'],
    ['https://git.example.com/team/project.git#main', 'invalid-url'],
    ['ssh://git@git.example.com/team\\project.git', 'invalid-url'],
  ] as const)('preserves the reason code for invalid URL %s', (url, reasonCode) => {
    expect(captureRemoteSyncError(() => normalizeGitRemoteConfigDraft({ url }))).toMatchObject({
      code: 'CONFIG_INVALID',
      details: { reasonCode },
    });
  });

  it.each(['HEAD', 'refs/heads/main', '../main', 'main..next', 'feature//x', '-danger', 'main.lock', 'main~1'])(
    'rejects unsafe branch %s',
    (branch) => {
      expect(() =>
        normalizeGitRemoteConfigDraft({ url: 'https://git.example.com/team/project.git', branch }),
      ).toThrowError(expect.objectContaining({ code: 'CONFIG_INVALID' }));
    },
  );

  it('preserves the invalid branch reason code', () => {
    expect(
      captureRemoteSyncError(() =>
        normalizeGitRemoteConfigDraft({
          url: 'https://git.example.com/team/project.git',
          branch: 'refs/heads/main',
        }),
      ),
    ).toMatchObject({ code: 'CONFIG_INVALID', details: { reasonCode: 'invalid-branch' } });
  });

  it.each(['   ', '/absolute', 'a\\b', 'a/../b', 'a//b', 'a/.git/b', 'a/.GIT/b', 'a/', './a'])(
    'rejects unsafe subdirectory %s',
    (subdirectory) => {
      expect(() =>
        normalizeGitRemoteConfigDraft({ url: 'https://git.example.com/team/project.git', subdirectory }),
      ).toThrowError(expect.objectContaining({ code: 'CONFIG_INVALID' }));
    },
  );

  it('preserves the invalid subdirectory reason code', () => {
    expect(
      captureRemoteSyncError(() =>
        normalizeGitRemoteConfigDraft({
          url: 'https://git.example.com/team/project.git',
          subdirectory: 'a/.GIT/b',
        }),
      ),
    ).toMatchObject({ code: 'CONFIG_INVALID', details: { reasonCode: 'invalid-subdirectory' } });
  });

  it('rejects a supplied transport that disagrees with the URL', () => {
    expect(
      captureRemoteSyncError(() =>
        normalizeGitRemoteConfigDraft({
          url: 'https://git.example.com/team/project.git',
          transport: 'ssh',
        }),
      ),
    ).toMatchObject({ code: 'CONFIG_INVALID', details: { reasonCode: 'transport-mismatch' } });
  });
});

describe('git remote credential contract', () => {
  it('parses strict HTTPS and SSH credential JSON', () => {
    expect(parseGitRemoteCredential('{"kind":"https","username":"git-user","password":"secret"}', 'https')).toEqual({
      kind: 'https',
      username: 'git-user',
      password: 'secret',
    });
    expect(
      parseGitRemoteCredential(
        {
          kind: 'ssh',
          privateKey: 'private-key',
          passphrase: '',
          knownHosts: 'git.example.com ssh-ed25519 AAAA',
        },
        'ssh',
      ),
    ).toEqual({
      kind: 'ssh',
      privateKey: 'private-key',
      passphrase: '',
      knownHosts: 'git.example.com ssh-ed25519 AAAA',
    });
  });

  it('rejects literal HTTPS credentials with an actionable Secret format error', () => {
    expect(captureRemoteSyncError(() => parseGitRemoteCredential('github_pat_direct_123', 'https'))).toMatchObject({
      code: 'AUTH_REF_INVALID',
      details: { reasonCode: 'invalid-credential-json' },
    });
  });

  it.each([
    [{ kind: 'https', username: 'git-user', password: '' }, 'https'],
    [{ kind: 'https', username: 'git-user', password: 'secret', token: 'secret' }, 'https'],
    [{ kind: 'ssh', privateKey: '', knownHosts: 'host key' }, 'ssh'],
    [{ kind: 'ssh', privateKey: 'key', knownHosts: '' }, 'ssh'],
    [{ kind: 'ssh', privateKey: 'key', knownHosts: 'host key' }, 'https'],
  ] as const)('rejects invalid credentials without exposing values', (credential, transport) => {
    const error = captureRemoteSyncError(() => parseGitRemoteCredential(credential, transport));
    expect(error.code).toBe('AUTH_REF_INVALID');
    expect(JSON.stringify(error.toResponseBody())).not.toMatch(/git-user|secret|host key/iu);
  });
});
