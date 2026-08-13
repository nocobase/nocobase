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

  it('rejects HTTP credentials before creating temporary resources', async () => {
    const malformed = await captureError(() =>
      materializer.materialize({
        transport: 'http',
        credential: { kind: 'https', username: 'git-user', password: 'secret' },
      }),
    );
    expect(malformed).toMatchObject({ code: 'AUTH_REF_INVALID', details: { reasonCode: 'http-auth-forbidden' } });
    expect(JSON.stringify(malformed.toResponseBody())).not.toContain('secret');
    expect(await readdir(temporaryDirectory)).toEqual([]);
  });

  it('isolates public HTTP without credential helpers', async () => {
    const result = await materializer.materialize({ transport: 'http' });
    expect(result.environment).not.toHaveProperty('GIT_ASKPASS');
    expect(result.environment).not.toHaveProperty('NBS_GIT_HTTPS_USERNAME');
    expect(result.environment).not.toHaveProperty('NBS_GIT_HTTPS_PASSWORD');
    await result.cleanup();
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
