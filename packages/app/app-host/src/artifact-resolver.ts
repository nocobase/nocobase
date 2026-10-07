/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { deploymentLog } from './deployment-log.js';
import { createHash, randomUUID } from 'node:crypto';
import { createReadStream, createWriteStream } from 'node:fs';
import {
  mkdir,
  readFile,
  readdir,
  rename,
  rm,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';
import { finished, pipeline } from 'node:stream/promises';

import type { NocoBaseDriveDisk } from '@nocobase/drive';
import { x as extractTar } from 'tar';

import type { Logger } from '@nocobase/logging';

import type { DeploymentCatalog } from './deployment/catalog.ts';
import type { AppDefinition } from './app-types.ts';

export interface ArtifactReference {
  key: string;
  appId: string;
  version: string;
  checksum: string;
}

export interface ResolvedArtifact {
  reference: ArtifactReference;
  definition: AppDefinition;
  cacheHit: boolean;
  commit(): Promise<void>;
  rollback(): Promise<void>;
}

export interface ArtifactResolver {
  restore(reference: ArtifactReference): Promise<ResolvedArtifact>;
  resolve(reference: ArtifactReference): Promise<ResolvedArtifact>;
}

export interface DriveArtifactResolverOptions {
  /** Managed content-addressed layout: <app>/<checksum>. */
  appRevisionsDir?: string;
  localArtifactDir?: string;
  logger?: Logger;
  expandedRevisionLimit?: number;
}

interface InstalledArtifactMetadata {
  readonly formatVersion: 1;
  readonly reference: ArtifactReference;
  readonly installedAt?: string;
  readonly lastUsedAt?: string;
}

const INSTALLED_ARTIFACT_FILE = '.nocobase-artifact.json';
const DEFAULT_EXPANDED_REVISION_LIMIT = 3;

export class DriveArtifactResolver implements ArtifactResolver {
  async restore(reference: ArtifactReference): Promise<ResolvedArtifact> {
    validateArtifactReference(reference);
    await this.revisionPrunes.get(reference.appId);
    const targetDir = path.join(
      this.appRevisionsDir,
      reference.appId,
      reference.checksum.toLowerCase(),
    );
    const artifact = await this.resolveInstalledArtifact(
      reference,
      targetDir,
      false,
      true,
      reference.checksum.toLowerCase(),
    );
    if (!artifact)
      throw new Error(
        `Installed revision for app "${reference.appId}" is missing. Deploy the release again.`,
      );
    this.activeRevisionByApp.set(reference.appId, targetDir);
    return artifact;
  }
  readonly appRevisionsDir: string;
  readonly localArtifactDir?: string;
  readonly logger?: Logger;
  readonly expandedRevisionLimit?: number;
  private readonly activeRevisionByApp = new Map<string, string>();
  private readonly revisionPrunes = new Map<string, Promise<void>>();

  constructor(
    readonly disk: NocoBaseDriveDisk,
    readonly catalog: DeploymentCatalog,
    options: DriveArtifactResolverOptions,
  ) {
    this.appRevisionsDir = path.resolve(
      options.appRevisionsDir ?? catalog.deploymentsDir,
    );
    this.localArtifactDir = options.localArtifactDir
      ? path.resolve(options.localArtifactDir)
      : undefined;
    this.logger = options.logger;
    this.expandedRevisionLimit = options.expandedRevisionLimit;
    if (
      this.expandedRevisionLimit !== undefined &&
      (!Number.isSafeInteger(this.expandedRevisionLimit) ||
        this.expandedRevisionLimit < 1)
    ) {
      throw new Error('Expanded revision limit must be a positive integer');
    }
  }

  async resolve(reference: ArtifactReference): Promise<ResolvedArtifact> {
    validateArtifactReference(reference);
    // Host serializes deployments; finish the previous commit's cleanup before
    // any candidate revision is read or activated by the next operation.
    await this.revisionPrunes.get(reference.appId);
    await mkdir(this.appRevisionsDir, { recursive: true, mode: 0o700 });

    return this.resolveRevision(reference);
  }

  private async resolveRevision(
    reference: ArtifactReference,
  ): Promise<ResolvedArtifact> {
    const revisionRoot = path.join(this.appRevisionsDir, reference.appId);
    await mkdir(revisionRoot, { recursive: true, mode: 0o700 });

    const checksum = reference.checksum.toLowerCase();
    const targetDir = path.join(revisionRoot, checksum);
    const nonce = `${process.pid}.${randomUUID()}`;
    const archivePath = path.join(revisionRoot, `.${nonce}.tar.gz`);
    const stagingDir = path.join(revisionRoot, `.${nonce}.staging`);
    const startedAt = Date.now();
    let installed = false;

    try {
      const cachedArtifact = await this.resolveInstalledArtifact(
        reference,
        targetDir,
        true,
        true,
        checksum,
      );
      if (cachedArtifact) {
        deploymentLog('resolving', 'Reusing expanded release cache', {
          cacheHit: true,
        });
        this.logger?.info(
          {
            appId: reference.appId,
            artifactKey: reference.key,
            artifactVersion: reference.version,
            artifactChecksum: checksum,
            revisionDir: targetDir,
            cacheHit: true,
            durationMs: Date.now() - startedAt,
          },
          'Reused expanded app revision',
        );
        return this.withRevisionCommit(cachedArtifact, revisionRoot, targetDir);
      }

      deploymentLog('resolving', 'Reading release artifact');
      const checksumStartedAt = Date.now();
      const localPath = this.localArtifactPath(reference.key);
      const actualChecksum = localPath
        ? await hashLocalArtifact(localPath)
        : await downloadArtifact(this.disk, reference.key, archivePath);
      const checksumDurationMs = Date.now() - checksumStartedAt;
      deploymentLog('verifying', 'Verifying artifact checksum', {
        durationMs: checksumDurationMs,
      });
      if (actualChecksum !== checksum) {
        throw new Error(
          `Artifact checksum mismatch for app "${reference.appId}": expected "${reference.checksum}", received "${actualChecksum}"`,
        );
      }

      await mkdir(stagingDir, { recursive: true, mode: 0o700 });
      deploymentLog('extracting', 'Extracting release artifact');
      const extractStartedAt = Date.now();
      await extractTar({
        cwd: stagingDir,
        file: localPath ?? archivePath,
        gzip: true,
        preservePaths: false,
        strict: true,
        filter: assertSafeArchiveEntry,
      });
      const extractDurationMs = Date.now() - extractStartedAt;
      deploymentLog('preparing', 'Validating application entry point', {
        extractDurationMs,
      });
      const discoveryStartedAt = Date.now();
      // The archive checksum already identifies the revision's content, so the
      // catalog need not read and hash every expanded file again.
      const stagedDefinition = await this.catalog.discoverAt(
        reference.appId,
        stagingDir,
        { fingerprint: checksum },
      );
      assertArtifactIdentity(stagedDefinition, reference);
      await writeInstalledArtifactMetadata(stagingDir, reference);
      const discoveryDurationMs = Date.now() - discoveryStartedAt;

      await rename(stagingDir, targetDir);
      installed = true;
      const definition = await this.catalog.discoverAt(
        reference.appId,
        targetDir,
        { fingerprint: checksum },
      );

      this.logger?.info(
        {
          appId: reference.appId,
          artifactKey: reference.key,
          artifactVersion: reference.version,
          artifactChecksum: checksum,
          revisionDir: targetDir,
          cacheHit: false,
          checksumDurationMs,
          extractDurationMs,
          discoveryDurationMs,
          durationMs: Date.now() - startedAt,
        },
        'Installed expanded app revision',
      );

      let settled = false;
      return {
        reference,
        definition,
        cacheHit: false,
        commit: async (): Promise<void> => {
          if (settled) return;
          await this.catalog.selectRevision(reference.appId, checksum);
          settled = true;
          this.pruneRevisionsInBackground(revisionRoot, targetDir, reference);
        },
        rollback: async (): Promise<void> => {
          if (settled) return;
          settled = true;
          if (installed) {
            await rm(targetDir, { recursive: true, force: true });
          }
        },
      };
    } catch (error) {
      if (installed) {
        await rm(targetDir, { recursive: true, force: true });
      }
      throw error;
    } finally {
      await rm(archivePath, { force: true });
      await rm(stagingDir, { recursive: true, force: true });
    }
  }

  private localArtifactPath(key: string): string | undefined {
    if (!this.localArtifactDir) return undefined;
    const filePath = path.resolve(this.localArtifactDir, key);
    const relative = path.relative(this.localArtifactDir, filePath);
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
      throw new Error(
        'Artifact key resolves outside the local artifact directory',
      );
    }
    return filePath;
  }

  private async resolveInstalledArtifact(
    reference: ArtifactReference,
    targetDir: string,
    updateLastUsed: boolean,
    identifyByChecksum: boolean,
    installedFingerprint?: string,
  ): Promise<ResolvedArtifact | null> {
    const metadata = await readInstalledArtifactMetadata(targetDir);
    if (
      !metadata ||
      !(identifyByChecksum
        ? artifactChecksumsEqual(metadata.reference, reference)
        : artifactReferencesEqual(metadata.reference, reference))
    ) {
      return null;
    }
    const definition = await this.catalog.discoverAt(
      reference.appId,
      targetDir,
      { fingerprint: installedFingerprint },
    );
    assertArtifactIdentity(definition, reference);
    if (updateLastUsed) {
      await writeInstalledArtifactMetadata(targetDir, reference, metadata);
    }
    return {
      reference,
      definition,
      cacheHit: true,
      commit: () => Promise.resolve(),
      rollback: () => Promise.resolve(),
    };
  }

  private withRevisionCommit(
    artifact: ResolvedArtifact,
    revisionRoot: string,
    targetDir: string,
  ): ResolvedArtifact {
    let settled = false;
    return {
      ...artifact,
      commit: async (): Promise<void> => {
        if (settled) return;
        await this.catalog.selectRevision(
          artifact.reference.appId,
          artifact.reference.checksum.toLowerCase(),
        );
        settled = true;
        this.pruneRevisionsInBackground(
          revisionRoot,
          targetDir,
          artifact.reference,
        );
      },
      rollback: async (): Promise<void> => {
        settled = true;
      },
    };
  }

  private pruneRevisionsInBackground(
    revisionRoot: string,
    protectedDirectory: string,
    reference: ArtifactReference,
  ): void {
    this.activeRevisionByApp.set(reference.appId, protectedDirectory);
    const startedAt = Date.now();
    const previous = this.revisionPrunes.get(reference.appId);
    const pruning = (previous ?? Promise.resolve())
      .catch(() => undefined)
      .then(async () => {
        const currentDirectory = this.activeRevisionByApp.get(reference.appId);
        if (!currentDirectory) return;
        const removedDirectories = await pruneExpandedRevisions(
          revisionRoot,
          currentDirectory,
          this.expandedRevisionLimit ?? DEFAULT_EXPANDED_REVISION_LIMIT,
        );
        if (removedDirectories.length === 0) return;
        this.logger?.info(
          {
            appId: reference.appId,
            artifactKey: reference.key,
            removedDirectories,
            durationMs: Date.now() - startedAt,
          },
          'Pruned expanded app revision cache',
        );
      })
      .catch((error: unknown) => {
        this.logger?.warn(
          { err: error, appId: reference.appId, revisionRoot },
          'Failed to prune expanded app revision cache',
        );
      });
    this.revisionPrunes.set(reference.appId, pruning);
  }
}

async function readInstalledArtifactMetadata(
  targetDir: string,
): Promise<InstalledArtifactMetadata | null> {
  try {
    const value = JSON.parse(
      await readFile(path.join(targetDir, INSTALLED_ARTIFACT_FILE), 'utf8'),
    ) as Partial<InstalledArtifactMetadata>;
    return value.formatVersion === 1 && value.reference
      ? (value as InstalledArtifactMetadata)
      : null;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
    return null;
  }
}

async function writeInstalledArtifactMetadata(
  targetDir: string,
  reference: ArtifactReference,
  previous?: InstalledArtifactMetadata,
): Promise<void> {
  const now = new Date().toISOString();
  const metadata: InstalledArtifactMetadata = {
    formatVersion: 1,
    reference,
    installedAt: previous?.installedAt ?? now,
    lastUsedAt: now,
  };
  const metadataPath = path.join(targetDir, INSTALLED_ARTIFACT_FILE);
  const contents = `${JSON.stringify(metadata)}\n`;
  if (!previous) {
    await writeFile(metadataPath, contents, { mode: 0o600, flag: 'wx' });
    return;
  }
  const temporaryPath = path.join(
    targetDir,
    `.${INSTALLED_ARTIFACT_FILE}.${process.pid}.${randomUUID()}.tmp`,
  );
  try {
    await writeFile(temporaryPath, contents, { mode: 0o600, flag: 'wx' });
    await rename(temporaryPath, metadataPath);
  } finally {
    await rm(temporaryPath, { force: true });
  }
}

async function pruneExpandedRevisions(
  revisionRoot: string,
  protectedDirectory: string,
  limit: number,
): Promise<string[]> {
  const entries = await readdir(revisionRoot, { withFileTypes: true });
  const revisions = await Promise.all(
    entries
      .filter(
        (entry) => entry.isDirectory() && /^[a-f0-9]{64}$/.test(entry.name),
      )
      .map(async (entry) => {
        const directory = path.join(revisionRoot, entry.name);
        const metadata = await readInstalledArtifactMetadata(directory);
        const lastUsedAt = Date.parse(
          metadata?.lastUsedAt ?? metadata?.installedAt ?? '',
        );
        return {
          directory,
          lastUsedAt: Number.isNaN(lastUsedAt) ? 0 : lastUsedAt,
        };
      }),
  );
  const retained = new Set(
    revisions
      .sort((left, right) => {
        if (left.directory === protectedDirectory) return -1;
        if (right.directory === protectedDirectory) return 1;
        return right.lastUsedAt - left.lastUsedAt;
      })
      .slice(0, limit)
      .map((revision) => revision.directory),
  );
  const removedDirectories = revisions
    .map((revision) => revision.directory)
    .filter((directory) => !retained.has(directory));
  await Promise.all(
    removedDirectories.map((directory) =>
      rm(directory, { recursive: true, force: true }),
    ),
  );
  return removedDirectories;
}

function artifactReferencesEqual(
  left: ArtifactReference,
  right: ArtifactReference,
): boolean {
  return (
    typeof left.key === 'string' &&
    typeof left.appId === 'string' &&
    typeof left.version === 'string' &&
    typeof left.checksum === 'string' &&
    left.key === right.key &&
    left.appId === right.appId &&
    left.version === right.version &&
    left.checksum.toLowerCase() === right.checksum.toLowerCase()
  );
}

function artifactChecksumsEqual(
  left: ArtifactReference,
  right: ArtifactReference,
): boolean {
  return (
    typeof left.appId === 'string' &&
    typeof left.checksum === 'string' &&
    left.appId === right.appId &&
    left.checksum.toLowerCase() === right.checksum.toLowerCase()
  );
}

async function downloadArtifact(
  disk: NocoBaseDriveDisk,
  key: string,
  destination: string,
): Promise<string> {
  const hash = createHash('sha256');
  const source = await disk.getStream(key);
  source.on('data', (chunk: Buffer | string) => hash.update(chunk));
  await pipeline(
    source,
    createWriteStream(destination, { flags: 'wx', mode: 0o600 }),
  );
  return hash.digest('hex');
}

async function hashLocalArtifact(source: string): Promise<string> {
  const hash = createHash('sha256');
  const sourceStream = createReadStream(source);
  sourceStream.on('data', (chunk: Buffer | string) => hash.update(chunk));
  await finished(sourceStream);
  return hash.digest('hex');
}

function validateArtifactReference(reference: ArtifactReference): void {
  if (!reference || typeof reference !== 'object') {
    throw new Error('Artifact reference must be an object');
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(reference.appId)) {
    throw new Error(`Invalid artifact app ID "${reference.appId}"`);
  }
  if (
    !reference.key ||
    path.isAbsolute(reference.key) ||
    reference.key.split(/[\\/]/).includes('..')
  ) {
    throw new Error('Artifact key must be a non-empty relative key');
  }
  if (!reference.version) {
    throw new Error('Artifact version must be a non-empty string');
  }
  if (!/^[a-fA-F0-9]{64}$/.test(reference.checksum)) {
    throw new Error('Artifact checksum must be a SHA-256 hex digest');
  }
}

function assertSafeArchiveEntry(entryPath: string): boolean {
  const normalized = path.posix.normalize(entryPath.replaceAll('\\', '/'));
  if (
    path.posix.isAbsolute(normalized) ||
    normalized === '..' ||
    normalized.startsWith('../')
  ) {
    throw new Error(`Artifact archive contains an unsafe path "${entryPath}"`);
  }
  if (normalized === INSTALLED_ARTIFACT_FILE) {
    throw new Error(
      `Artifact archive contains reserved path "${INSTALLED_ARTIFACT_FILE}"`,
    );
  }
  return true;
}

function assertArtifactIdentity(
  definition: AppDefinition,
  reference: ArtifactReference,
): void {
  const version = definition.release?.version ?? definition.desiredVersion;
  if (definition.id !== reference.appId) {
    throw new Error(
      `Artifact app ID mismatch: expected "${reference.appId}", received "${definition.id}"`,
    );
  }
  if (version !== reference.version) {
    throw new Error(
      `Artifact version mismatch for app "${reference.appId}": expected "${reference.version}", received "${version}"`,
    );
  }
}
