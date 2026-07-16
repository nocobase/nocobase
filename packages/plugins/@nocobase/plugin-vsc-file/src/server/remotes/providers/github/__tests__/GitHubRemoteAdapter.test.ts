/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';

import type { VscRemoteSnapshot, VscRemoteSnapshotFile } from '../../../../../shared/remote-sync-types';
import { RemoteSyncError, type RemoteSyncAdapterTarget } from '../../../RemoteSyncAdapter';
import { computeRemoteSnapshotContentHash } from '../../../snapshot';
import { GitHubRemoteAdapter } from '../GitHubRemoteAdapter';
import type { GitHubApi, GitHubBlob, GitHubTree, GitHubTreeEntry } from '../githubTypes';

const baseConfig = {
  owner: 'nocobase',
  repository: 'extensions',
  branch: 'main',
  subdirectory: 'packages/light',
};

function createTarget(
  overrides: Partial<typeof baseConfig> = {},
  authRef: string | null = null,
): RemoteSyncAdapterTarget {
  return {
    config: { ...baseConfig, ...overrides },
    authRef,
  };
}

function createSnapshot(files: readonly VscRemoteSnapshotFile[]): VscRemoteSnapshot {
  return {
    revision: null,
    contentHash: computeRemoteSnapshotContentHash(files),
    files: files.map((file) => ({ ...file })),
    metadata: {},
  };
}

function createTreeEntry(
  path: string,
  content: Buffer | string,
  overrides: Partial<GitHubTreeEntry> = {},
): GitHubTreeEntry {
  const bytes = typeof content === 'string' ? Buffer.from(content) : content;
  return {
    path,
    mode: '100644',
    type: 'blob',
    sha: `blob-${path.replace(/[^A-Za-z0-9]/gu, '-')}`,
    size: bytes.byteLength,
    ...overrides,
  };
}

function createBlob(content: Buffer | string, sha = 'blob'): GitHubBlob {
  const bytes = typeof content === 'string' ? Buffer.from(content) : content;
  return {
    sha,
    content: bytes.toString('base64'),
    encoding: 'base64',
    size: bytes.byteLength,
  };
}

function createApi(): GitHubApi {
  return {
    getRepository: vi.fn(async () => ({ default_branch: 'main', private: false, archived: false })),
    getRef: vi.fn(async () => ({ ref: 'refs/heads/main', object: { type: 'commit', sha: 'commit1' } })),
    getCommit: vi.fn(async () => ({ sha: 'commit1', tree: { sha: 'tree1' } })),
    getTree: vi.fn(async () => ({ sha: 'tree1', tree: [], truncated: false })),
    getBlob: vi.fn(async (_owner, _repository, sha) => createBlob('', sha)),
    createBlob: vi.fn(async () => ({ sha: 'blob-created' })),
    createTree: vi.fn(async () => ({ sha: 'tree-created' })),
    createCommit: vi.fn(async () => ({ sha: 'commit-created' })),
    updateRef: vi.fn(async () => undefined),
    createRef: vi.fn(async () => undefined),
  };
}

function createAdapter(
  api: GitHubApi,
  credential: string | null = null,
  limits?: ConstructorParameters<typeof GitHubRemoteAdapter>[0]['limits'],
) {
  return new GitHubRemoteAdapter({
    api,
    credentialResolver: {
      resolve: vi.fn(async (_authRef, mode) => {
        if (mode === 'required' && !credential) {
          throw new RemoteSyncError('CREDENTIAL_UNAVAILABLE', 'Credential is required', {
            details: { reasonCode: 'credential-required' },
          });
        }
        return credential;
      }),
    },
    limits,
  });
}

describe('GitHubRemoteAdapter config and probe', () => {
  it('strictly normalizes config and allows an empty branch only for default-branch discovery', async () => {
    const api = createApi();
    const adapter = createAdapter(api);

    expect(
      adapter.normalizeConfig({
        owner: 'nocobase',
        repository: 'plugin_demo.js',
        branch: 'feature/safe',
        subdirectory: 'packages/demo',
      }),
    ).toEqual({
      owner: 'nocobase',
      repository: 'plugin_demo.js',
      branch: 'feature/safe',
      subdirectory: 'packages/demo',
    });

    const result = await adapter.probe(createTarget({ branch: '' }));
    expect(result).toEqual({
      revision: 'commit1',
      metadata: {
        branch: 'main',
        defaultBranch: 'main',
        private: false,
        archived: false,
        treeSha: null,
      },
    });
    expect(api.getRef).toHaveBeenCalledWith('nocobase', 'extensions', 'main', null);
  });

  it.each([
    [{ ...baseConfig, token: 'credential-alias' }],
    [{ ...baseConfig, auth: 'credential-alias' }],
    [{ ...baseConfig, owner: { name: 'nocobase' } }],
    [{ ...baseConfig, owner: '-invalid' }],
    [{ ...baseConfig, repository: 'invalid/repository' }],
    [{ ...baseConfig, branch: 'unsafe..branch' }],
    [{ ...baseConfig, subdirectory: '/absolute' }],
    [{ ...baseConfig, subdirectory: 'a//b' }],
    [{ ...baseConfig, subdirectory: 'a/../b' }],
    [{ ...baseConfig, subdirectory: 'a\\b' }],
    [{ ...baseConfig, subdirectory: 'a/.git/b' }],
    [{ ...baseConfig, repository: 'x'.repeat(101) }],
  ])('rejects unknown, credential, nested, unsafe, and oversized config: %j', (config) => {
    const adapter = createAdapter(createApi());
    expect(() => adapter.normalizeConfig(config)).toThrowError(expect.objectContaining({ code: 'CONFIG_INVALID' }));
  });

  it('supports anonymous public probe and reports a missing branch as revision null', async () => {
    const api = createApi();
    api.getRef = vi.fn(async () => null);
    const resolver = { resolve: vi.fn(async () => null) };
    const adapter = new GitHubRemoteAdapter({ api, credentialResolver: resolver });

    await expect(adapter.probe(createTarget())).resolves.toMatchObject({ revision: null });
    expect(resolver.resolve).toHaveBeenCalledWith(null, 'optional');
    expect(api.getRepository).toHaveBeenCalledWith('nocobase', 'extensions', null);
  });

  it('rejects malformed repository metadata instead of weakening safety flags', async () => {
    const api = createApi();
    api.getRepository = vi.fn(async () => ({
      default_branch: 'main',
      private: 'false',
      archived: false,
    })) as unknown as GitHubApi['getRepository'];
    const adapter = createAdapter(api);

    await expect(adapter.probe(createTarget())).rejects.toMatchObject({
      code: 'UNSAFE_CONTENT',
      details: { reasonCode: 'invalid-repository-response' },
    });
    expect(api.getRef).not.toHaveBeenCalled();
  });
});

describe('GitHubRemoteAdapter fetch', () => {
  it('fetches a fixed commit snapshot, strips the subdirectory, ignores outside files, and hashes content', async () => {
    const api = createApi();
    const insideContent = 'export const value = 1;\n';
    api.getTree = vi.fn(async () => ({
      sha: 'tree1',
      truncated: false,
      tree: [
        { path: 'packages/light', mode: '040000', type: 'tree', sha: 'subtree' },
        createTreeEntry('packages/light/index.ts', insideContent, { sha: 'inside-blob', mode: '100755' }),
        createTreeEntry('outside.txt', 'outside\n', { sha: 'outside-blob' }),
      ],
    }));
    api.getBlob = vi.fn(async (_owner, _repository, sha) => {
      if (sha !== 'inside-blob') {
        throw new Error('outside blob must not be fetched');
      }
      return createBlob(insideContent, sha);
    });
    const adapter = createAdapter(api);

    const snapshot = await adapter.fetchSnapshot(createTarget());

    expect(snapshot).toEqual({
      revision: 'commit1',
      contentHash: computeRemoteSnapshotContentHash([{ path: 'index.ts', content: insideContent, mode: '100755' }]),
      files: [{ path: 'index.ts', content: insideContent, mode: '100755' }],
      metadata: {
        branch: 'main',
        defaultBranch: 'main',
        private: false,
        archived: false,
        treeSha: 'tree1',
      },
    });
    expect(api.getCommit).toHaveBeenCalledWith('nocobase', 'extensions', 'commit1', null);
    expect(api.getTree).toHaveBeenCalledWith('nocobase', 'extensions', 'tree1', true, null);
    expect(api.getBlob).toHaveBeenCalledTimes(1);
  });

  it('returns an empty snapshot for a branch that does not exist', async () => {
    const api = createApi();
    api.getRef = vi.fn(async () => null);
    const adapter = createAdapter(api);

    await expect(adapter.fetchSnapshot(createTarget())).resolves.toEqual({
      revision: null,
      contentHash: computeRemoteSnapshotContentHash([]),
      files: [],
      metadata: {
        branch: 'main',
        defaultBranch: 'main',
        private: false,
        archived: false,
        treeSha: null,
      },
    });
    expect(api.getCommit).not.toHaveBeenCalled();
  });

  it('accepts an ordinary empty UTF-8 blob', async () => {
    const api = createApi();
    api.getTree = vi.fn(async () => ({
      sha: 'tree1',
      tree: [createTreeEntry('packages/light/empty.ts', '', { sha: 'empty-blob' })],
      truncated: false,
    }));
    api.getBlob = vi.fn(async () => createBlob('', 'empty-blob'));
    const adapter = createAdapter(api);

    await expect(adapter.fetchSnapshot(createTarget())).resolves.toMatchObject({
      files: [{ path: 'empty.ts', content: '', mode: '100644' }],
    });
  });

  it('rejects a truncated recursive tree before reading blobs', async () => {
    const api = createApi();
    api.getTree = vi.fn(async () => ({ sha: 'tree1', tree: [], truncated: true }));
    const adapter = createAdapter(api);

    await expect(adapter.fetchSnapshot(createTarget())).rejects.toMatchObject({
      code: 'UNSAFE_CONTENT',
      details: { reasonCode: 'truncated-tree' },
    });
    expect(api.getBlob).not.toHaveBeenCalled();
  });

  it.each([
    ['symlink', createTreeEntry('packages/light/link', 'target', { mode: '120000' }), 'symlink-unsupported'],
    [
      'gitlink',
      createTreeEntry('packages/light/module', '', { mode: '160000', type: 'commit' }),
      'gitlink-unsupported',
    ],
  ])('rejects %s entries before reading blobs', async (_name, entry, reasonCode) => {
    const api = createApi();
    api.getTree = vi.fn(async () => ({ sha: 'tree1', tree: [entry], truncated: false }));
    const adapter = createAdapter(api);

    await expect(adapter.fetchSnapshot(createTarget())).rejects.toMatchObject({
      code: 'UNSAFE_CONTENT',
      details: { reasonCode },
    });
    expect(api.getBlob).not.toHaveBeenCalled();
  });

  it.each([
    [
      'LFS pointer',
      Buffer.from('version https://git-lfs.github.com/spec/v1\noid sha256:abc\nsize 1\n'),
      'lfs-unsupported',
    ],
    ['binary control content', Buffer.from([0x61, 0x00, 0x62]), 'binary-content'],
    ['invalid UTF-8', Buffer.from([0xff, 0xfe]), 'invalid-utf8'],
  ])('rejects %s blobs', async (_name, content, reasonCode) => {
    const api = createApi();
    const entry = createTreeEntry('packages/light/file.ts', content, { sha: 'unsafe-blob' });
    api.getTree = vi.fn(async () => ({ sha: 'tree1', tree: [entry], truncated: false }));
    api.getBlob = vi.fn(async () => createBlob(content, 'unsafe-blob'));
    const adapter = createAdapter(api);

    await expect(adapter.fetchSnapshot(createTarget())).rejects.toMatchObject({
      code: 'UNSAFE_CONTENT',
      details: { reasonCode },
    });
  });

  it('rejects duplicate and case-conflicting paths', async () => {
    const api = createApi();
    api.getTree = vi.fn(async () => ({
      sha: 'tree1',
      truncated: false,
      tree: [createTreeEntry('packages/light/Index.ts', ''), createTreeEntry('packages/light/index.ts', '')],
    }));
    const adapter = createAdapter(api);

    await expect(adapter.fetchSnapshot(createTarget())).rejects.toMatchObject({
      code: 'UNSAFE_CONTENT',
      details: { reasonCode: 'case-conflicting-path' },
    });
  });

  it('limits concurrent blob reads', async () => {
    const api = createApi();
    const entries = ['a.ts', 'b.ts', 'c.ts', 'd.ts'].map((path) =>
      createTreeEntry(`packages/light/${path}`, path, { sha: `blob-${path}` }),
    );
    api.getTree = vi.fn(async () => ({ sha: 'tree1', tree: entries, truncated: false }));
    let active = 0;
    let maxActive = 0;
    api.getBlob = vi.fn(async (_owner, _repository, sha) => {
      active += 1;
      maxActive = Math.max(maxActive, active);
      await new Promise<void>((resolve) => setImmediate(resolve));
      active -= 1;
      const path = sha.slice('blob-'.length);
      return createBlob(path, sha);
    });
    const adapter = createAdapter(api, null, { blobConcurrency: 2 });

    await adapter.fetchSnapshot(createTarget());

    expect(maxActive).toBe(2);
    expect(api.getBlob).toHaveBeenCalledTimes(4);
  });

  it.each([
    [
      'file count',
      { maxFiles: 1 },
      [createTreeEntry('packages/light/a.ts', ''), createTreeEntry('packages/light/b.ts', '')],
      'file-count-limit',
    ],
    ['single file bytes', { maxFileBytes: 2 }, [createTreeEntry('packages/light/a.ts', 'abc')], 'file-size-limit'],
    [
      'total bytes',
      { maxTotalBytes: 3 },
      [createTreeEntry('packages/light/a.ts', 'ab'), createTreeEntry('packages/light/b.ts', 'cd')],
      'total-size-limit',
    ],
  ])('preflights the %s budget before blob reads', async (_name, limits, entries, reasonCode) => {
    const api = createApi();
    api.getTree = vi.fn(async () => ({ sha: 'tree1', tree: entries, truncated: false }));
    const adapter = createAdapter(api, null, limits);

    await expect(adapter.fetchSnapshot(createTarget())).rejects.toMatchObject({
      code: 'UNSAFE_CONTENT',
      details: { reasonCode },
    });
    expect(api.getBlob).not.toHaveBeenCalled();
  });
});

describe('GitHubRemoteAdapter publish', () => {
  it('requires a credential before any GitHub request', async () => {
    const api = createApi();
    const adapter = createAdapter(api);

    await expect(adapter.publishSnapshot(createTarget(), createSnapshot([]), 'commit1')).rejects.toMatchObject({
      code: 'CREDENTIAL_UNAVAILABLE',
    });
    expect(api.getRepository).not.toHaveBeenCalled();
  });

  it('fails stale CAS before creating blobs, trees, or commits', async () => {
    const api = createApi();
    const adapter = createAdapter(api, 'safe-credential');

    await expect(
      adapter.publishSnapshot(
        createTarget({}, '{{ $env.GITHUB_PAT }}'),
        createSnapshot([{ path: 'index.ts', content: 'new\n' }]),
        'stale',
      ),
    ).rejects.toMatchObject({
      code: 'REMOTE_CHANGED',
      details: { expectedRemoteRevision: 'stale', currentRemoteRevision: 'commit1' },
    });
    expect(api.getCommit).not.toHaveBeenCalled();
    expect(api.createBlob).not.toHaveBeenCalled();
    expect(api.createTree).not.toHaveBeenCalled();
    expect(api.createCommit).not.toHaveBeenCalled();
  });

  it('does not create a commit when the current remote content hash is unchanged', async () => {
    const api = createApi();
    const content = 'same\n';
    api.getTree = vi.fn(async () => ({
      sha: 'tree1',
      tree: [createTreeEntry('packages/light/index.ts', content, { sha: 'same-blob' })],
      truncated: false,
    }));
    api.getBlob = vi.fn(async () => createBlob(content, 'same-blob'));
    const adapter = createAdapter(api, 'safe-credential');

    const result = await adapter.publishSnapshot(
      createTarget({}, '{{ $env.GITHUB_PAT }}'),
      createSnapshot([{ path: 'index.ts', content }]),
      'commit1',
    );

    expect(result).toMatchObject({
      revision: 'commit1',
      contentHash: computeRemoteSnapshotContentHash([{ path: 'index.ts', content }]),
    });
    expect(api.createBlob).not.toHaveBeenCalled();
    expect(api.createTree).not.toHaveBeenCalled();
    expect(api.createCommit).not.toHaveBeenCalled();
    expect(api.updateRef).not.toHaveBeenCalled();
  });

  it('publishes against the current root tree and changes only paths within the configured subdirectory', async () => {
    const api = createApi();
    const oldContent = 'old\n';
    api.getTree = vi.fn(async () => ({
      sha: 'tree1',
      truncated: false,
      tree: [
        createTreeEntry('packages/light/old.ts', oldContent, { sha: 'old-blob' }),
        createTreeEntry('outside.txt', 'outside\n', { sha: 'outside-blob' }),
      ],
    }));
    api.getBlob = vi.fn(async () => createBlob(oldContent, 'old-blob'));
    const adapter = createAdapter(api, 'safe-credential');
    const snapshot = createSnapshot([{ path: 'new.ts', content: 'new\n', mode: '100755' }]);

    const result = await adapter.publishSnapshot(createTarget(), snapshot, 'commit1');

    expect(api.createBlob).toHaveBeenCalledWith('nocobase', 'extensions', 'new\n', 'safe-credential');
    expect(api.createTree).toHaveBeenCalledWith(
      'nocobase',
      'extensions',
      [
        { path: 'packages/light/new.ts', mode: '100755', type: 'blob', sha: 'blob-created' },
        { path: 'packages/light/old.ts', mode: '100644', type: 'blob', sha: null },
      ],
      'tree1',
      'safe-credential',
    );
    expect(api.createCommit).toHaveBeenCalledWith(
      'nocobase',
      'extensions',
      'tree-created',
      ['commit1'],
      'safe-credential',
    );
    expect(api.updateRef).toHaveBeenCalledWith('nocobase', 'extensions', 'main', 'commit-created', 'safe-credential');
    expect(result).toMatchObject({ revision: 'commit-created', contentHash: snapshot.contentHash });
    expect(JSON.stringify(vi.mocked(api.createTree).mock.calls)).not.toContain('outside.txt');
  });

  it('creates the first tree, parentless commit, and branch when revision is null', async () => {
    const api = createApi();
    api.getRef = vi.fn(async () => null);
    const adapter = createAdapter(api, 'safe-credential');
    const snapshot = createSnapshot([{ path: 'index.ts', content: 'initial\n' }]);

    const result = await adapter.publishSnapshot(createTarget({ branch: 'new/branch' }), snapshot, null);

    expect(api.createTree).toHaveBeenCalledWith(
      'nocobase',
      'extensions',
      [{ path: 'packages/light/index.ts', mode: '100644', type: 'blob', sha: 'blob-created' }],
      null,
      'safe-credential',
    );
    expect(api.createCommit).toHaveBeenCalledWith('nocobase', 'extensions', 'tree-created', [], 'safe-credential');
    expect(api.createRef).toHaveBeenCalledWith(
      'nocobase',
      'extensions',
      'new/branch',
      'commit-created',
      'safe-credential',
    );
    expect(api.updateRef).not.toHaveBeenCalled();
    expect(result).toMatchObject({ revision: 'commit-created', contentHash: snapshot.contentHash });
  });

  it('rejects an archived repository before creating remote objects', async () => {
    const api = createApi();
    api.getRepository = vi.fn(async () => ({ default_branch: 'main', private: false, archived: true }));
    const adapter = createAdapter(api, 'safe-credential');

    await expect(adapter.publishSnapshot(createTarget(), createSnapshot([]), 'commit1')).rejects.toMatchObject({
      code: 'PERMISSION_DENIED',
      details: { reasonCode: 'repository-archived' },
    });
    expect(api.getRef).not.toHaveBeenCalled();
    expect(api.createTree).not.toHaveBeenCalled();
  });

  it('rejects unsafe and oversized outgoing snapshots before creating objects', async () => {
    const api = createApi();
    const adapter = createAdapter(api, 'safe-credential', { maxFiles: 1, maxFileBytes: 4, maxTotalBytes: 4 });

    await expect(
      adapter.publishSnapshot(
        createTarget(),
        createSnapshot([
          { path: 'Index.ts', content: 'a' },
          { path: 'index.ts', content: 'b' },
        ]),
        'commit1',
      ),
    ).rejects.toMatchObject({ code: 'UNSAFE_CONTENT' });
    await expect(
      adapter.publishSnapshot(createTarget(), createSnapshot([{ path: 'large.ts', content: '12345' }]), 'commit1'),
    ).rejects.toMatchObject({ code: 'UNSAFE_CONTENT', details: { reasonCode: 'file-size-limit' } });
    await expect(
      adapter.publishSnapshot(
        createTarget(),
        createSnapshot([
          {
            path: 'pointer.txt',
            content: 'version https://git-lfs.github.com/spec/v1\noid sha256:abc\nsize 1\n',
          },
        ]),
        'commit1',
      ),
    ).rejects.toMatchObject({ code: 'UNSAFE_CONTENT', details: { reasonCode: 'lfs-unsupported' } });
    await expect(
      adapter.publishSnapshot(createTarget(), createSnapshot([{ path: 'binary.txt', content: 'a\0b' }]), 'commit1'),
    ).rejects.toMatchObject({ code: 'UNSAFE_CONTENT', details: { reasonCode: 'binary-content' } });
    expect(api.createBlob).not.toHaveBeenCalled();
    expect(api.createTree).not.toHaveBeenCalled();
  });
});
