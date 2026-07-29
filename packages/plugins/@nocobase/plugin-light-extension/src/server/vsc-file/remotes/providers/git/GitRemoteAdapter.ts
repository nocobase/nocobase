/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type {
  GitRemoteCredential,
  VscGitRemoteConfig,
  VscGitRemoteTransport,
  VscRemoteSafeMetadata,
  VscRemoteSnapshot,
  VscRemoteSnapshotFile,
} from '../../../../../shared/vsc-file/remote-sync-types';
import { TextDecoder } from 'node:util';
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
import type { GitCommandResult, GitCommandRunner } from './GitCommandRunner';
import { GitRepositoryWorkspace, type GitCommandExecutor, type GitCommitIdentity } from './GitRepositoryWorkspace';
import { normalizeGitRemoteConfig, normalizeGitRemoteConfigDraft, parseGitRemoteCredential } from './gitConfig';
import { normalizeGitSnapshotLimits, normalizePublishedGitFiles, type GitSnapshotLimits } from './gitSnapshotPolicy';

interface CredentialResolver {
  resolve(authRef: unknown, mode?: RemoteCredentialMode): Promise<string | null>;
}

export interface GitRemoteAdapterOptions {
  credentialResolver: Pick<RemoteCredentialResolver, 'resolve'> | CredentialResolver;
  runner: Pick<GitCommandRunner, 'run'> | GitCommandExecutor;
  limits?: Partial<GitSnapshotLimits>;
  temporaryDirectory?: string;
  identity?: Partial<GitCommitIdentity>;
}

interface GitTargetContext {
  config: VscGitRemoteConfig;
  credential: GitRemoteCredential | null;
}

interface ProbedBranch {
  branch: string;
  revision: string | null;
  defaultBranch: string | null;
}

export class GitRemoteAdapter implements RemoteSyncAdapter {
  readonly provider = 'git' as const;

  readonly title = 'Git';

  readonly capabilities: RemoteSyncAdapterCapabilities = {
    probe: true,
    fetch: true,
    publish: true,
    readOnly: false,
  };

  private readonly credentialResolver: CredentialResolver;

  private readonly runner: GitCommandExecutor;

  private readonly limits: GitSnapshotLimits;

  private readonly temporaryDirectory?: string;

  private readonly identity?: Partial<GitCommitIdentity>;

  constructor(options: GitRemoteAdapterOptions) {
    this.credentialResolver = options.credentialResolver;
    this.runner = options.runner;
    this.limits = normalizeGitSnapshotLimits(options.limits);
    this.temporaryDirectory = options.temporaryDirectory;
    this.identity = options.identity;
  }

  normalizeConfig(input: unknown): VscGitRemoteConfig {
    return normalizeGitRemoteConfig(input);
  }

  async resolveConfigDraft(input: unknown, authRef: unknown = null): Promise<VscGitRemoteConfig> {
    const draft = normalizeGitRemoteConfigDraft(input);
    if (draft.branch !== null) {
      return normalizeGitRemoteConfig(draft);
    }
    const credential = await this.resolveCredential(draft.transport, authRef, 'optional');
    const probed = await this.probeDefaultBranch(draft.url, draft.transport, credential);
    return normalizeGitRemoteConfig({ ...draft, branch: probed.branch });
  }

  async probe(target: RemoteSyncAdapterTarget): Promise<RemoteSyncProbeResult> {
    const draft = normalizeGitRemoteConfigDraft(target.config);
    const credential = await this.resolveCredential(draft.transport, target.authRef, 'optional');
    const probed = draft.branch
      ? await this.probeBranch(draft.url, draft.transport, credential, draft.branch)
      : await this.probeDefaultBranch(draft.url, draft.transport, credential);
    return {
      revision: probed.revision,
      metadata: createMetadata(draft.url, draft.transport, probed.branch, probed.defaultBranch, null),
    };
  }

  async fetchSnapshot(target: RemoteSyncAdapterTarget, expectedRevision?: string | null): Promise<VscRemoteSnapshot> {
    const context = await this.createContext(target, 'optional');
    if (typeof expectedRevision === 'string') {
      requireGitOid(expectedRevision, 'expected-revision');
    }
    const workspace = await this.createWorkspace(context);
    let operationFailed = false;
    try {
      if (expectedRevision === null) {
        const probed = await this.probeBranch(
          context.config.url,
          context.config.transport,
          context.credential,
          context.config.branch,
        );
        if (probed.revision !== null) {
          throw remoteChanged(null, probed.revision, 'head-mismatch', 'fetch');
        }
        return emptySnapshot(context.config, probed.defaultBranch);
      }

      let revisionToRead = expectedRevision;
      if (revisionToRead === undefined) {
        const probed = await this.probeBranch(
          context.config.url,
          context.config.transport,
          context.credential,
          context.config.branch,
        );
        if (probed.revision === null) {
          return emptySnapshot(context.config, probed.defaultBranch);
        }
        revisionToRead = probed.revision;
      }

      const fetchedRevision = await workspace.fetchBranch();
      if (fetchedRevision !== revisionToRead) {
        throw remoteChanged(revisionToRead, fetchedRevision, 'fetched-head-mismatch', 'fetch');
      }
      const fetched = await workspace.readSnapshot(fetchedRevision);
      return {
        revision: fetchedRevision,
        contentHash: computeRemoteSnapshotContentHash(fetched.files),
        files: fetched.files,
        metadata: createMetadata(
          context.config.url,
          context.config.transport,
          context.config.branch,
          null,
          fetched.treeOid,
        ),
      };
    } catch (error) {
      operationFailed = true;
      throw error;
    } finally {
      await cleanupWorkspace(workspace, operationFailed);
    }
  }

  async publishSnapshot(
    target: RemoteSyncAdapterTarget,
    snapshot: VscRemoteSnapshot,
    expectedRevision: string | null,
  ): Promise<RemoteSyncPublishResult> {
    if (expectedRevision !== null) {
      requireGitOid(expectedRevision, 'expected-revision');
    }
    const context = await this.createContext(target, 'optional');
    const files = normalizePublishedGitFiles(snapshot.files, this.limits);
    const contentHash = computeRemoteSnapshotContentHash(files);
    const current = await this.probeBranch(
      context.config.url,
      context.config.transport,
      context.credential,
      context.config.branch,
    );
    if (current.revision !== expectedRevision) {
      throw remoteChanged(expectedRevision, current.revision, 'head-mismatch');
    }

    const workspace = await this.createWorkspace(context);
    let operationFailed = false;
    try {
      let currentFiles: VscRemoteSnapshotFile[] = [];
      let currentTreeOid: string | undefined;
      if (current.revision !== null) {
        const fetchedRevision = await workspace.fetchBranch();
        if (fetchedRevision !== current.revision) {
          throw remoteChanged(current.revision, fetchedRevision, 'fetched-head-mismatch');
        }
        const fetched = await workspace.readSnapshot(fetchedRevision);
        currentFiles = fetched.files;
        currentTreeOid = fetched.treeOid;
      }

      const created = currentTreeOid
        ? await workspace.createCommit(files, current.revision, currentFiles, currentTreeOid)
        : await workspace.createCommit(files, current.revision, currentFiles);
      if (created.commitOid === null) {
        if (current.revision === null) {
          throw unsafeProviderResponse('Git tree comparison state is invalid', 'invalid-tree-comparison');
        }
        const observed = await this.probeBranch(
          context.config.url,
          context.config.transport,
          context.credential,
          context.config.branch,
        );
        if (observed.revision !== current.revision) {
          throw remoteChanged(current.revision, observed.revision, 'head-mismatch');
        }
        return {
          revision: current.revision,
          contentHash,
          metadata: createMetadata(
            context.config.url,
            context.config.transport,
            context.config.branch,
            current.defaultBranch,
            created.treeOid,
          ),
        };
      }
      const commitOid = created.commitOid;
      try {
        await workspace.pushCommit(commitOid, expectedRevision);
      } catch (pushError) {
        let observed: ProbedBranch;
        try {
          observed = await this.probeBranch(
            context.config.url,
            context.config.transport,
            context.credential,
            context.config.branch,
          );
        } catch {
          throw safePushError(pushError);
        }
        if (observed.revision === commitOid) {
          return createPublishResult(context.config, commitOid, contentHash, created.treeOid);
        }
        if (observed.revision !== expectedRevision) {
          throw remoteChanged(expectedRevision, observed.revision, 'lease-rejected');
        }
        throw safePushError(pushError);
      }

      const observed = await this.probeBranch(
        context.config.url,
        context.config.transport,
        context.credential,
        context.config.branch,
      );
      if (observed.revision !== commitOid) {
        throw remoteChanged(commitOid, observed.revision, 'published-head-mismatch');
      }
      return createPublishResult(context.config, commitOid, contentHash, created.treeOid);
    } catch (error) {
      operationFailed = true;
      throw error;
    } finally {
      await cleanupWorkspace(workspace, operationFailed);
    }
  }

  private async createContext(target: RemoteSyncAdapterTarget, mode: RemoteCredentialMode): Promise<GitTargetContext> {
    const config = this.normalizeConfig(target.config);
    const credential = await this.resolveCredential(config.transport, target.authRef, mode);
    return { config, credential };
  }

  private async resolveCredential(
    transport: VscGitRemoteTransport,
    authRef: unknown,
    requestedMode: RemoteCredentialMode,
  ): Promise<GitRemoteCredential | null> {
    const rawCredential = await this.credentialResolver.resolve(authRef, requestedMode);
    return rawCredential === null ? null : parseGitRemoteCredential(rawCredential, transport);
  }

  private async probeDefaultBranch(
    url: string,
    transport: VscGitRemoteTransport,
    credential: GitRemoteCredential | null,
  ): Promise<ProbedBranch> {
    const result = await this.runRemote(
      ['ls-remote', '--symref', url, 'HEAD'],
      url,
      transport,
      credential,
      'probe-default-branch',
    );
    if (result.stdout.byteLength === 0) {
      throw new RemoteSyncError('CONFIG_INVALID', 'Git default branch is unavailable', {
        details: { provider: 'git', reasonCode: 'default-branch-unavailable' },
      });
    }
    const lines = decodeLines(result.stdout);
    const symbolic = lines.filter((line) => line.startsWith('ref: refs/heads/') && line.endsWith('\tHEAD'));
    const heads = lines.filter((line) => /^[0-9a-f]{40}\tHEAD$/u.test(line));
    if (lines.length !== 2 || symbolic.length !== 1 || heads.length !== 1) {
      throw new RemoteSyncError('CONFIG_INVALID', 'Git default branch is unavailable', {
        details: { provider: 'git', reasonCode: 'default-branch-unavailable' },
      });
    }
    const branch = symbolic[0].slice('ref: refs/heads/'.length, -'\tHEAD'.length);
    const normalized = normalizeGitRemoteConfigDraft({ url, branch, transport });
    if (normalized.branch === null) {
      throw unsafeProviderResponse('Git default branch response is invalid', 'invalid-ls-remote-response');
    }
    return {
      branch: normalized.branch,
      revision: requireGitOid(heads[0].slice(0, heads[0].indexOf('\t')), 'head'),
      defaultBranch: normalized.branch,
    };
  }

  private async probeBranch(
    url: string,
    transport: VscGitRemoteTransport,
    credential: GitRemoteCredential | null,
    branch: string,
  ): Promise<ProbedBranch> {
    const ref = `refs/heads/${branch}`;
    const result = await this.runRemote(
      ['ls-remote', '--exit-code', url, ref],
      url,
      transport,
      credential,
      'probe-branch',
      [0, 2],
    );
    if (result.exitCode === 2 || result.stdout.byteLength === 0) {
      return { branch, revision: null, defaultBranch: null };
    }
    const lines = decodeLines(result.stdout);
    if (lines.length !== 1) {
      throw unsafeProviderResponse('Git branch response is invalid', 'invalid-ls-remote-response');
    }
    const [oid, returnedRef, extra] = lines[0].split('\t');
    if (extra !== undefined || returnedRef !== ref) {
      throw unsafeProviderResponse('Git branch response is invalid', 'invalid-ls-remote-response');
    }
    return { branch, revision: requireGitOid(oid, 'branch'), defaultBranch: null };
  }

  private runRemote(
    args: readonly string[],
    remoteUrl: string,
    transport: VscGitRemoteTransport,
    credential: GitRemoteCredential | null,
    operation: string,
    acceptableExitCodes?: readonly number[],
  ): Promise<GitCommandResult> {
    return this.runner.run({
      args,
      remoteUrl,
      transport,
      credential,
      operation,
      acceptableExitCodes,
    });
  }

  private createWorkspace(context: GitTargetContext): Promise<GitRepositoryWorkspace> {
    return GitRepositoryWorkspace.create({
      runner: this.runner,
      config: context.config,
      credential: context.credential,
      limits: this.limits,
      temporaryDirectory: this.temporaryDirectory,
      identity: this.identity,
    });
  }
}

function decodeLines(output: Buffer): string[] {
  if (output.byteLength === 0 || output[output.byteLength - 1] !== 0x0a) {
    throw unsafeProviderResponse('Git remote response is invalid', 'invalid-ls-remote-response');
  }
  let value: string;
  try {
    value = new TextDecoder('utf-8', { fatal: true }).decode(output);
  } catch {
    throw unsafeProviderResponse('Git remote response is invalid', 'invalid-ls-remote-response');
  }
  const lines = value.slice(0, -1).split('\n');
  if (lines.some((line) => !line || line.includes('\r') || line.includes('\0'))) {
    throw unsafeProviderResponse('Git remote response is invalid', 'invalid-ls-remote-response');
  }
  return lines;
}

function emptySnapshot(config: VscGitRemoteConfig, defaultBranch: string | null): VscRemoteSnapshot {
  const files = [];
  return {
    revision: null,
    contentHash: computeRemoteSnapshotContentHash(files),
    files,
    metadata: createMetadata(config.url, config.transport, config.branch, defaultBranch, null),
  };
}

function createPublishResult(
  config: VscGitRemoteConfig,
  revision: string,
  contentHash: string,
  treeOid: string,
): RemoteSyncPublishResult {
  return {
    revision,
    contentHash,
    metadata: createMetadata(config.url, config.transport, config.branch, null, treeOid),
  };
}

function createMetadata(
  url: string,
  transport: VscGitRemoteTransport,
  branch: string,
  defaultBranch: string | null,
  treeOid: string | null,
): VscRemoteSafeMetadata {
  const parsed = new URL(url);
  return {
    branch,
    defaultBranch,
    transport,
    host: parsed.hostname,
    treeOid,
  };
}

function requireGitOid(value: string, field: string): string {
  if (!/^[0-9a-f]{40}$/u.test(value)) {
    throw unsafeProviderResponse(`Git ${field} object ID is invalid`, `invalid-${field}-oid`);
  }
  return value;
}

function remoteChanged(
  expected: string | null,
  current: string | null,
  reasonCode: string,
  operation = 'publish',
): RemoteSyncError {
  return new RemoteSyncError('REMOTE_CHANGED', 'Git branch changed during the remote operation', {
    details: {
      provider: 'git',
      operation,
      reasonCode,
      expectedRemoteRevision: expected,
      currentRemoteRevision: current,
    },
  });
}

function unsafeProviderResponse(message: string, reasonCode: string): RemoteSyncError {
  return new RemoteSyncError('REMOTE_UNAVAILABLE', message, {
    details: { provider: 'git', reasonCode },
  });
}

function safePushError(error: unknown): RemoteSyncError {
  if (error instanceof RemoteSyncError) {
    return error;
  }
  return new RemoteSyncError('REMOTE_UNAVAILABLE', 'Git push failed', {
    details: { provider: 'git', operation: 'push', reasonCode: 'git-command-failed' },
  });
}

async function cleanupWorkspace(workspace: GitRepositoryWorkspace, operationFailed: boolean): Promise<void> {
  try {
    await workspace.cleanup();
  } catch {
    if (!operationFailed) {
      throw new RemoteSyncError('REMOTE_UNAVAILABLE', 'Git workspace cleanup failed', {
        details: { provider: 'git', reasonCode: 'workspace-cleanup-failed' },
      });
    }
  }
}
