/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';

import type { VscGitHubRemoteConfig } from '../../../../../../shared/vsc-file/remote-sync-types';
import { computeRemoteSnapshotContentHash } from '../../../snapshot';
import { GitHubGitTransport, type GitCommandRunner } from '../GitHubGitTransport';

const revision = 'a'.repeat(40);
const treeSha = 'b'.repeat(40);
const blobSha = 'c'.repeat(40);
const config: VscGitHubRemoteConfig = {
  owner: 'gchust',
  repository: 'nocobase-light-extension',
  branch: 'main',
  subdirectory: null,
  transport: 'ssh',
};

describe('GitHubGitTransport', () => {
  it('probes and fetches an SSH repository without using the GitHub REST API', async () => {
    const content = 'export default {};\n';
    const runGit = createRunner({
      tree: `100644 blob ${blobSha} ${Buffer.byteLength(content)}\tindex.ts\0`,
      blobs: new Map([[blobSha, Buffer.from(content)]]),
    });
    const transport = new GitHubGitTransport({ runGit });

    await expect(transport.probe(config)).resolves.toEqual({
      revision,
      metadata: {
        branch: 'main',
        defaultBranch: 'main',
        transport: 'ssh',
        treeSha: null,
      },
    });
    await expect(transport.fetchSnapshot(config)).resolves.toEqual({
      revision,
      contentHash: computeRemoteSnapshotContentHash([{ path: 'index.ts', content, mode: '100644' }]),
      files: [{ path: 'index.ts', content, mode: '100644' }],
      metadata: {
        branch: 'main',
        defaultBranch: 'main',
        transport: 'ssh',
        treeSha,
      },
    });

    expect(runGit).toHaveBeenCalledWith(
      expect.arrayContaining(['clone', 'git@github.com:gchust/nocobase-light-extension.git']),
      undefined,
    );
  });

  it('rejects a symbolic link before reading its blob', async () => {
    const runGit = createRunner({
      tree: `120000 blob ${blobSha} 6\tlink\0`,
      blobs: new Map([[blobSha, Buffer.from('target')]]),
    });
    const transport = new GitHubGitTransport({ runGit });

    await expect(transport.fetchSnapshot(config)).rejects.toMatchObject({
      code: 'UNSAFE_CONTENT',
      details: { reasonCode: 'symlink-unsupported' },
    });
    expect(runGit.mock.calls.some(([args]) => args.includes('cat-file'))).toBe(false);
  });
});

function createRunner(input: { tree: string; blobs: Map<string, Buffer> }) {
  return vi.fn<GitCommandRunner>(async (args) => {
    if (args.includes('ls-remote')) {
      return {
        stdout: Buffer.from(`ref: refs/heads/main\tHEAD\n${revision}\tHEAD\n${revision}\trefs/heads/main\n`),
      };
    }
    if (args.includes('clone')) {
      return { stdout: Buffer.alloc(0) };
    }
    if (args.includes('rev-parse')) {
      return { stdout: Buffer.from(args.includes('HEAD^{tree}') ? `${treeSha}\n` : `${revision}\n`) };
    }
    if (args.includes('ls-tree')) {
      return { stdout: Buffer.from(input.tree) };
    }
    if (args.includes('cat-file')) {
      const sha = args.at(-1) || '';
      return { stdout: input.blobs.get(sha) || Buffer.alloc(0) };
    }
    throw new Error(`Unexpected Git command: ${args.join(' ')}`);
  });
}
