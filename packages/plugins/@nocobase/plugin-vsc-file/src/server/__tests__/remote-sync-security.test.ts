/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Context } from '@nocobase/actions';
import type { Database } from '@nocobase/database';
import type { HandlerType } from '@nocobase/resourcer';
import { AuditManager, type AuditLog } from '@nocobase/server';
import { vi } from 'vitest';

import {
  createRemoteSyncAuditAction,
  createRemoteSyncAuditActions,
  createRemoteSyncAuditEmitter,
} from '../remotes/audit';
import { parseVscRemoteAuthRef, validateVscRemoteAuthRef } from '../remotes/credentialRef';
import { createRemoteInternalResources } from '../remotes/resource';
import { RemoteSyncError } from '../remotes/RemoteSyncAdapter';
import { GitHubRemoteAdapter } from '../remotes/providers/github/GitHubRemoteAdapter';
import type { GitHubApi, GitHubTreeEntry } from '../remotes/providers/github/githubTypes';
import { RemoteStore } from '../remotes/RemoteStore';
import { RemoteCredentialResolver } from '../remotes/security/RemoteCredentialResolver';
import { VscRemotePushService } from '../remotes/VscRemotePushService';
import {
  acceptanceRemoteConfig,
  createRemoteSyncAcceptanceFixture,
  type RemoteSyncAcceptanceFixture,
} from './helpers/remoteSyncAcceptance';

describe('remote sync server security acceptance', () => {
  let fixture: RemoteSyncAcceptanceFixture | undefined;

  afterEach(async () => {
    vi.restoreAllMocks();
    await fixture?.close();
    fixture = undefined;
  });

  it('rejects credential aliases and nested secret material at both normalization and persistence boundaries', async () => {
    fixture = await createRemoteSyncAcceptanceFixture();
    const created = await fixture.vsc.createRepository({ ownerType: 'plugin', ownerId: 'security', name: 'main' });
    const unsafeConfigs = [
      { ...acceptanceRemoteConfig, token: 'ghp_secret' },
      { ...acceptanceRemoteConfig, authorization: 'Bearer secret' },
      { ...acceptanceRemoteConfig, nested: { privateKey: 'secret' } },
    ];

    for (const config of unsafeConfigs) {
      expect(() => fixture.adapter.normalizeConfig(config)).toThrowError(
        expect.objectContaining({ code: 'CONFIG_INVALID' }),
      );
      await expect(
        new RemoteStore(fixture.db).create({
          repoId: created.repository.id,
          name: 'origin',
          provider: 'github',
          config: config as typeof acceptanceRemoteConfig,
          authRef: null,
        }),
      ).rejects.toMatchObject({ code: 'CONFIG_INVALID' });
    }
    await expect(fixture.db.getRepository('vscFileRemotes').count()).resolves.toBe(0);
  });

  it('accepts a secret expression or direct credential and rejects mixed, missing, and non-secret references', async () => {
    expect(parseVscRemoteAuthRef('{{ $env.GITHUB_SYNC }}')).toMatchObject({ name: 'GITHUB_SYNC' });
    expect(parseVscRemoteAuthRef('github_pat_test_direct_123')).toMatchObject({
      value: 'github_pat_test_direct_123',
    });
    for (const invalid of ['prefix {{ $env.GITHUB_SYNC }}', '{{ $env.MISSING }} suffix', '']) {
      expect(() => parseVscRemoteAuthRef(invalid)).toThrowError(RemoteSyncError);
    }
    await expect(validateVscRemoteAuthRef('github_pat_test_direct_123', async () => null)).resolves.toMatchObject({
      value: 'github_pat_test_direct_123',
    });
    await expect(validateVscRemoteAuthRef('{{ $env.MISSING }}', async () => null)).rejects.toMatchObject({
      code: 'AUTH_REF_INVALID',
    });
    await expect(
      validateVscRemoteAuthRef('{{ $env.PUBLIC }}', async (name) => ({ name, type: 'string' })),
    ).rejects.toMatchObject({ code: 'AUTH_REF_INVALID' });
    await expect(
      validateVscRemoteAuthRef('{{ $env.EMPTY_SECRET }}', async (name) => ({ name, type: 'secret' })),
    ).resolves.toMatchObject({ name: 'EMPTY_SECRET' });
    const resolver = new RemoteCredentialResolver({
      db: createCredentialDatabase({ EMPTY_SECRET: 'secret' }),
      environment: { getVariables: () => ({ EMPTY_SECRET: '   ' }) },
    });
    await expect(resolver.resolve('{{ $env.EMPTY_SECRET }}')).rejects.toMatchObject({
      code: 'CREDENTIAL_UNAVAILABLE',
      details: { reasonCode: 'credential-value-invalid' },
    });
  });

  it.each([
    { ...acceptanceRemoteConfig, owner: 'https://169.254.169.254/latest/meta-data' },
    { ...acceptanceRemoteConfig, repository: 'https://example.invalid/repo.git' },
    { ...acceptanceRemoteConfig, branch: 'https://example.invalid/redirect' },
    { ...acceptanceRemoteConfig, subdirectory: '/absolute/path' },
    { ...acceptanceRemoteConfig, subdirectory: 'safe/../../escape' },
  ])('rejects SSRF-shaped, absolute, and traversal provider config without a network request', (config) => {
    const api = createGitHubApi({ tree: [], truncated: false });
    const adapter = new GitHubRemoteAdapter({
      api,
      credentialResolver: { resolve: vi.fn(async () => null) },
    });
    expect(() => adapter.normalizeConfig(config)).toThrowError(expect.objectContaining({ code: 'CONFIG_INVALID' }));
    expect(api.getRepository).not.toHaveBeenCalled();
    expect(api.getRef).not.toHaveBeenCalled();
  });

  it('rejects truncated trees, symlinks, gitlinks, LFS pointers, and binary blobs from a fake GitHub API', async () => {
    const cases: Array<{
      tree: { tree: GitHubTreeEntry[]; truncated: boolean };
      blob?: Buffer;
      reasonCode: string;
    }> = [
      { tree: { tree: [], truncated: true }, reasonCode: 'truncated-tree' },
      {
        tree: { tree: [treeEntry('link', '120000', 'blob')], truncated: false },
        reasonCode: 'symlink-unsupported',
      },
      {
        tree: { tree: [treeEntry('module', '160000', 'commit')], truncated: false },
        reasonCode: 'gitlink-unsupported',
      },
      {
        tree: { tree: [treeEntry('large.ts', '100644', 'blob')], truncated: false },
        blob: Buffer.from('version https://git-lfs.github.com/spec/v1\noid sha256:abc\nsize 1\n'),
        reasonCode: 'lfs-unsupported',
      },
      {
        tree: { tree: [treeEntry('binary.ts', '100644', 'blob')], truncated: false },
        blob: Buffer.from([0x61, 0x00, 0x62]),
        reasonCode: 'binary-content',
      },
    ];

    for (const unsafe of cases) {
      const api = createGitHubApi(unsafe.tree, unsafe.blob);
      const adapter = new GitHubRemoteAdapter({
        api,
        credentialResolver: { resolve: vi.fn(async () => null) },
      });
      await expect(adapter.fetchSnapshot({ config: acceptanceRemoteConfig, authRef: null })).rejects.toMatchObject({
        code: 'UNSAFE_CONTENT',
        details: { reasonCode: unsafe.reasonCode },
      });
    }
  });

  it.each(createRemoteInternalResources())('denies every raw action on $name', async (resource) => {
    for (const action of Object.values(resource.actions || {}) as HandlerType[]) {
      const ctx: Record<string, unknown> = {};
      await action(ctx, async () => undefined);
      expect(ctx).toMatchObject({
        status: 403,
        body: { errors: [{ code: 'PERMISSION_DENIED', details: { reasonCode: 'remote-internal-resource' } }] },
      });
    }
  });

  it('sanitizes an injected unsafe provider failure and the actual audit request/response metadata', async () => {
    fixture = await createRemoteSyncAcceptanceFixture();
    const currentFixture = fixture;
    const setup = await currentFixture.createLocalRemote('unsafe-provider-error', '{{ $env.GITHUB_SYNC }}');
    const input = await currentFixture.createPushInput(setup.remote, setup.commitId);
    const token = 'github_pat_012345678901234567890123456789';
    const rawError = Object.assign(new Error(`Authorization: Bearer ${token}; source=secret-source`), {
      cause: new Error(token),
      config: { headers: { Authorization: `Bearer ${token}` } },
      request: { body: 'secret-source' },
      response: { data: token },
    });
    vi.spyOn(currentFixture.adapter, 'fetchSnapshot').mockRejectedValueOnce(rawError);

    const error = await captureError(() =>
      new VscRemotePushService(currentFixture.db, {
        adapterRegistry: currentFixture.adapterRegistry,
      }).push(input),
    );
    expect(error).toBeInstanceOf(RemoteSyncError);
    const responseBody = error instanceof RemoteSyncError ? error.toResponseBody() : error;
    const auditMetadata = await createRemoteSyncAuditAction('vscRemote:push').getMetaData({
      action: { params: { values: { ...input, authRef: token } } },
      request: {
        params: { remoteId: setup.remote.id },
        query: { operation: 'push', authorization: token },
        body: { ...input, files: [{ path: 'secret.ts', content: 'secret-source' }], token },
      },
      body: { data: responseBody },
    } as unknown as Context);
    const serialized = JSON.stringify({ error, responseBody, auditMetadata });

    expect(Object.hasOwn(error as object, 'cause')).toBe(false);
    expect(auditMetadata).toMatchObject({
      remoteId: setup.remote.id,
      operation: 'push',
      request: { body: { remoteId: setup.remote.id, fileCount: 1 }, headers: {} },
      response: { body: expect.any(Object) },
    });
    expect(serialized).not.toContain(token);
    expect(serialized).not.toContain('secret-source');
    expect(serialized).not.toMatch(/authorization|privateKey|"request"\s*:\s*\{[^}]*secret/iu);

    const manager = new AuditManager();
    manager.registerActions(createRemoteSyncAuditActions());
    const logged: AuditLog[] = [];
    const loggerOutput: string[] = [];
    manager.setLogger({
      log: async (auditLog) => {
        logged.push(auditLog);
        loggerOutput.push(JSON.stringify(auditLog));
      },
    });
    await createRemoteSyncAuditEmitter(manager)('push', {
      remoteId: setup.remote.id,
      operation: 'push',
      status: 'failed',
      result: 'failed',
      reasonCode: 'provider-unavailable',
      token,
      authorization: `Bearer ${token}`,
      source: 'secret-source',
      files: [{ path: 'secret.ts', content: 'secret-source' }],
      providerError: rawError,
    });

    expect(logged).toHaveLength(1);
    expect(logged[0]).toMatchObject({
      resource: 'vscRemote',
      action: 'push',
      metadata: {
        request: { body: { remoteId: setup.remote.id, operation: 'push', status: 'failed', fileCount: 1 } },
        response: { body: { remoteId: setup.remote.id, operation: 'push', status: 'failed', fileCount: 1 } },
      },
    });
    expect(loggerOutput).toHaveLength(1);
    expect(loggerOutput[0]).not.toContain(token);
    expect(loggerOutput[0]).not.toContain('secret-source');
    expect(loggerOutput[0]).not.toMatch(/authorization|providerError|secret\.ts/iu);
  });
});

function createCredentialDatabase(records: Record<string, string>): Database {
  return {
    hasCollection: (name: string) => name === 'environmentVariables',
    getRepository: () => ({
      collection: { existsInDb: async () => true },
      findOne: async (options: { filterByTk?: string }) => {
        const name = options.filterByTk;
        const type = name ? records[name] : undefined;
        return name && type ? { get: (field: string) => (field === 'name' ? name : type) } : null;
      },
    }),
  } as unknown as Database;
}

async function captureError(run: () => Promise<unknown>): Promise<unknown> {
  try {
    await run();
  } catch (error) {
    return error;
  }
  throw new Error('Expected operation to fail');
}

function treeEntry(path: string, mode: string, type: GitHubTreeEntry['type']): GitHubTreeEntry {
  return { path, mode, type, sha: `blob-${path}`, size: 64 };
}

function createGitHubApi(
  tree: { tree: GitHubTreeEntry[]; truncated: boolean },
  blob = Buffer.from('safe text'),
): GitHubApi {
  return {
    getRepository: vi.fn(async () => ({ default_branch: 'main', private: false, archived: false })),
    getRef: vi.fn(async () => ({ ref: 'refs/heads/main', object: { type: 'commit', sha: 'commit-1' } })),
    getCommit: vi.fn(async () => ({ sha: 'commit-1', tree: { sha: 'tree-1' } })),
    getTree: vi.fn(async () => ({
      sha: 'tree-1',
      truncated: tree.truncated,
      tree: tree.tree.map((entry) =>
        entry.type === 'blob' && entry.mode === '100644' ? { ...entry, size: blob.byteLength } : entry,
      ),
    })),
    getBlob: vi.fn(async (_owner, _repository, sha) => ({
      sha,
      content: blob.toString('base64'),
      encoding: 'base64',
      size: blob.byteLength,
    })),
    createBlob: vi.fn(async () => ({ sha: 'created-blob' })),
    createTree: vi.fn(async () => ({ sha: 'created-tree' })),
    createCommit: vi.fn(async () => ({ sha: 'created-commit' })),
    updateRef: vi.fn(async () => undefined),
    createRef: vi.fn(async () => undefined),
  };
}
