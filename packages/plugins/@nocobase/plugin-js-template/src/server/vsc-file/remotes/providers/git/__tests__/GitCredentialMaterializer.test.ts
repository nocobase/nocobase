/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { access, chmod, mkdir, mkdtemp, readFile, readdir, rm, stat, utimes } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { RemoteSyncError } from '../../../RemoteSyncAdapter';
import { GitCredentialMaterializer, gitCommandTemporaryDirectoryPrefix } from '../GitCredentialMaterializer';

describe('GitCredentialMaterializer', () => {
  let temporaryDirectory: string;
  let materializer: GitCredentialMaterializer;

  beforeEach(async () => {
    temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), 'git-credential-materializer-test-'));
    materializer = new GitCredentialMaterializer({ temporaryDirectory });
  });

  afterEach(async () => {
    await rm(temporaryDirectory, { force: true, recursive: true });
  });

  it('keeps HTTPS credentials only in the private child environment', async () => {
    const username = 'oauth-user-do-not-write';
    const password = 'password-do-not-write';
    const result = await materializer.materialize({
      transport: 'https',
      credential: { kind: 'https', username, password },
    });

    const askpassPath = result.environment.GIT_ASKPASS as string;
    const askpass = await readFile(askpassPath, 'utf8');
    expect(askpass).toContain('NBS_GIT_HTTPS_USERNAME');
    expect(askpass).toContain('NBS_GIT_HTTPS_PASSWORD');
    expect(askpass).not.toContain(username);
    expect(askpass).not.toContain(password);
    if (process.platform !== 'win32') {
      expect((await stat(result.rootDirectory)).mode & 0o777).toBe(0o700);
      expect((await stat(askpassPath)).mode & 0o777).toBe(0o700);
    }
    expect(result.environment).toMatchObject({
      GIT_TERMINAL_PROMPT: '0',
      GIT_CONFIG_NOSYSTEM: '1',
      GIT_CONFIG_GLOBAL: process.platform === 'win32' ? 'NUL' : '/dev/null',
      HOME: result.homeDirectory,
      XDG_CONFIG_HOME: result.xdgConfigDirectory,
    });

    await result.cleanup();
    await result.cleanup();
    await expect(access(result.rootDirectory)).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it('writes SSH material with private permissions and a strict secret-free wrapper', async () => {
    const privateKey = '-----BEGIN PRIVATE KEY-----\nprivate-material\n-----END PRIVATE KEY-----';
    const passphrase = 'passphrase-do-not-write';
    const knownHosts = 'git.example.com ssh-ed25519 known-host-material';
    const result = await materializer.materialize({
      transport: 'ssh',
      sshBinary: '/usr/bin/ssh',
      credential: { kind: 'ssh', privateKey, passphrase, knownHosts },
    });

    const privateKeyPath = result.environment.NBS_GIT_SSH_PRIVATE_KEY as string;
    const knownHostsPath = result.environment.NBS_GIT_SSH_KNOWN_HOSTS as string;
    const wrapperPath = result.environment.GIT_SSH as string;
    const wrapper = await readFile(wrapperPath, 'utf8');
    if (process.platform !== 'win32') {
      expect((await stat(privateKeyPath)).mode & 0o777).toBe(0o600);
      expect((await stat(knownHostsPath)).mode & 0o777).toBe(0o600);
    }
    expect(await readFile(privateKeyPath, 'utf8')).toBe(privateKey);
    expect(await readFile(knownHostsPath, 'utf8')).toBe(knownHosts);
    expect(wrapper).toMatch(/IdentitiesOnly=yes/u);
    expect(wrapper).toMatch(/IdentityAgent=none/u);
    expect(wrapper).toMatch(/StrictHostKeyChecking=yes/u);
    expect(wrapper).toMatch(/UserKnownHostsFile=/u);
    expect(wrapper).toMatch(/GlobalKnownHostsFile=\/dev\/null/u);
    expect(wrapper).toMatch(/PasswordAuthentication=no/u);
    expect(wrapper).toMatch(/KbdInteractiveAuthentication=no/u);
    expect(wrapper).not.toMatch(/StrictHostKeyChecking=(?:no|accept-new)/u);
    expect(wrapper).not.toContain(privateKey);
    expect(wrapper).not.toContain(passphrase);
    expect(wrapper).not.toContain(knownHosts);
    expect(result.environment).not.toHaveProperty('SSH_AUTH_SOCK');

    await result.cleanup();
    await expect(access(privateKeyPath)).rejects.toMatchObject({ code: 'ENOENT' });
    await expect(access(knownHostsPath)).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it('uses the process user SSH environment when the credential is omitted', async () => {
    const originalAgent = process.env.SSH_AUTH_SOCK;
    process.env.SSH_AUTH_SOCK = '/run/user/1000/ssh-agent.sock';
    try {
      const result = await materializer.materialize({ transport: 'ssh' });
      expect(result.environment).toMatchObject({
        HOME: process.env.HOME || os.homedir(),
        SSH_AUTH_SOCK: '/run/user/1000/ssh-agent.sock',
      });
      expect(result.environment).not.toHaveProperty('GIT_SSH');
      await result.cleanup();
    } finally {
      if (originalAgent === undefined) {
        delete process.env.SSH_AUTH_SOCK;
      } else {
        process.env.SSH_AUTH_SOCK = originalAgent;
      }
    }
  });

  it('rejects malformed SSH credentials without leaving temporary resources', async () => {
    const malformed = await captureError(() =>
      materializer.materialize({
        transport: 'ssh',
        credential: { kind: 'ssh', privateKey: 'key', knownHosts: '' },
      }),
    );
    expect(malformed).toMatchObject({ code: 'AUTH_REF_INVALID', details: { reasonCode: 'invalid-known-hosts' } });
    expect(JSON.stringify(malformed.toResponseBody())).not.toContain('privateKey');
    expect(await readdir(temporaryDirectory)).toEqual([]);
  });

  it('cleans only expired directories created by this module', async () => {
    const expired = path.join(temporaryDirectory, `${gitCommandTemporaryDirectoryPrefix}expired`);
    const recent = path.join(temporaryDirectory, `${gitCommandTemporaryDirectoryPrefix}recent`);
    const unrelated = path.join(temporaryDirectory, 'unrelated');
    await Promise.all([mkdir(expired), mkdir(recent), mkdir(unrelated)]);
    await chmod(expired, 0o700);
    const now = Date.now();
    await utimes(expired, new Date(now - 20_000), new Date(now - 20_000));

    expect(await materializer.cleanupOrphans(10_000, now)).toBe(1);
    expect(await readdir(temporaryDirectory)).toEqual([`${gitCommandTemporaryDirectoryPrefix}recent`, 'unrelated']);
  });
});

async function captureError(callback: () => Promise<unknown>): Promise<RemoteSyncError> {
  try {
    await callback();
  } catch (error) {
    expect(error).toBeInstanceOf(RemoteSyncError);
    return error as RemoteSyncError;
  }
  throw new Error('Expected operation to throw RemoteSyncError');
}
