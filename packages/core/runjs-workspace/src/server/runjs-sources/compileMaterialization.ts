/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { CompileRunJSSourceWorkspaceResult } from '@nocobase/runjs/compiler';
import type { Database } from '@nocobase/database';

import { maxFileSize, maxFilesPerRepo, maxRepoTextSize } from '../../shared/constants';
import { VscError, type RunJSCompileFailedDetails } from '../../shared/errors';
import { normalizePath, pathLowerHash } from '../../shared/path';
import { runJSManifestPath } from '../../shared/runjs-workspace-path';
import {
  buildRunJSSourceRepositoryIdentity,
  type RunJSLegacySource,
  type RunJSSourceAuthoringInspector,
  type RunJSSourceAuthoringLegacyInfo,
  type RunJSSourceCompilePreviewInput,
  type RunJSSourceFileChange,
} from '../../shared/runjs-source-types';
import { normalizeText } from '../../shared/text';
import type { VscFileChange, VscRepositoryIdentity, VscRepositoryRecord } from '../../shared/types';
import { VscFileService, type VscServiceContext } from '../services/VscFileService';
import type { RunJSSourceAuthoringInspectorRegistry } from './RunJSSourceAuthoringInspectorRegistry';
import { canonicalizeRunJSCompileFile } from './canonicalCompileFiles';

interface RunJSCompileMaterializationInput {
  files: VscFileChange[];
}

export interface SaveCompileFile {
  path: string;
  content: string;
  blobHash?: string;
  size?: number;
  language?: string;
  mode?: string;
}

interface RunJSContentFile {
  path: string;
  content: string;
}

export function createRunJSSourceAuthoringInspector(
  registry?: RunJSSourceAuthoringInspectorRegistry,
): RunJSSourceAuthoringInspector | undefined {
  if (!registry) {
    return undefined;
  }

  return (input) => registry.inspect(input);
}

export function legacyAuthoringInfo(legacy: RunJSLegacySource): RunJSSourceAuthoringLegacyInfo {
  return {
    version: legacy.version,
    surfaceStyle: legacy.surfaceStyle,
    language: legacy.language,
    metadata: legacy.metadata,
  };
}

export async function materializeCompilePreviewFiles(
  db: Database,
  service: VscFileService,
  input: RunJSSourceCompilePreviewInput,
  serviceCtx: VscServiceContext,
): Promise<VscFileChange[]> {
  if (!input.repoId) {
    return input.files;
  }

  const repository = await service.getRepository({ repoId: input.repoId }, serviceCtx);
  assertRepositoryMatchesIdentity(repository, buildRunJSSourceRepositoryIdentity(input.locator), input.locator.kind);
  const baseCommitId = input.baseCommitId === undefined ? repository.headCommitId : input.baseCommitId;
  const overwriteFiles = await buildOverwriteRunJSFileChanges(db, repository.id, baseCommitId, input.files, serviceCtx);

  return materializeRunJSCompileFiles(
    db,
    repository.id,
    baseCommitId,
    {
      files: overwriteFiles,
    },
    serviceCtx,
  );
}

async function buildOverwriteRunJSFileChanges(
  db: Database,
  repoId: string,
  baseCommitId: string | null,
  files: VscFileChange[],
  serviceCtx: VscServiceContext,
): Promise<VscFileChange[]> {
  const baseFiles = baseCommitId
    ? await loadCommitFilesForCompile(db, repoId, baseCommitId, serviceCtx.transaction)
    : [];
  const basePaths = new Set(baseFiles.map((file) => file.path));
  const allowedBlobHashes = new Set(baseFiles.map((file) => file.blobHash).filter(isStringValue));
  const desiredFiles = new Map<string, SaveCompileFile>();

  for (const file of files) {
    const normalizedPath = normalizePath(file.path);
    const operation = file.operation || 'upsert';

    if (operation === 'delete') {
      desiredFiles.delete(normalizedPath);
      continue;
    }
    if (operation !== 'upsert') {
      throw new VscError('PATH_INVALID', `Unsupported file operation "${operation}"`);
    }

    desiredFiles.set(normalizedPath, {
      path: normalizedPath,
      content: await resolveSaveCompileFileContent(db, file, allowedBlobHashes, serviceCtx.transaction),
      language: file.language,
      mode: file.mode,
    });
  }

  const changes = Array.from(desiredFiles.values()).map(canonicalCompileFileChange);
  for (const path of basePaths) {
    if (!desiredFiles.has(path)) {
      changes.push({
        path,
        operation: 'delete',
      });
    }
  }

  return changes.sort((left, right) => left.path.localeCompare(right.path));
}

export function buildOverwriteRunJSFileDelta(
  baseFiles: SaveCompileFile[],
  files: VscFileChange[],
): RunJSSourceFileChange[] {
  const baseFilesByPath = new Map(baseFiles.map((file) => [normalizePath(file.path), file]));
  const baseFilesByBlobHash = new Map(
    baseFiles.filter((file) => file.blobHash).map((file) => [file.blobHash as string, file]),
  );
  const desiredFiles = new Map<string, SaveCompileFile>();

  for (const file of files) {
    const path = normalizePath(file.path);
    const operation = file.operation || 'upsert';
    if (path === runJSManifestPath) {
      continue;
    }
    if (operation === 'delete') {
      desiredFiles.delete(path);
      continue;
    }
    if (operation !== 'upsert') {
      throw new VscError('PATH_INVALID', `Unsupported file operation "${operation}"`);
    }

    const blobFile = file.blobHash ? baseFilesByBlobHash.get(file.blobHash) : undefined;
    const content = typeof file.content === 'string' ? normalizeText(file.content) : blobFile?.content;
    if (content === undefined) {
      if (!file.blobHash) {
        throw new VscError('BLOB_NOT_FOUND', `Tree entry "${file.path}" must include content or an existing blob hash`);
      }
      throw new VscError('PERMISSION_DENIED', 'Blob hash is not available in the current repository context');
    }
    desiredFiles.set(path, {
      path,
      content,
      language: file.language,
      mode: file.mode,
    });
  }

  const changes: RunJSSourceFileChange[] = Array.from(desiredFiles.values())
    .filter((file) => {
      const baseFile = baseFilesByPath.get(file.path);
      return (
        !baseFile ||
        file.content !== normalizeText(baseFile.content) ||
        (file.language !== undefined && file.language !== baseFile.language) ||
        (file.mode !== undefined && file.mode !== baseFile.mode)
      );
    })
    .map((file) => ({
      ...canonicalCompileFileChange(file),
      operation: 'upsert',
      expectedBlobHash: baseFilesByPath.get(file.path)?.blobHash || null,
    }));
  for (const baseFile of baseFiles) {
    const path = normalizePath(baseFile.path);
    if (path !== runJSManifestPath && !desiredFiles.has(path)) {
      changes.push({
        path,
        operation: 'delete',
        expectedBlobHash: baseFile.blobHash || null,
      });
    }
  }

  return changes.sort((left, right) => left.path.localeCompare(right.path));
}

export async function materializeRunJSCompileFiles(
  db: Database,
  repoId: string,
  baseCommitId: string | null,
  input: RunJSCompileMaterializationInput,
  serviceCtx: VscServiceContext,
): Promise<VscFileChange[]> {
  const baseFiles = baseCommitId
    ? await loadCommitFilesForCompile(db, repoId, baseCommitId, serviceCtx.transaction)
    : [];
  const filesByPath = new Map(baseFiles.map((file) => [file.path, file]));
  const allowedBlobHashes = new Set(baseFiles.map((file) => file.blobHash).filter(isStringValue));

  for (const change of input.files) {
    const normalizedPath = normalizePath(change.path);
    const operation = change.operation || 'upsert';

    if (operation === 'delete') {
      filesByPath.delete(normalizedPath);
      continue;
    }
    if (operation !== 'upsert') {
      throw new VscError('PATH_INVALID', `Unsupported file operation "${operation}"`);
    }

    const currentFile = filesByPath.get(normalizedPath);
    const content = await resolveSaveCompileFileContent(db, change, allowedBlobHashes, serviceCtx.transaction);
    filesByPath.set(normalizedPath, {
      path: normalizedPath,
      content,
      language: change.language || currentFile?.language,
      mode: change.mode || currentFile?.mode,
    });
  }

  return Array.from(filesByPath.values())
    .sort((left, right) => left.path.localeCompare(right.path))
    .map(canonicalCompileFileChange);
}

export function assertIncrementalRunJSFileChanges(
  baseFiles: SaveCompileFile[],
  changes: RunJSSourceFileChange[],
): void {
  const baseFilesByPath = new Map(baseFiles.map((file) => [file.path, file]));
  const seenPaths = new Set<string>();

  for (const change of changes) {
    const path = normalizePath(change.path);
    if (path === runJSManifestPath) {
      throw new VscError('PERMISSION_DENIED', `RunJS managed file "${path}" cannot be changed directly`, {
        details: {
          path,
          managed: true,
        },
      });
    }
    if (seenPaths.has(path)) {
      throw new VscError('PATH_INVALID', `RunJS changes contain duplicate path "${path}"`, {
        details: { path },
      });
    }
    seenPaths.add(path);

    const currentFile = baseFilesByPath.get(path);
    const currentBlobHash = currentFile?.blobHash || null;
    if ((change.operation === 'delete' && !currentFile) || change.expectedBlobHash !== currentBlobHash) {
      throw new VscError('RUNJS_FILE_CONFLICT', `RunJS file "${path}" changed after it was opened`, {
        details: {
          path,
          expectedBlobHash: change.expectedBlobHash,
          currentBlobHash,
        },
      });
    }
  }
}

function canonicalCompileFileChange(file: SaveCompileFile): VscFileChange {
  return canonicalizeRunJSCompileFile(file);
}

export async function loadCommitFilesForCompile(
  db: Database,
  repoId: string,
  commitId: string,
  transaction: VscServiceContext['transaction'],
): Promise<SaveCompileFile[]> {
  const commit = await db.getRepository('vscFileCommits').findOne({
    filter: {
      id: commitId,
      repoId,
    },
    fields: ['treeHash'],
    transaction,
  });
  if (!commit) {
    throw new VscError('COMMIT_NOT_FOUND', `Commit "${commitId}" was not found`);
  }

  const entries = await db.getRepository('vscFileTreeEntries').find({
    filter: {
      treeHash: commit.get('treeHash') as string,
    },
    fields: ['path', 'blobHash', 'size', 'language', 'mode'],
    sort: ['path'],
    transaction,
  });
  const files: SaveCompileFile[] = [];
  for (const entry of entries) {
    const blob = await loadBlobForCompile(db, entry.get('blobHash') as string, transaction);
    files.push({
      path: entry.get('path') as string,
      content: blob.content,
      blobHash: blob.hash,
      size: entry.get('size') as number,
      language: entry.get('language') as string,
      mode: entry.get('mode') as string,
    });
  }

  return files;
}

async function resolveSaveCompileFileContent(
  db: Database,
  change: VscFileChange,
  allowedBlobHashes: Set<string>,
  transaction: VscServiceContext['transaction'],
): Promise<string> {
  if (typeof change.content === 'string') {
    return normalizeText(change.content);
  }
  if (!change.blobHash) {
    throw new VscError('BLOB_NOT_FOUND', `Tree entry "${change.path}" must include content or an existing blob hash`);
  }
  if (!allowedBlobHashes.has(change.blobHash)) {
    throw new VscError('PERMISSION_DENIED', 'Blob hash is not available in the current repository context');
  }

  const blob = await loadBlobForCompile(db, change.blobHash, transaction);

  return blob.content;
}

async function loadBlobForCompile(
  db: Database,
  blobHash: string,
  transaction: VscServiceContext['transaction'],
): Promise<{ hash: string; size: number; content: string }> {
  const blob = await db.getRepository('vscFileBlobs').findOne({
    filterByTk: blobHash,
    fields: ['hash', 'size', 'content'],
    transaction,
  });
  if (!blob) {
    throw new VscError('BLOB_NOT_FOUND', `Blob "${blobHash}" was not found`);
  }

  return {
    hash: blob.get('hash') as string,
    size: blob.get('size') as number,
    content: blob.get('content') as string,
  };
}

export function assertRunJSCompileInputLimits(files: VscFileChange[]): void {
  const contentFiles = contentFilesFromChanges(files);
  if (contentFiles.size > maxFilesPerRepo) {
    throw new VscError('REPO_LIMIT_EXCEEDED', `Tree must not exceed ${maxFilesPerRepo} files`, {
      details: { fileCount: contentFiles.size, maxFilesPerRepo },
    });
  }

  const byLowerPathHash = new Map<string, string>();
  let byteSize = 0;

  for (const file of contentFiles.values()) {
    const lowerHash = pathLowerHash(file.path);
    const conflictingPath = byLowerPathHash.get(lowerHash);
    if (conflictingPath && conflictingPath !== file.path) {
      throw new VscError('PATH_INVALID', `Case-only path conflict between "${conflictingPath}" and "${file.path}"`);
    }
    byLowerPathHash.set(lowerHash, file.path);

    const size = Buffer.byteLength(normalizeText(file.content), 'utf8');
    if (size > maxFileSize) {
      throw new VscError('FILE_TOO_LARGE', `File size must not exceed ${maxFileSize} bytes`, {
        details: { size, maxFileSize },
      });
    }
    byteSize += size;
  }

  if (byteSize > maxRepoTextSize) {
    throw new VscError('REPO_LIMIT_EXCEEDED', `Tree content must not exceed ${maxRepoTextSize} bytes`, {
      details: { byteSize, maxRepoTextSize },
    });
  }
}

export function assertRunJSCompileSucceeded(result: CompileRunJSSourceWorkspaceResult): void {
  const errorDiagnostics = result.artifact.diagnostics.filter((diagnostic) => diagnostic.severity === 'error');
  if (!errorDiagnostics.length) {
    return;
  }

  throw new VscError('RUNJS_COMPILE_FAILED', 'RunJS source could not be compiled', {
    details: {
      diagnostics: errorDiagnostics,
    } satisfies RunJSCompileFailedDetails,
  });
}

function contentFilesFromChanges(files: VscFileChange[]): Map<string, RunJSContentFile> {
  const contentFiles = new Map<string, RunJSContentFile>();

  for (const file of files) {
    const normalizedPath = normalizePath(file.path);
    if (file.operation === 'delete') {
      contentFiles.delete(normalizedPath);
      continue;
    }
    if (typeof file.content !== 'string') {
      continue;
    }

    contentFiles.set(normalizedPath, {
      path: normalizedPath,
      content: file.content,
    });
  }

  return contentFiles;
}

function isStringValue(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

export function assertRepositoryMatchesIdentity(
  repository: VscRepositoryRecord,
  identity: VscRepositoryIdentity,
  sourceKind: string,
): void {
  if (
    repository.ownerType === identity.ownerType &&
    repository.ownerId === identity.ownerId &&
    repository.name === identity.name
  ) {
    return;
  }

  throw new VscError('PERMISSION_DENIED', 'RunJS source repository does not match the requested locator', {
    details: {
      repoId: repository.id,
      sourceKind,
    },
  });
}
