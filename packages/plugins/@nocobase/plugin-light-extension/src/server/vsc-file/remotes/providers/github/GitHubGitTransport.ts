/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { execFile } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { TextDecoder } from 'node:util';

import type {
  VscGitHubRemoteConfig,
  VscRemoteSnapshot,
  VscRemoteSnapshotFile,
} from '../../../../../shared/vsc-file/remote-sync-types';
import { normalizePath } from '@nocobase/runjs-workspace/shared';
import { RemoteSyncError, type RemoteSyncProbeResult } from '../../RemoteSyncAdapter';
import { computeRemoteSnapshotContentHash } from '../../snapshot';
import { isPathInSubdirectory, normalizeGitHubBranch, stripGitHubSubdirectory } from './githubPath';

const defaultLimits = {
  maxFiles: 2_000,
  maxFileBytes: 1024 * 1024,
  maxTotalBytes: 10 * 1024 * 1024,
  blobConcurrency: 4,
};
const gitCommandTimeoutMs = 60_000;
const gitCommandMaxBuffer = 12 * 1024 * 1024;
const gitArgsPrefix = [
  '-c',
  'protocol.file.allow=never',
  '-c',
  'protocol.ext.allow=never',
  '-c',
  'core.sshCommand=ssh -oBatchMode=yes',
] as const;

interface GitSnapshotLimits {
  maxFiles: number;
  maxFileBytes: number;
  maxTotalBytes: number;
  blobConcurrency: number;
}

interface GitCommandOptions {
  cwd?: string;
}

interface GitCommandResult {
  stdout: Buffer;
}

export type GitCommandRunner = (args: readonly string[], options?: GitCommandOptions) => Promise<GitCommandResult>;

export interface GitHubGitTransportOptions {
  runGit?: GitCommandRunner;
  limits?: Partial<GitSnapshotLimits>;
}

interface GitTreeEntry {
  mode: string;
  type: string;
  sha: string;
  size: number | null;
  path: string;
}

interface SelectedGitTreeEntry {
  mode: '100644' | '100755';
  sha: string;
  size: number;
  path: string;
}

export class GitHubGitTransport {
  private readonly runGit: GitCommandRunner;

  private readonly limits: GitSnapshotLimits;

  constructor(options: GitHubGitTransportOptions = {}) {
    this.runGit = options.runGit || runGitCommand;
    this.limits = normalizeLimits(options.limits);
  }

  async probe(config: VscGitHubRemoteConfig): Promise<RemoteSyncProbeResult> {
    const patterns = config.branch ? ['HEAD', `refs/heads/${config.branch}`] : ['HEAD'];
    const result = await this.run(
      [...gitArgsPrefix, 'ls-remote', '--symref', createSshUrl(config), ...patterns],
      undefined,
      'probe',
    );
    const refs = parseRemoteRefs(result.stdout);
    const defaultBranch = refs.defaultBranch;
    const branch = config.branch || defaultBranch;
    const revision = branch ? refs.branches.get(branch) ?? (branch === defaultBranch ? refs.headRevision : null) : null;
    return {
      revision,
      metadata: {
        branch,
        defaultBranch,
        transport: 'ssh',
        treeSha: null,
      },
    };
  }

  async fetchSnapshot(config: VscGitHubRemoteConfig, expectedRevision?: string | null): Promise<VscRemoteSnapshot> {
    let branch = config.branch;
    if (expectedRevision === undefined || !branch) {
      const probed = await this.probe(config);
      branch = readMetadataBranch(probed);
      if (expectedRevision === null && probed.revision !== null) {
        throw remoteChanged(null, probed.revision);
      }
      if (!probed.revision) {
        return emptySnapshot(branch);
      }
    }
    if (!branch) {
      throw invalidConfig('Git default branch is unavailable', 'default-branch-unavailable');
    }

    const temporaryDirectory = await mkdtemp(join(tmpdir(), 'nocobase-github-git-'));
    const repositoryDirectory = join(temporaryDirectory, 'repository.git');
    try {
      await this.run(
        [
          ...gitArgsPrefix,
          'clone',
          '--bare',
          '--quiet',
          '--depth=1',
          '--single-branch',
          '--branch',
          branch,
          createSshUrl(config),
          repositoryDirectory,
        ],
        undefined,
        'clone',
      );
      const revision = requireGitObjectId(
        decodeUtf8(
          (await this.run([...gitArgsPrefix, 'rev-parse', 'HEAD'], { cwd: repositoryDirectory }, 'revision')).stdout,
        ).trim(),
        'revision',
      );
      if (typeof expectedRevision === 'string' && revision !== expectedRevision) {
        throw remoteChanged(expectedRevision, revision);
      }
      const treeSha = requireGitObjectId(
        decodeUtf8(
          (await this.run([...gitArgsPrefix, 'rev-parse', 'HEAD^{tree}'], { cwd: repositoryDirectory }, 'tree')).stdout,
        ).trim(),
        'tree',
      );
      const tree = parseTree(
        (
          await this.run(
            [...gitArgsPrefix, 'ls-tree', '-rz', '--long', '--full-tree', 'HEAD'],
            { cwd: repositoryDirectory },
            'tree',
          )
        ).stdout,
      );
      const selected = selectEntries(tree, config.subdirectory, this.limits);
      const files = await mapConcurrent(selected, this.limits.blobConcurrency, async (entry) => {
        const bytes = (
          await this.run([...gitArgsPrefix, 'cat-file', 'blob', entry.sha], { cwd: repositoryDirectory }, 'blob')
        ).stdout;
        return decodeFile(entry, bytes);
      });
      return {
        revision,
        contentHash: computeRemoteSnapshotContentHash(files),
        files,
        metadata: {
          branch,
          defaultBranch: branch,
          transport: 'ssh',
          treeSha,
        },
      };
    } finally {
      await rm(temporaryDirectory, { force: true, recursive: true }).catch(() => undefined);
    }
  }

  private async run(
    args: readonly string[],
    options: GitCommandOptions | undefined,
    operation: string,
  ): Promise<GitCommandResult> {
    try {
      return await this.runGit(args, options);
    } catch (error) {
      if (error instanceof RemoteSyncError) {
        throw error;
      }
      throw new RemoteSyncError('REMOTE_UNAVAILABLE', 'Git SSH request failed', {
        details: { provider: 'github', operation, reasonCode: 'git-transport-failed' },
      });
    }
  }
}

function runGitCommand(args: readonly string[], options: GitCommandOptions = {}): Promise<GitCommandResult> {
  return new Promise((resolve, reject) => {
    execFile(
      'git',
      [...args],
      {
        cwd: options.cwd,
        encoding: null,
        env: { ...process.env, GIT_LFS_SKIP_SMUDGE: '1', GIT_TERMINAL_PROMPT: '0' },
        maxBuffer: gitCommandMaxBuffer,
        timeout: gitCommandTimeoutMs,
      },
      (error, stdout) => {
        if (error) {
          reject(error);
          return;
        }
        resolve({ stdout: Buffer.isBuffer(stdout) ? stdout : Buffer.from(stdout) });
      },
    );
  });
}

function createSshUrl(config: VscGitHubRemoteConfig): string {
  return `git@github.com:${config.owner}/${config.repository}.git`;
}

function parseRemoteRefs(output: Buffer): {
  defaultBranch: string;
  headRevision: string | null;
  branches: Map<string, string>;
} {
  let defaultBranch = '';
  let headRevision: string | null = null;
  const branches = new Map<string, string>();
  for (const line of decodeUtf8(output).split('\n')) {
    if (!line) {
      continue;
    }
    const symbolic = /^ref: refs\/heads\/(.+)\tHEAD$/u.exec(line);
    if (symbolic) {
      defaultBranch = normalizeGitHubBranch(symbolic[1]);
      continue;
    }
    const reference = /^([0-9a-f]{40,64})\t(.+)$/u.exec(line);
    if (!reference) {
      throw unsafeContent('Git remote reference is invalid', 'invalid-ref-response');
    }
    const revision = requireGitObjectId(reference[1], 'revision');
    if (reference[2] === 'HEAD') {
      headRevision = revision;
    } else if (reference[2].startsWith('refs/heads/')) {
      const branch = normalizeGitHubBranch(reference[2].slice('refs/heads/'.length));
      branches.set(branch, revision);
    }
  }
  return { defaultBranch, headRevision, branches };
}

function parseTree(output: Buffer): GitTreeEntry[] {
  return decodeUtf8(output)
    .split('\0')
    .filter(Boolean)
    .map((record) => {
      const match = /^([0-9]{6}) ([a-z]+) ([0-9a-f]{40,64}) +(-|[0-9]+)\t([\s\S]+)$/u.exec(record);
      if (!match) {
        throw unsafeContent('Git tree entry is invalid', 'invalid-tree-entry');
      }
      const size = match[4] === '-' ? null : Number(match[4]);
      return { mode: match[1], type: match[2], sha: match[3], size, path: match[5] };
    });
}

function selectEntries(
  entries: readonly GitTreeEntry[],
  subdirectory: string | null,
  limits: GitSnapshotLimits,
): SelectedGitTreeEntry[] {
  const selected: SelectedGitTreeEntry[] = [];
  const exactPaths = new Set<string>();
  const foldedPaths = new Map<string, string>();
  let totalBytes = 0;
  for (const entry of entries) {
    validateGitTreePath(entry.path);
    if (subdirectory !== null && entry.path === subdirectory) {
      if (entry.type !== 'tree') {
        throw unsafeContent('Git subdirectory is not a directory', 'subdirectory-not-directory');
      }
      continue;
    }
    if (!isPathInSubdirectory(entry.path, subdirectory)) {
      continue;
    }
    if (entry.type === 'tree') {
      continue;
    }
    if (entry.type === 'commit' || entry.mode === '160000') {
      throw unsafeContent('Git submodules are unsupported', 'gitlink-unsupported');
    }
    if (entry.mode === '120000') {
      throw unsafeContent('Git symbolic links are unsupported', 'symlink-unsupported');
    }
    if (entry.type !== 'blob' || (entry.mode !== '100644' && entry.mode !== '100755')) {
      throw unsafeContent('Git tree entry type is unsupported', 'tree-entry-unsupported');
    }
    if (entry.size === null || !Number.isSafeInteger(entry.size) || entry.size < 0) {
      throw unsafeContent('Git blob size is unavailable', 'blob-size-unavailable');
    }
    if (entry.size > limits.maxFileBytes) {
      throw unsafeContent('Git blob exceeds the file size limit', 'file-size-limit');
    }
    totalBytes += entry.size;
    if (totalBytes > limits.maxTotalBytes) {
      throw unsafeContent('Git snapshot exceeds the total size limit', 'total-size-limit');
    }
    const path = validateSnapshotPath(stripGitHubSubdirectory(entry.path, subdirectory));
    assertUniquePath(path, exactPaths, foldedPaths);
    selected.push({ mode: entry.mode, sha: entry.sha, size: entry.size, path });
    if (selected.length > limits.maxFiles) {
      throw unsafeContent('Git snapshot exceeds the file count limit', 'file-count-limit');
    }
  }
  return selected.sort((left, right) => Buffer.compare(Buffer.from(left.path), Buffer.from(right.path)));
}

function decodeFile(entry: SelectedGitTreeEntry, bytes: Buffer): VscRemoteSnapshotFile {
  if (bytes.byteLength !== entry.size) {
    throw unsafeContent('Git blob size does not match its tree entry', 'blob-size-mismatch');
  }
  const content = decodeUtf8(bytes, 'invalid-utf8');
  if (hasBinaryControlCharacter(content)) {
    throw unsafeContent('Binary Git blobs are unsupported', 'binary-content');
  }
  if (content.startsWith('version https://git-lfs.github.com/spec/v1\n')) {
    throw unsafeContent('Git LFS pointer files are unsupported', 'lfs-unsupported');
  }
  return { path: entry.path, content, mode: entry.mode };
}

function validateSnapshotPath(value: string): string {
  if (value.includes('\\')) {
    throw unsafeContent('Git snapshot path is invalid', 'invalid-snapshot-path');
  }
  let path: string;
  try {
    path = normalizePath(value);
  } catch {
    throw unsafeContent('Git snapshot path is invalid', 'invalid-snapshot-path');
  }
  if (path.split('/').some((segment) => segment.toLocaleLowerCase('en-US') === '.git')) {
    throw unsafeContent('Git snapshot path contains a reserved segment', 'reserved-snapshot-path');
  }
  return path;
}

function validateGitTreePath(value: string): void {
  if (!value || value.startsWith('/') || value.endsWith('/') || value.includes('//') || value.includes('\\')) {
    throw unsafeContent('Git tree path is invalid', 'invalid-tree-path');
  }
  if (value.split('/').some((segment) => segment === '.' || segment === '..' || !segment || segment.includes('\0'))) {
    throw unsafeContent('Git tree path is invalid', 'invalid-tree-path');
  }
}

function assertUniquePath(path: string, exactPaths: Set<string>, foldedPaths: Map<string, string>): void {
  if (exactPaths.has(path)) {
    throw unsafeContent('Git snapshot contains a duplicate path', 'duplicate-path');
  }
  exactPaths.add(path);
  const folded = path.toLocaleLowerCase('en-US');
  const existing = foldedPaths.get(folded);
  if (existing && existing !== path) {
    throw unsafeContent('Git snapshot contains a case-conflicting path', 'case-conflicting-path');
  }
  foldedPaths.set(folded, path);
}

function normalizeLimits(input: Partial<GitSnapshotLimits> | undefined): GitSnapshotLimits {
  const limits = { ...defaultLimits, ...input };
  for (const value of Object.values(limits)) {
    if (!Number.isSafeInteger(value) || value <= 0) {
      throw invalidConfig('Git snapshot limits must be positive integers', 'invalid-snapshot-limit');
    }
  }
  return limits;
}

function readMetadataBranch(probe: RemoteSyncProbeResult): string {
  return typeof probe.metadata.branch === 'string' ? probe.metadata.branch : '';
}

function emptySnapshot(branch: string): VscRemoteSnapshot {
  const files: VscRemoteSnapshotFile[] = [];
  return {
    revision: null,
    contentHash: computeRemoteSnapshotContentHash(files),
    files,
    metadata: { branch, defaultBranch: branch, transport: 'ssh', treeSha: null },
  };
}

function remoteChanged(expected: string | null, current: string | null): RemoteSyncError {
  return new RemoteSyncError('REMOTE_CHANGED', 'Git branch changed before it could be fetched', {
    details: {
      provider: 'github',
      operation: 'fetch',
      reasonCode: 'head-mismatch',
      expectedRemoteRevision: expected,
      currentRemoteRevision: current,
    },
  });
}

function requireGitObjectId(value: string, field: string): string {
  if (!/^[0-9a-f]{40,64}$/u.test(value)) {
    throw unsafeContent(`Git ${field} is invalid`, `invalid-${field}`);
  }
  return value;
}

function decodeUtf8(bytes: Buffer, reasonCode = 'invalid-git-output'): string {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    throw unsafeContent('Git output is not valid UTF-8', reasonCode);
  }
}

function hasBinaryControlCharacter(value: string): boolean {
  for (const character of value) {
    const code = character.charCodeAt(0);
    if ((code < 0x20 && code !== 0x09 && code !== 0x0a && code !== 0x0c && code !== 0x0d) || code === 0x7f) {
      return true;
    }
  }
  return false;
}

function invalidConfig(message: string, reasonCode: string): RemoteSyncError {
  return new RemoteSyncError('CONFIG_INVALID', message, { details: { provider: 'github', reasonCode } });
}

function unsafeContent(message: string, reasonCode: string): RemoteSyncError {
  return new RemoteSyncError('UNSAFE_CONTENT', message, { details: { provider: 'github', reasonCode } });
}

async function mapConcurrent<T, R>(
  values: readonly T[],
  concurrency: number,
  mapper: (value: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(values.length);
  let nextIndex = 0;
  const workers = Array.from({ length: Math.min(concurrency, values.length) }, async () => {
    while (nextIndex < values.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await mapper(values[index]);
    }
  });
  await Promise.all(workers);
  return results;
}
