/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { TextDecoder } from 'util';

import type {
  VscGitHubRemoteConfig,
  VscRemoteSnapshot,
  VscRemoteSnapshotFile,
} from '../../../../../shared/vsc-file/remote-sync-types';
import { normalizePath } from '../../../../../shared/vsc-file/path-normalize';
import {
  RemoteSyncError,
  type RemoteSyncAdapter,
  type RemoteSyncAdapterCapabilities,
  type RemoteSyncAdapterTarget,
  type RemoteSyncProbeResult,
  type RemoteSyncPublishResult,
} from '../../RemoteSyncAdapter';
import type { RemoteCredentialMode, RemoteCredentialResolver } from '../../security/RemoteCredentialResolver';
import { computeRemoteSnapshotContentHash } from '../../snapshot';
import { GitHubApiClient } from './GitHubApiClient';
import {
  addGitHubSubdirectory,
  isPathInSubdirectory,
  normalizeGitHubBranch,
  normalizeGitHubOwner,
  normalizeGitHubRepository,
  normalizeGitHubSubdirectory,
  stripGitHubSubdirectory,
} from './githubPath';
import type { GitHubApi, GitHubCreateTreeEntry, GitHubRepository, GitHubTree, GitHubTreeEntry } from './githubTypes';

const defaultLimits = {
  maxFiles: 2_000,
  maxFileBytes: 1024 * 1024,
  maxTotalBytes: 10 * 1024 * 1024,
  blobConcurrency: 4,
};

interface GitHubSnapshotLimits {
  maxFiles: number;
  maxFileBytes: number;
  maxTotalBytes: number;
  blobConcurrency: number;
}

interface CredentialResolver {
  resolve(authRef: unknown, mode?: RemoteCredentialMode): Promise<string | null>;
}

export interface GitHubRemoteAdapterOptions {
  credentialResolver: Pick<RemoteCredentialResolver, 'resolve'> | CredentialResolver;
  api?: GitHubApi;
  limits?: Partial<GitHubSnapshotLimits>;
}

interface GitHubTargetContext {
  config: VscGitHubRemoteConfig;
  branch: string;
  credential: string | null;
  repository: GitHubRepository;
}

interface SelectedTreeEntry {
  path: string;
  mode: '100644' | '100755';
  sha: string;
  size: number;
}

interface FetchedSnapshot {
  snapshot: VscRemoteSnapshot;
  rootTreeSha: string;
}

export class GitHubRemoteAdapter implements RemoteSyncAdapter {
  readonly provider = 'github' as const;

  readonly title = 'GitHub';

  readonly capabilities: RemoteSyncAdapterCapabilities = {
    probe: true,
    fetch: true,
    publish: true,
    readOnly: false,
  };

  private readonly credentialResolver: CredentialResolver;

  private readonly api: GitHubApi;

  private readonly limits: GitHubSnapshotLimits;

  constructor(options: GitHubRemoteAdapterOptions) {
    this.credentialResolver = options.credentialResolver;
    this.api = options.api || new GitHubApiClient();
    this.limits = normalizeLimits(options.limits);
  }

  normalizeConfig(input: unknown): VscGitHubRemoteConfig {
    if (!isRecord(input)) {
      throw invalidConfig('GitHub remote config must be an object', 'invalid-config-shape');
    }
    const allowedKeys = new Set(['owner', 'repository', 'branch', 'subdirectory']);
    const keys = Object.keys(input);
    if (
      !Object.prototype.hasOwnProperty.call(input, 'owner') ||
      !Object.prototype.hasOwnProperty.call(input, 'repository') ||
      !Object.prototype.hasOwnProperty.call(input, 'branch') ||
      keys.some((key) => !allowedKeys.has(key))
    ) {
      throw invalidConfig('GitHub remote config has missing or unknown fields', 'invalid-config-shape');
    }
    return {
      owner: normalizeGitHubOwner(input.owner),
      repository: normalizeGitHubRepository(input.repository),
      branch: normalizeGitHubBranch(input.branch),
      subdirectory: normalizeGitHubSubdirectory(input.subdirectory),
    };
  }

  async probe(target: RemoteSyncAdapterTarget): Promise<RemoteSyncProbeResult> {
    const context = await this.createContext(target, 'optional');
    const reference = await this.api.getRef(
      context.config.owner,
      context.config.repository,
      context.branch,
      context.credential,
    );
    return {
      revision: reference ? getReferenceRevision(reference) : null,
      metadata: createMetadata(context, null),
    };
  }

  async fetchSnapshot(target: RemoteSyncAdapterTarget, expectedRevision?: string | null): Promise<VscRemoteSnapshot> {
    const context = await this.createContext(target, 'optional');
    if (typeof expectedRevision === 'string') {
      return (await this.fetchRevision(context, expectedRevision)).snapshot;
    }
    const reference = await this.api.getRef(
      context.config.owner,
      context.config.repository,
      context.branch,
      context.credential,
    );
    if (expectedRevision === null && reference) {
      throw remoteChanged(null, getReferenceRevision(reference), 'head-mismatch');
    }
    if (!reference) {
      const files: VscRemoteSnapshotFile[] = [];
      return {
        revision: null,
        contentHash: computeRemoteSnapshotContentHash(files),
        files,
        metadata: createMetadata(context, null),
      };
    }
    const revision = getReferenceRevision(reference);
    return (await this.fetchRevision(context, revision)).snapshot;
  }

  async publishSnapshot(
    target: RemoteSyncAdapterTarget,
    snapshot: VscRemoteSnapshot,
    expectedRevision: string | null,
  ): Promise<RemoteSyncPublishResult> {
    const context = await this.createContext(target, 'required');
    if (context.repository.archived) {
      throw new RemoteSyncError('PERMISSION_DENIED', 'GitHub repository is archived', {
        details: { provider: this.provider, operation: 'publish', reasonCode: 'repository-archived' },
      });
    }
    const credential = requireCredential(context.credential);
    const files = normalizePublishedFiles(snapshot.files, this.limits);
    const contentHash = computeRemoteSnapshotContentHash(files);
    const reference = await this.api.getRef(
      context.config.owner,
      context.config.repository,
      context.branch,
      credential,
    );
    const currentRevision = reference ? getReferenceRevision(reference) : null;
    if (currentRevision !== expectedRevision) {
      throw remoteChanged(expectedRevision, currentRevision, 'head-mismatch');
    }

    if (currentRevision === null) {
      return this.createInitialBranch(context, files, contentHash, credential);
    }

    const current = await this.fetchRevision(context, currentRevision);
    if (current.snapshot.contentHash === contentHash) {
      return {
        revision: currentRevision,
        contentHash,
        metadata: current.snapshot.metadata,
      };
    }

    const currentFiles = new Map(current.snapshot.files.map((file) => [file.path, file]));
    const nextFiles = new Map(files.map((file) => [file.path, file]));
    const changedFiles = files.filter((file) => currentFiles.get(file.path)?.content !== file.content);
    const createdBlobs = await mapConcurrent(changedFiles, this.limits.blobConcurrency, async (file) => {
      const created = await this.api.createBlob(
        context.config.owner,
        context.config.repository,
        file.content,
        credential,
      );
      return [file.path, requireSha(created.sha, 'created-blob-sha')] as const;
    });
    const blobShas = new Map(createdBlobs);
    const entries: GitHubCreateTreeEntry[] = changedFiles.map((file) => ({
      path: addGitHubSubdirectory(file.path, context.config.subdirectory),
      mode: normalizeFileMode(file.mode, currentFiles.get(file.path)?.mode),
      type: 'blob',
      sha: requireSha(blobShas.get(file.path), 'created-blob-sha'),
    }));
    for (const currentFile of current.snapshot.files) {
      if (!nextFiles.has(currentFile.path)) {
        entries.push({
          path: addGitHubSubdirectory(currentFile.path, context.config.subdirectory),
          mode: normalizeFileMode(currentFile.mode),
          type: 'blob',
          sha: null,
        });
      }
    }

    const tree = await this.api.createTree(
      context.config.owner,
      context.config.repository,
      entries,
      current.rootTreeSha,
      credential,
    );
    const commit = await this.api.createCommit(
      context.config.owner,
      context.config.repository,
      requireSha(tree.sha, 'created-tree-sha'),
      [currentRevision],
      credential,
    );
    const revision = requireSha(commit.sha, 'created-commit-sha');
    await this.api.updateRef(context.config.owner, context.config.repository, context.branch, revision, credential);
    return {
      revision,
      contentHash,
      metadata: createMetadata(context, requireSha(tree.sha, 'created-tree-sha')),
    };
  }

  private async createInitialBranch(
    context: GitHubTargetContext,
    files: readonly VscRemoteSnapshotFile[],
    contentHash: string,
    credential: string,
  ): Promise<RemoteSyncPublishResult> {
    if (!context.branch) {
      throw invalidConfig('GitHub branch is required to create a branch', 'branch-required');
    }
    const blobs = await mapConcurrent(files, this.limits.blobConcurrency, async (file) => {
      const created = await this.api.createBlob(
        context.config.owner,
        context.config.repository,
        file.content,
        credential,
      );
      return [file.path, requireSha(created.sha, 'created-blob-sha')] as const;
    });
    const blobShas = new Map(blobs);
    const entries: GitHubCreateTreeEntry[] = files.map((file) => ({
      path: addGitHubSubdirectory(file.path, context.config.subdirectory),
      mode: normalizeFileMode(file.mode),
      type: 'blob',
      sha: requireSha(blobShas.get(file.path), 'created-blob-sha'),
    }));
    const tree = await this.api.createTree(context.config.owner, context.config.repository, entries, null, credential);
    const treeSha = requireSha(tree.sha, 'created-tree-sha');
    const commit = await this.api.createCommit(
      context.config.owner,
      context.config.repository,
      treeSha,
      [],
      credential,
    );
    const revision = requireSha(commit.sha, 'created-commit-sha');
    await this.api.createRef(context.config.owner, context.config.repository, context.branch, revision, credential);
    return {
      revision,
      contentHash,
      metadata: createMetadata(context, treeSha),
    };
  }

  private async fetchRevision(context: GitHubTargetContext, revision: string): Promise<FetchedSnapshot> {
    const commit = await this.api.getCommit(
      context.config.owner,
      context.config.repository,
      revision,
      context.credential,
    );
    const rootTreeSha = requireSha(commit.tree?.sha, 'commit-tree-sha');
    const tree = await this.api.getTree(
      context.config.owner,
      context.config.repository,
      rootTreeSha,
      true,
      context.credential,
    );
    const entries = selectSnapshotEntries(tree, context.config.subdirectory, this.limits);
    const files = await mapConcurrent(entries, this.limits.blobConcurrency, async (entry) => {
      const blob = await this.api.getBlob(
        context.config.owner,
        context.config.repository,
        entry.sha,
        context.credential,
      );
      return {
        path: entry.path,
        content: decodeBlob(blob, entry),
        mode: entry.mode,
      };
    });
    return {
      rootTreeSha,
      snapshot: {
        revision,
        contentHash: computeRemoteSnapshotContentHash(files),
        files,
        metadata: createMetadata(context, rootTreeSha),
      },
    };
  }

  private async createContext(
    target: RemoteSyncAdapterTarget,
    credentialMode: RemoteCredentialMode,
  ): Promise<GitHubTargetContext> {
    const config = this.normalizeConfig(target.config);
    const credential = await this.credentialResolver.resolve(target.authRef, credentialMode);
    const repository = await this.api.getRepository(config.owner, config.repository, credential);
    const normalizedRepository = normalizeRepository(repository);
    if (!config.branch && !normalizedRepository.default_branch) {
      throw invalidConfig('GitHub default branch is unavailable', 'default-branch-unavailable');
    }
    const branch = config.branch || normalizeGitHubBranch(normalizedRepository.default_branch);
    return { config, branch, credential, repository: normalizedRepository };
  }
}

function normalizeRepository(repository: GitHubRepository): GitHubRepository {
  if (!isRecord(repository)) {
    throw unsafeContent('GitHub repository response is invalid', 'invalid-repository-response');
  }
  const defaultBranch = repository.default_branch;
  if (
    (defaultBranch !== null && typeof defaultBranch !== 'string') ||
    typeof repository.private !== 'boolean' ||
    typeof repository.archived !== 'boolean'
  ) {
    throw unsafeContent('GitHub repository response is invalid', 'invalid-repository-response');
  }
  let normalizedDefaultBranch: string | null = null;
  if (defaultBranch !== null) {
    try {
      normalizedDefaultBranch = normalizeGitHubBranch(defaultBranch) || null;
    } catch {
      throw unsafeContent('GitHub repository response is invalid', 'invalid-repository-response');
    }
  }
  return {
    default_branch: normalizedDefaultBranch,
    private: repository.private,
    archived: repository.archived,
  };
}

function selectSnapshotEntries(
  tree: GitHubTree,
  subdirectory: string | null,
  limits: GitHubSnapshotLimits,
): SelectedTreeEntry[] {
  if (!isRecord(tree) || tree.truncated !== false) {
    throw unsafeContent(
      tree?.truncated === true ? 'GitHub recursive tree is truncated' : 'GitHub tree response is invalid',
      tree?.truncated === true ? 'truncated-tree' : 'invalid-tree-response',
    );
  }
  if (!Array.isArray(tree.tree)) {
    throw unsafeContent('GitHub tree response is invalid', 'invalid-tree-response');
  }
  const selected: SelectedTreeEntry[] = [];
  const exactPaths = new Set<string>();
  const foldedPaths = new Map<string, string>();
  let totalBytes = 0;

  for (const rawEntry of tree.tree) {
    const entry = normalizeTreeEntry(rawEntry);
    if (subdirectory !== null && entry.path === subdirectory) {
      if (entry.type !== 'tree') {
        throw unsafeContent('GitHub subdirectory is not a directory', 'subdirectory-not-directory');
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
    if (!Number.isSafeInteger(entry.size) || (entry.size as number) < 0) {
      throw unsafeContent('Git blob size is unavailable', 'blob-size-unavailable');
    }
    const size = entry.size as number;
    if (size > limits.maxFileBytes) {
      throw unsafeContent('Git blob exceeds the file size limit', 'file-size-limit');
    }
    totalBytes += size;
    if (totalBytes > limits.maxTotalBytes) {
      throw unsafeContent('Git snapshot exceeds the total size limit', 'total-size-limit');
    }
    const path = validateSnapshotPath(stripGitHubSubdirectory(entry.path, subdirectory));
    assertUniquePath(path, exactPaths, foldedPaths);
    selected.push({ path, mode: entry.mode, sha: requireSha(entry.sha, 'blob-sha'), size });
    if (selected.length > limits.maxFiles) {
      throw unsafeContent('Git snapshot exceeds the file count limit', 'file-count-limit');
    }
  }

  return selected.sort((left, right) => Buffer.compare(Buffer.from(left.path), Buffer.from(right.path)));
}

function normalizeTreeEntry(entry: GitHubTreeEntry): GitHubTreeEntry {
  if (
    !isRecord(entry) ||
    typeof entry.path !== 'string' ||
    typeof entry.mode !== 'string' ||
    typeof entry.type !== 'string'
  ) {
    throw unsafeContent('Git tree entry is invalid', 'invalid-tree-entry');
  }
  if (entry.path.includes('\\')) {
    throw unsafeContent('Git tree path is not a POSIX path', 'invalid-tree-path');
  }
  validateGitTreePath(entry.path);
  return entry;
}

function decodeBlob(blob: unknown, entry: SelectedTreeEntry): string {
  if (!isRecord(blob) || blob.encoding !== 'base64' || typeof blob.content !== 'string') {
    throw unsafeContent('GitHub blob response is invalid', 'invalid-blob-response');
  }
  const encoded = blob.content.replace(/\s/gu, '');
  if (encoded.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/u.test(encoded)) {
    throw unsafeContent('GitHub blob encoding is invalid', 'invalid-blob-encoding');
  }
  const bytes = Buffer.from(encoded, 'base64');
  if (bytes.byteLength !== entry.size || blob.size !== entry.size) {
    throw unsafeContent('GitHub blob size does not match its tree entry', 'blob-size-mismatch');
  }
  let content: string;
  try {
    content = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    throw unsafeContent('Git blob is not valid UTF-8 text', 'invalid-utf8');
  }
  if (hasBinaryControlCharacter(content)) {
    throw unsafeContent('Binary Git blobs are unsupported', 'binary-content');
  }
  if (content.startsWith('version https://git-lfs.github.com/spec/v1\n')) {
    throw unsafeContent('Git LFS pointer files are unsupported', 'lfs-unsupported');
  }
  return content;
}

function normalizePublishedFiles(
  input: readonly VscRemoteSnapshotFile[],
  limits: GitHubSnapshotLimits,
): VscRemoteSnapshotFile[] {
  if (!Array.isArray(input)) {
    throw unsafeContent('Remote snapshot files must be an array', 'invalid-snapshot');
  }
  if (input.length > limits.maxFiles) {
    throw unsafeContent('Remote snapshot exceeds the file count limit', 'file-count-limit');
  }
  const exactPaths = new Set<string>();
  const foldedPaths = new Map<string, string>();
  let totalBytes = 0;
  const files = input.map((file) => {
    if (!isRecord(file) || typeof file.content !== 'string') {
      throw unsafeContent('Remote snapshot file is invalid', 'invalid-snapshot-file');
    }
    let language: string | undefined;
    if (typeof file.language === 'string') {
      language = file.language;
    } else if (file.language !== undefined) {
      throw unsafeContent('Remote snapshot file language is invalid', 'invalid-snapshot-file');
    }
    const path = validateSnapshotPath(file.path);
    assertUniquePath(path, exactPaths, foldedPaths);
    validateTextContent(file.content);
    const bytes = Buffer.byteLength(file.content, 'utf8');
    if (bytes > limits.maxFileBytes) {
      throw unsafeContent('Remote snapshot file exceeds the size limit', 'file-size-limit');
    }
    totalBytes += bytes;
    if (totalBytes > limits.maxTotalBytes) {
      throw unsafeContent('Remote snapshot exceeds the total size limit', 'total-size-limit');
    }
    return {
      path,
      content: file.content,
      ...(file.mode ? { mode: normalizeFileMode(file.mode) } : {}),
      ...(language ? { language } : {}),
    };
  });
  return files.sort((left, right) => Buffer.compare(Buffer.from(left.path), Buffer.from(right.path)));
}

function validateSnapshotPath(value: unknown): string {
  if (typeof value !== 'string' || value.includes('\\')) {
    throw unsafeContent('Remote snapshot path is invalid', 'invalid-snapshot-path');
  }
  let path: string;
  try {
    path = normalizePath(value);
  } catch {
    throw unsafeContent('Remote snapshot path is invalid', 'invalid-snapshot-path');
  }
  if (path.split('/').some((segment) => segment.toLocaleLowerCase('en-US') === '.git')) {
    throw unsafeContent('Remote snapshot path contains a reserved segment', 'reserved-snapshot-path');
  }
  return path;
}

function validateGitTreePath(value: string): void {
  if (!value || value.startsWith('/') || value.endsWith('/') || value.includes('//')) {
    throw unsafeContent('Git tree path is invalid', 'invalid-tree-path');
  }
  const segments = value.split('/');
  if (segments.some((segment) => segment === '.' || segment === '..' || !segment || segment.includes('\0'))) {
    throw unsafeContent('Git tree path is invalid', 'invalid-tree-path');
  }
}

function assertUniquePath(path: string, exactPaths: Set<string>, foldedPaths: Map<string, string>): void {
  if (exactPaths.has(path)) {
    throw unsafeContent('Remote snapshot contains a duplicate path', 'duplicate-path');
  }
  exactPaths.add(path);
  const folded = path.toLocaleLowerCase('en-US');
  const existing = foldedPaths.get(folded);
  if (existing && existing !== path) {
    throw unsafeContent('Remote snapshot contains a case-conflicting path', 'case-conflicting-path');
  }
  foldedPaths.set(folded, path);
}

function normalizeFileMode(mode: unknown, fallback?: unknown): '100644' | '100755' {
  const value = mode === undefined ? fallback ?? '100644' : mode;
  if (value !== '100644' && value !== '100755') {
    throw unsafeContent('Remote snapshot file mode is unsupported', 'file-mode-unsupported');
  }
  return value;
}

function normalizeLimits(input: Partial<GitHubSnapshotLimits> | undefined): GitHubSnapshotLimits {
  const limits = { ...defaultLimits, ...input };
  for (const [name, value] of Object.entries(limits)) {
    if (!Number.isSafeInteger(value) || value <= 0) {
      throw invalidConfig(`GitHub snapshot ${name} must be a positive integer`, 'invalid-snapshot-limit');
    }
  }
  return limits;
}

function createMetadata(context: GitHubTargetContext, treeSha: string | null) {
  return {
    branch: context.branch,
    defaultBranch: context.repository.default_branch,
    private: context.repository.private,
    archived: context.repository.archived,
    treeSha,
  };
}

function requireSha(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value || value.length > 128 || !/^[A-Za-z0-9._-]+$/u.test(value)) {
    throw unsafeContent(`GitHub ${field} is invalid`, `invalid-${field}`);
  }
  return value;
}

function getReferenceRevision(reference: unknown): string {
  if (!isRecord(reference) || !isRecord(reference.object) || reference.object.type !== 'commit') {
    throw unsafeContent('GitHub branch reference is invalid', 'invalid-ref-response');
  }
  return requireSha(reference.object.sha, 'ref-sha');
}

function requireCredential(value: string | null): string {
  if (!value) {
    throw new RemoteSyncError('CREDENTIAL_UNAVAILABLE', 'GitHub publishing requires a credential', {
      details: { provider: 'github', operation: 'publish', reasonCode: 'credential-required' },
    });
  }
  return value;
}

function remoteChanged(expected: string | null, current: string | null, reasonCode: string): RemoteSyncError {
  return new RemoteSyncError('REMOTE_CHANGED', 'GitHub branch changed before publishing', {
    details: {
      provider: 'github',
      operation: 'publish',
      reasonCode,
      expectedRemoteRevision: expected,
      currentRemoteRevision: current,
    },
  });
}

function invalidConfig(message: string, reasonCode: string): RemoteSyncError {
  return new RemoteSyncError('CONFIG_INVALID', message, {
    details: { provider: 'github', reasonCode },
  });
}

function unsafeContent(message: string, reasonCode: string): RemoteSyncError {
  return new RemoteSyncError('UNSAFE_CONTENT', message, {
    details: { provider: 'github', reasonCode },
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
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

function hasBinaryControlCharacter(value: string): boolean {
  for (const character of value) {
    const code = character.charCodeAt(0);
    if ((code < 0x20 && code !== 0x09 && code !== 0x0a && code !== 0x0c && code !== 0x0d) || code === 0x7f) {
      return true;
    }
  }
  return false;
}

function validateTextContent(content: string): void {
  if (hasBinaryControlCharacter(content)) {
    throw unsafeContent('Binary snapshot files are unsupported', 'binary-content');
  }
  if (content.startsWith('version https://git-lfs.github.com/spec/v1\n')) {
    throw unsafeContent('Git LFS pointer files are unsupported', 'lfs-unsupported');
  }
}
