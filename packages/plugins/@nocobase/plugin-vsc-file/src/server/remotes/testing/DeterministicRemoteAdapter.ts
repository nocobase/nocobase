/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type {
  VscRemoteSafeMetadata,
  VscRemoteSnapshot,
  VscRemoteSnapshotFile,
} from '../../../shared/remote-sync-types';
import {
  normalizeGitHubRemoteConfig,
  RemoteSyncError,
  type RemoteSyncAdapter,
  type RemoteSyncAdapterCapabilities,
  type RemoteSyncAdapterTarget,
  type RemoteSyncProbeResult,
  type RemoteSyncPublishResult,
} from '../RemoteSyncAdapter';
import { computeRemoteSnapshotContentHash, normalizeRemoteSnapshotFiles } from '../snapshot';

export type DeterministicRemoteOperation = 'probe' | 'fetch' | 'publish';

export interface DeterministicRemoteAdapterOptions {
  title?: string;
  readOnly?: boolean;
  initialFiles?: readonly VscRemoteSnapshotFile[];
  initialRevision?: string | null;
  initialMetadata?: VscRemoteSafeMetadata;
}

function cloneMetadata(metadata: VscRemoteSafeMetadata): VscRemoteSafeMetadata {
  return { ...metadata };
}

function cloneFiles(files: readonly VscRemoteSnapshotFile[]): VscRemoteSnapshotFile[] {
  return files.map((file) => ({ ...file }));
}

function cloneSnapshot(snapshot: VscRemoteSnapshot): VscRemoteSnapshot {
  return {
    revision: snapshot.revision,
    contentHash: snapshot.contentHash,
    files: cloneFiles(snapshot.files),
    metadata: cloneMetadata(snapshot.metadata),
  };
}

export class DeterministicRemoteAdapter implements RemoteSyncAdapter {
  readonly provider = 'github' as const;

  readonly title: string;

  readonly capabilities: RemoteSyncAdapterCapabilities;

  private snapshot: VscRemoteSnapshot;

  private revisionSequence = 0;

  private publishCount = 0;

  private readonly failures = new Map<DeterministicRemoteOperation, RemoteSyncError>();

  private readonly nextFailures = new Map<DeterministicRemoteOperation, RemoteSyncError>();

  constructor(options: DeterministicRemoteAdapterOptions = {}) {
    this.title = options.title || 'Deterministic remote';
    this.capabilities = {
      probe: true,
      fetch: true,
      publish: !options.readOnly,
      readOnly: Boolean(options.readOnly),
    };

    const files = normalizeRemoteSnapshotFiles(options.initialFiles || []);
    const contentHash = computeRemoteSnapshotContentHash(files);
    if (options.initialRevision === null && files.length > 0) {
      throw new RemoteSyncError('CONFIG_INVALID', 'A non-empty deterministic snapshot requires a revision', {
        details: { provider: this.provider, reasonCode: 'non-empty-snapshot-without-revision' },
      });
    }
    const initialRevision =
      options.initialRevision === undefined
        ? files.length > 0
          ? this.createRevision(contentHash)
          : null
        : options.initialRevision;
    this.snapshot = {
      revision: initialRevision,
      contentHash,
      files,
      metadata: cloneMetadata(options.initialMetadata || {}),
    };
  }

  normalizeConfig(input: unknown) {
    return normalizeGitHubRemoteConfig(input);
  }

  async probe(target: RemoteSyncAdapterTarget): Promise<RemoteSyncProbeResult> {
    this.assertTarget(target);
    this.throwConfiguredFailure('probe');
    return {
      revision: this.snapshot.revision,
      metadata: cloneMetadata(this.snapshot.metadata),
    };
  }

  async fetchSnapshot(target: RemoteSyncAdapterTarget): Promise<VscRemoteSnapshot> {
    this.assertTarget(target);
    this.throwConfiguredFailure('fetch');
    return cloneSnapshot(this.snapshot);
  }

  async publishSnapshot(
    target: RemoteSyncAdapterTarget,
    snapshot: VscRemoteSnapshot,
    expectedRevision: string | null,
  ): Promise<RemoteSyncPublishResult> {
    this.assertTarget(target);
    this.throwConfiguredFailure('publish');
    if (this.capabilities.readOnly) {
      throw new RemoteSyncError('PERMISSION_DENIED', 'Deterministic remote is read-only', {
        details: { provider: this.provider, operation: 'publish', reasonCode: 'read-only' },
      });
    }
    if (expectedRevision !== this.snapshot.revision) {
      throw new RemoteSyncError('REMOTE_CHANGED', 'Deterministic remote revision changed', {
        details: {
          provider: this.provider,
          operation: 'publish',
          expectedRemoteRevision: expectedRevision,
          currentRemoteRevision: this.snapshot.revision,
        },
      });
    }

    const files = normalizeRemoteSnapshotFiles(snapshot.files);
    const contentHash = computeRemoteSnapshotContentHash(files);
    if (this.snapshot.revision !== null && contentHash === this.snapshot.contentHash) {
      return {
        revision: this.snapshot.revision,
        contentHash: this.snapshot.contentHash,
        metadata: cloneMetadata(this.snapshot.metadata),
      };
    }

    const revision = this.createRevision(contentHash);
    this.snapshot = {
      revision,
      contentHash,
      files,
      metadata: cloneMetadata(snapshot.metadata),
    };
    this.publishCount += 1;
    return {
      revision,
      contentHash,
      metadata: cloneMetadata(this.snapshot.metadata),
    };
  }

  advanceRemote(files: readonly VscRemoteSnapshotFile[], metadata: VscRemoteSafeMetadata = {}): VscRemoteSnapshot {
    const normalizedFiles = normalizeRemoteSnapshotFiles(files);
    const contentHash = computeRemoteSnapshotContentHash(normalizedFiles);
    this.snapshot = {
      revision: this.createRevision(contentHash),
      contentHash,
      files: normalizedFiles,
      metadata: cloneMetadata(metadata),
    };
    return cloneSnapshot(this.snapshot);
  }

  getSnapshot(): VscRemoteSnapshot {
    return cloneSnapshot(this.snapshot);
  }

  getPublishCount(): number {
    return this.publishCount;
  }

  setFailure(operation: DeterministicRemoteOperation, error: RemoteSyncError | null): void {
    if (error) {
      this.failures.set(operation, error);
    } else {
      this.failures.delete(operation);
    }
  }

  failNext(operation: DeterministicRemoteOperation, error: RemoteSyncError): void {
    this.nextFailures.set(operation, error);
  }

  private assertTarget(target: RemoteSyncAdapterTarget): void {
    this.normalizeConfig(target.config);
  }

  private throwConfiguredFailure(operation: DeterministicRemoteOperation): void {
    const nextFailure = this.nextFailures.get(operation);
    if (nextFailure) {
      this.nextFailures.delete(operation);
      throw nextFailure;
    }
    const failure = this.failures.get(operation);
    if (failure) {
      throw failure;
    }
  }

  private createRevision(contentHash: string): string {
    this.revisionSequence += 1;
    return `deterministic:${this.revisionSequence}:${contentHash.slice('sha256:'.length)}`;
  }
}
