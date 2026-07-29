/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { chmod, mkdir, mkdtemp, readdir, rm, stat } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { TextDecoder } from 'node:util';

import type {
  GitRemoteCredential,
  VscGitRemoteConfig,
  VscRemoteSnapshotFile,
} from '../../../../../shared/vsc-file/remote-sync-types';
import { RemoteSyncError } from '../../RemoteSyncAdapter';
import type { GitCommandRequest, GitCommandResult, GitCommandRunner } from './GitCommandRunner';
import {
  assertGitSubdirectoryEntry,
  decodeGitBlob,
  selectGitSnapshotEntries,
  type GitSnapshotLimits,
  type GitTreeEntry,
} from './gitSnapshotPolicy';

export const gitWorkspaceTemporaryDirectoryPrefix = 'nocobase-git-workspace-';

export async function cleanupGitWorkspaceOrphans(
  ttlMs: number,
  temporaryDirectory = os.tmpdir(),
  now = Date.now(),
): Promise<number> {
  if (!Number.isFinite(ttlMs) || ttlMs < 0) {
    throw new TypeError('Git workspace temporary directory TTL must be a non-negative finite number');
  }

  let entries;
  try {
    entries = await readdir(temporaryDirectory, { withFileTypes: true });
  } catch (error) {
    if (isNodeErrorWithCode(error, 'ENOENT')) {
      return 0;
    }
    throw error;
  }

  let removed = 0;
  for (const entry of entries) {
    if (!entry.isDirectory() || !entry.name.startsWith(gitWorkspaceTemporaryDirectoryPrefix)) {
      continue;
    }
    const directory = path.join(temporaryDirectory, entry.name);
    try {
      const metadata = await stat(directory);
      if (now - metadata.mtimeMs <= ttlMs) {
        continue;
      }
      await rm(directory, { force: true, recursive: true });
      removed += 1;
    } catch (error) {
      if (!isNodeErrorWithCode(error, 'ENOENT')) {
        throw error;
      }
    }
  }
  return removed;
}

export interface GitCommandExecutor {
  run(request: GitCommandRequest): Promise<GitCommandResult>;
}

export interface GitRepositoryWorkspaceOptions {
  runner: Pick<GitCommandRunner, 'run'> | GitCommandExecutor;
  config: VscGitRemoteConfig;
  credential: GitRemoteCredential | null;
  limits: GitSnapshotLimits;
  temporaryDirectory?: string;
  identity?: Partial<GitCommitIdentity>;
}

export interface GitCommitIdentity {
  name: string;
  email: string;
  date: string;
}

export interface GitWorkspaceSnapshot {
  files: VscRemoteSnapshotFile[];
  treeOid: string;
}

export class GitRepositoryWorkspace {
  readonly rootDirectory: string;

  readonly repositoryDirectory: string;

  readonly indexFile: string;

  private readonly runner: GitCommandExecutor;

  private readonly config: VscGitRemoteConfig;

  private readonly credential: GitRemoteCredential | null;

  private readonly limits: GitSnapshotLimits;

  private readonly identity: GitCommitIdentity;

  private cleaned = false;

  private constructor(options: GitRepositoryWorkspaceOptions, rootDirectory: string, identity: GitCommitIdentity) {
    this.runner = options.runner;
    this.config = options.config;
    this.credential = options.credential;
    this.limits = options.limits;
    this.rootDirectory = rootDirectory;
    this.repositoryDirectory = path.join(rootDirectory, 'repository.git');
    this.indexFile = path.join(rootDirectory, 'index');
    this.identity = identity;
  }

  static async create(options: GitRepositoryWorkspaceOptions): Promise<GitRepositoryWorkspace> {
    const temporaryDirectory = options.temporaryDirectory || os.tmpdir();
    await mkdir(temporaryDirectory, { recursive: true, mode: 0o700 });
    const rootDirectory = await mkdtemp(path.join(temporaryDirectory, gitWorkspaceTemporaryDirectoryPrefix));
    try {
      await chmod(rootDirectory, 0o700);
      const workspace = new GitRepositoryWorkspace(options, rootDirectory, normalizeIdentity(options.identity));
      await mkdir(workspace.repositoryDirectory, { mode: 0o700 });
      await workspace.runLocal(['init', '--bare', workspace.repositoryDirectory], 'init-workspace');
      return workspace;
    } catch (error) {
      try {
        await rm(rootDirectory, { force: true, recursive: true });
      } catch {
        // Preserve the safe initialization error; cleanup must not replace it with a local path error.
      }
      throw error;
    }
  }

  async fetchBranch(branch = this.config.branch): Promise<string> {
    await this.runRemote(
      [
        'fetch',
        '--no-tags',
        '--depth=1',
        `--filter=blob:limit=${this.limits.maxFileBytes + 1}`,
        this.config.url,
        `refs/heads/${branch}`,
      ],
      'fetch-branch',
    );
    return this.resolveOid('FETCH_HEAD^{commit}');
  }

  async readSnapshot(commitOid: string): Promise<GitWorkspaceSnapshot> {
    requireGitOid(commitOid, 'commit');
    if (this.config.subdirectory !== null) {
      const directEntries = await this.listTree(commitOid, this.config.subdirectory, false, false);
      assertGitSubdirectoryEntry(
        directEntries.find((entry) => entry.path === this.config.subdirectory),
        this.config.subdirectory,
      );
    }
    const entries = await this.listTree(commitOid, this.config.subdirectory, true, true);
    const selected = selectGitSnapshotEntries(entries, this.config.subdirectory, this.limits);
    const contents = await this.readBlobs(selected);
    const files = selected.map((entry, index) => ({
      path: entry.path,
      content: decodeGitBlob(contents[index], entry),
      mode: entry.mode,
    }));
    return {
      files,
      treeOid: await this.resolveOid(`${commitOid}^{tree}`),
    };
  }

  async createCommit(
    files: readonly VscRemoteSnapshotFile[],
    parentCommit: string | null,
    currentFiles: readonly VscRemoteSnapshotFile[],
  ): Promise<{ commitOid: string; treeOid: string }>;

  async createCommit(
    files: readonly VscRemoteSnapshotFile[],
    parentCommit: string | null,
    currentFiles: readonly VscRemoteSnapshotFile[],
    expectedTreeOid: string,
  ): Promise<{ commitOid: string | null; treeOid: string }>;

  async createCommit(
    files: readonly VscRemoteSnapshotFile[],
    parentCommit: string | null,
    currentFiles: readonly VscRemoteSnapshotFile[],
    expectedTreeOid?: string,
  ): Promise<{ commitOid: string | null; treeOid: string }> {
    if (parentCommit !== null) {
      requireGitOid(parentCommit, 'parent-commit');
      await this.runIndex(['read-tree', parentCommit], 'read-index');
    } else {
      await this.runIndex(['read-tree', '--empty'], 'initialize-index');
    }

    const removals =
      parentCommit === null ? [] : await this.listTree(parentCommit, this.config.subdirectory, true, false);
    const currentModes = new Map(currentFiles.map((file) => [file.path, file.mode]));
    const additions: Array<{ path: string; mode: '100644' | '100755'; oid: string }> = [];
    for (const file of files) {
      const result = await this.runLocal(
        ['hash-object', '-w', '--stdin'],
        'write-blob',
        Buffer.from(file.content, 'utf8'),
      );
      const oid = parseSingleOid(result.stdout, 'blob');
      additions.push({
        path: addSubdirectory(file.path, this.config.subdirectory),
        mode: normalizeFileMode(file.mode, currentModes.get(file.path)),
        oid,
      });
    }

    const indexInput = Buffer.concat([
      ...removals.map((entry) => Buffer.from(`0 ${entry.oid}\t${entry.path}\0`, 'utf8')),
      ...additions.map((entry) => Buffer.from(`${entry.mode} ${entry.oid}\t${entry.path}\0`, 'utf8')),
    ]);
    if (indexInput.byteLength > 0) {
      await this.runIndex(['update-index', '-z', '--index-info'], 'update-index', indexInput);
    }
    const treeOid = parseSingleOid((await this.runIndex(['write-tree'], 'write-tree')).stdout, 'tree');
    if (expectedTreeOid !== undefined) {
      requireGitOid(expectedTreeOid, 'expected-tree');
      if (treeOid === expectedTreeOid) {
        return { commitOid: null, treeOid };
      }
    }
    const commitArgs = ['commit-tree', treeOid];
    if (parentCommit !== null) {
      commitArgs.push('-p', parentCommit);
    }
    const commitOid = parseSingleOid(
      (
        await this.runLocal(commitArgs, 'create-commit', 'Sync VSC snapshot\n', {
          GIT_AUTHOR_NAME: this.identity.name,
          GIT_AUTHOR_EMAIL: this.identity.email,
          GIT_AUTHOR_DATE: this.identity.date,
          GIT_COMMITTER_NAME: this.identity.name,
          GIT_COMMITTER_EMAIL: this.identity.email,
          GIT_COMMITTER_DATE: this.identity.date,
        })
      ).stdout,
      'commit',
    );
    return { commitOid, treeOid };
  }

  async pushCommit(commitOid: string, expectedRevision: string | null): Promise<void> {
    requireGitOid(commitOid, 'commit');
    if (expectedRevision !== null) {
      requireGitOid(expectedRevision, 'expected-revision');
    }
    const ref = `refs/heads/${this.config.branch}`;
    const lease = `--force-with-lease=${ref}:${expectedRevision || ''}`;
    await this.runRemote(['push', '--porcelain', lease, this.config.url, `${commitOid}:${ref}`], 'push-branch');
  }

  async cleanup(): Promise<void> {
    if (this.cleaned) {
      return;
    }
    await rm(this.rootDirectory, { force: true, recursive: true });
    this.cleaned = true;
  }

  private async readBlobs(entries: readonly { oid: string; size: number }[]): Promise<Buffer[]> {
    if (entries.length === 0) {
      return [];
    }
    const stdin = `${entries.map((entry) => entry.oid).join('\n')}\n`;
    const result = await this.runLocal(['cat-file', '--batch'], 'read-blobs', stdin);
    return parseBatchOutput(result.stdout, entries);
  }

  private async listTree(
    commitOid: string,
    subdirectory: string | null,
    recursive: boolean,
    includeSize: boolean,
  ): Promise<GitTreeEntry[]> {
    const args = ['ls-tree'];
    if (recursive) {
      args.push('-r');
    }
    args.push('-z');
    if (includeSize) {
      args.push('-l');
    }
    args.push('--full-tree', commitOid);
    if (subdirectory !== null) {
      args.push('--', `:(literal)${subdirectory}`);
    }
    const result = await this.runLocal(args, 'list-tree');
    return parseGitTreeOutput(result.stdout, includeSize);
  }

  private async resolveOid(revision: string): Promise<string> {
    const result = await this.runLocal(['rev-parse', '--verify', revision], 'resolve-oid');
    return parseSingleOid(result.stdout, 'revision');
  }

  private runIndex(args: readonly string[], operation: string, stdin?: Buffer | string): Promise<GitCommandResult> {
    return this.runLocal(args, operation, stdin, { GIT_INDEX_FILE: this.indexFile });
  }

  private runRemote(args: readonly string[], operation: string): Promise<GitCommandResult> {
    return this.runner.run({
      args,
      cwd: this.repositoryDirectory,
      remoteUrl: this.config.url,
      transport: this.config.transport,
      credential: this.credential,
      operation,
    });
  }

  private runLocal(
    args: readonly string[],
    operation: string,
    stdin?: Buffer | string,
    environment?: Readonly<Record<string, string>>,
  ): Promise<GitCommandResult> {
    return this.runner.run({
      args,
      cwd: this.repositoryDirectory,
      stdin,
      environment,
      operation,
    });
  }
}

export function parseGitTreeOutput(output: Buffer, includeSize: boolean): GitTreeEntry[] {
  const records = splitNulRecords(output);
  return records.map((record) => {
    const separator = record.indexOf(0x09);
    if (separator <= 0) {
      throw unsafeContent('Git tree output is invalid', 'invalid-tree-output');
    }
    const header = record.subarray(0, separator).toString('ascii');
    const match = includeSize
      ? /^(?<mode>[0-7]{6}) (?<type>[a-z]+) (?<oid>[0-9a-f]+) +(?<size>-|\d+)$/u.exec(header)
      : /^(?<mode>[0-7]{6}) (?<type>[a-z]+) (?<oid>[0-9a-f]+)$/u.exec(header);
    if (!match?.groups) {
      throw unsafeContent('Git tree output is invalid', 'invalid-tree-output');
    }
    let entryPath: string;
    try {
      entryPath = new TextDecoder('utf-8', { fatal: true }).decode(record.subarray(separator + 1));
    } catch {
      throw unsafeContent('Git tree path is not valid UTF-8', 'invalid-tree-path');
    }
    const sizeText = includeSize ? match.groups.size : '-';
    const size = sizeText === '-' ? null : Number(sizeText);
    if (size !== null && (!Number.isSafeInteger(size) || size < 0)) {
      throw unsafeContent('Git tree output is invalid', 'invalid-tree-output');
    }
    return {
      mode: match.groups.mode,
      type: match.groups.type,
      oid: match.groups.oid,
      size,
      path: entryPath,
    };
  });
}

function splitNulRecords(output: Buffer): Buffer[] {
  const records: Buffer[] = [];
  let offset = 0;
  while (offset < output.byteLength) {
    const end = output.indexOf(0, offset);
    if (end < 0) {
      throw unsafeContent('Git tree output is not NUL terminated', 'invalid-tree-output');
    }
    if (end === offset) {
      throw unsafeContent('Git tree output contains an empty record', 'invalid-tree-output');
    }
    records.push(output.subarray(offset, end));
    offset = end + 1;
  }
  return records;
}

export function parseBatchOutput(output: Buffer, entries: readonly { oid: string; size: number }[]): Buffer[] {
  const contents: Buffer[] = [];
  let offset = 0;
  for (const entry of entries) {
    const headerEnd = output.indexOf(0x0a, offset);
    if (headerEnd < 0) {
      throw unsafeContent('Git batch output is invalid', 'invalid-batch-output');
    }
    const header = output.subarray(offset, headerEnd).toString('ascii').split(' ');
    if (header.length !== 3 || header[0] !== entry.oid || header[1] !== 'blob' || Number(header[2]) !== entry.size) {
      throw unsafeContent('Git batch output is invalid', 'invalid-batch-output');
    }
    const contentStart = headerEnd + 1;
    const contentEnd = contentStart + entry.size;
    if (contentEnd >= output.byteLength || output[contentEnd] !== 0x0a) {
      throw unsafeContent('Git batch output is invalid', 'invalid-batch-output');
    }
    contents.push(output.subarray(contentStart, contentEnd));
    offset = contentEnd + 1;
  }
  if (offset !== output.byteLength) {
    throw unsafeContent('Git batch output contains unexpected data', 'invalid-batch-output');
  }
  return contents;
}

function parseSingleOid(output: Buffer, field: string): string {
  const oid = output.toString('ascii').trim();
  return requireGitOid(oid, field);
}

function requireGitOid(value: string, field: string): string {
  if (!/^[0-9a-f]{40}$/u.test(value)) {
    throw unsafeContent(`Git ${field} object ID is invalid`, `invalid-${field}-oid`);
  }
  return value;
}

function addSubdirectory(filePath: string, subdirectory: string | null): string {
  return subdirectory === null ? filePath : `${subdirectory}/${filePath}`;
}

function normalizeFileMode(mode: unknown, fallback?: unknown): '100644' | '100755' {
  const value = mode === undefined ? fallback ?? '100644' : mode;
  if (value !== '100644' && value !== '100755') {
    throw unsafeContent('Remote snapshot file mode is unsupported', 'file-mode-unsupported');
  }
  return value;
}

function normalizeIdentity(input: Partial<GitCommitIdentity> | undefined): GitCommitIdentity {
  const identity = {
    name: input?.name || 'NocoBase',
    email: input?.email || 'nocobase@localhost',
    date: input?.date || new Date().toISOString(),
  };
  if (
    !identity.name.trim() ||
    /[\r\n]/u.test(identity.name) ||
    !identity.email.trim() ||
    /[\r\n]/u.test(identity.email)
  ) {
    throw new RemoteSyncError('CONFIG_INVALID', 'Git commit identity is invalid', {
      details: { provider: 'git', reasonCode: 'invalid-commit-identity' },
    });
  }
  return identity;
}

function unsafeContent(message: string, reasonCode: string): RemoteSyncError {
  return new RemoteSyncError('UNSAFE_CONTENT', message, {
    details: { provider: 'git', reasonCode },
  });
}

function isNodeErrorWithCode(error: unknown, code: string): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error && error.code === code;
}
