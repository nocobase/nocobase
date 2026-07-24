/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { CodeAuthoringChange, CodeAuthoringFileDiff } from '@nocobase/client-v2';

import {
  buildWorkspaceAuthoringTreeSnapshot,
  cloneWorkspaceAuthoringFiles,
  inferWorkspaceAuthoringLanguage,
  normalizeWorkspaceAuthoringPath,
  type WorkspaceAuthoringFile,
  type WorkspaceAuthoringTreeSnapshot,
} from './workspaceSnapshot';

export type WorkspaceAuthoringErrorCode =
  | 'INVALID_CHANGE'
  | 'INVALID_PATH'
  | 'STALE_SNAPSHOT'
  | 'DUPLICATE_TARGET'
  | 'FILE_EXISTS'
  | 'FILE_NOT_FOUND'
  | 'BASE_HASH_MISMATCH'
  | 'PATH_ACCESS_DENIED'
  | 'READ_ONLY_FILE'
  | 'VIRTUAL_FILE'
  | 'UNSUPPORTED_LANGUAGE'
  | 'BINARY_CONTENT'
  | 'PATCH_CONFLICT'
  | 'PLAN_NOT_FOUND'
  | 'PLAN_EXPIRED'
  | 'PLAN_CONSUMED'
  | 'PLAN_APPLYING'
  | 'CAPABILITY_UNAVAILABLE'
  | 'SURFACE_DISPOSED';

export interface WorkspaceAuthoringErrorDetails {
  surfaceId?: string;
  path?: string;
  planId?: string;
  expectedSnapshotId?: string;
  actualSnapshotId?: string;
  expectedHash?: string;
  actualHash?: string;
  reason?: string;
}

export class WorkspaceAuthoringError extends Error {
  readonly code: WorkspaceAuthoringErrorCode;
  readonly details: WorkspaceAuthoringErrorDetails;

  constructor(code: WorkspaceAuthoringErrorCode, message: string, details: WorkspaceAuthoringErrorDetails = {}) {
    super(message);
    this.name = 'WorkspaceAuthoringError';
    this.code = code;
    this.details = details;
  }
}

export interface WorkspaceAuthoringPathAccess {
  canCreate?: boolean;
  canUpdate?: boolean;
  canPatch?: boolean;
  canDelete?: boolean;
  canWrite?: boolean;
  reason?: string;
}

export type WorkspaceAuthoringPathAccessResolver = (
  path: string,
  changeType: CodeAuthoringChange['type'],
) => WorkspaceAuthoringPathAccess;

export interface PrepareWorkspaceAuthoringChangesOptions {
  surfaceId: string;
  baseSnapshotId: string;
  changes: CodeAuthoringChange[];
  snapshot: WorkspaceAuthoringTreeSnapshot;
  getPathAccess: WorkspaceAuthoringPathAccessResolver;
  supportedLanguages?: readonly string[];
}

export interface PreparedWorkspaceAuthoringChanges {
  changes: CodeAuthoringChange[];
  diffs: CodeAuthoringFileDiff[];
  nextSourceFiles: WorkspaceAuthoringFile[];
  changedPaths: string[];
}

const DEFAULT_SUPPORTED_LANGUAGES = [
  'css',
  'html',
  'javascript',
  'javascriptreact',
  'json',
  'markdown',
  'plaintext',
  'typescript',
  'typescriptreact',
  'yaml',
];

export function prepareWorkspaceAuthoringChanges(
  options: PrepareWorkspaceAuthoringChangesOptions,
): PreparedWorkspaceAuthoringChanges {
  const { surfaceId, baseSnapshotId, snapshot, getPathAccess } = options;
  if (snapshot.snapshotId !== baseSnapshotId) {
    throw new WorkspaceAuthoringError('STALE_SNAPSHOT', 'The workspace changed; read it again and prepare a new plan', {
      surfaceId,
      expectedSnapshotId: baseSnapshotId,
      actualSnapshotId: snapshot.snapshotId,
    });
  }

  const supportedLanguages = new Set(options.supportedLanguages || DEFAULT_SUPPORTED_LANGUAGES);
  const normalizedChanges = normalizeChanges(options.changes, surfaceId);
  const duplicatePaths = findDuplicatePaths(normalizedChanges);
  if (duplicatePaths.length) {
    throw new WorkspaceAuthoringError(
      'DUPLICATE_TARGET',
      `A plan cannot target the same path more than once: ${duplicatePaths[0]}`,
      {
        surfaceId,
        path: duplicatePaths[0],
      },
    );
  }

  const sourceFiles = cloneWorkspaceAuthoringFiles(snapshot.sourceFiles.map((file) => file.source));
  const sourceByPath = new Map(sourceFiles.map((file) => [file.path, file]));
  const sourceSnapshotByPath = new Map(snapshot.sourceFiles.map((file) => [file.path, file]));
  const virtualByPath = new Map(snapshot.virtualFiles.map((file) => [file.path, file]));
  const diffs: CodeAuthoringFileDiff[] = [];

  for (const change of normalizedChanges) {
    assertPathAccess(surfaceId, change, getPathAccess(change.path, change.type));
    const existing = sourceByPath.get(change.path);
    const existingSnapshot = sourceSnapshotByPath.get(change.path);
    const virtual = virtualByPath.get(change.path);

    if (virtual) {
      throw new WorkspaceAuthoringError('VIRTUAL_FILE', `Virtual file cannot be changed: ${change.path}`, {
        surfaceId,
        path: change.path,
      });
    }

    if (change.type === 'create') {
      if (existing) {
        throw new WorkspaceAuthoringError('FILE_EXISTS', `File already exists: ${change.path}`, {
          surfaceId,
          path: change.path,
        });
      }
      assertTextContent(surfaceId, change.path, change.content);
      const language = change.language?.trim() || inferWorkspaceAuthoringLanguage(change.path);
      assertSupportedLanguage(surfaceId, change.path, language, supportedLanguages);
      const nextFile: WorkspaceAuthoringFile = {
        path: change.path,
        content: change.content,
        language,
      };
      sourceByPath.set(change.path, nextFile);
      diffs.push({ path: change.path, status: 'created', after: change.content });
      continue;
    }

    if (!existing || !existingSnapshot) {
      throw new WorkspaceAuthoringError('FILE_NOT_FOUND', `File does not exist: ${change.path}`, {
        surfaceId,
        path: change.path,
      });
    }
    if (!existingSnapshot.writable || existing.readOnly === true || existing.writable === false) {
      throw new WorkspaceAuthoringError('READ_ONLY_FILE', `File is read-only: ${change.path}`, {
        surfaceId,
        path: change.path,
      });
    }
    if (change.baseHash !== existingSnapshot.hash) {
      throw new WorkspaceAuthoringError('BASE_HASH_MISMATCH', `File changed since it was read: ${change.path}`, {
        surfaceId,
        path: change.path,
        expectedHash: change.baseHash,
        actualHash: existingSnapshot.hash,
      });
    }

    if (change.type === 'delete') {
      sourceByPath.delete(change.path);
      diffs.push({ path: change.path, status: 'deleted', before: existing.content });
      continue;
    }

    assertSupportedLanguage(surfaceId, change.path, existingSnapshot.language, supportedLanguages);
    const nextContent =
      change.type === 'patch'
        ? applyStrictUnifiedPatch(existing.content, change.patch, surfaceId, change.path)
        : change.content;
    assertTextContent(surfaceId, change.path, nextContent);
    sourceByPath.set(change.path, { ...existing, content: nextContent });
    diffs.push({ path: change.path, status: 'modified', before: existing.content, after: nextContent });
  }

  const nextSourceFiles = Array.from(sourceByPath.values()).sort((left, right) => left.path.localeCompare(right.path));
  buildWorkspaceAuthoringTreeSnapshot({ sourceFiles: nextSourceFiles, virtualFiles: [] });

  return {
    changes: normalizedChanges,
    diffs: diffs.sort((left, right) => left.path.localeCompare(right.path)),
    nextSourceFiles,
    changedPaths: diffs.map((diff) => diff.path).sort((left, right) => left.localeCompare(right)),
  };
}

export function assertWorkspaceAuthoringPlanAccess(
  surfaceId: string,
  changes: CodeAuthoringChange[],
  getPathAccess: WorkspaceAuthoringPathAccessResolver,
): void {
  for (const change of changes) {
    assertPathAccess(surfaceId, change, getPathAccess(change.path, change.type));
  }
}

function normalizeChanges(changes: CodeAuthoringChange[], surfaceId: string): CodeAuthoringChange[] {
  if (!Array.isArray(changes) || changes.length === 0) {
    throw new WorkspaceAuthoringError('INVALID_CHANGE', 'An authoring plan must contain at least one change', {
      surfaceId,
    });
  }

  return changes.map((change) => {
    let path: string;
    try {
      path = normalizeWorkspaceAuthoringPath(change.path);
    } catch (error) {
      throw new WorkspaceAuthoringError('INVALID_PATH', error instanceof Error ? error.message : 'Invalid path', {
        surfaceId,
        path: change.path,
      });
    }
    return { ...change, path };
  });
}

function findDuplicatePaths(changes: CodeAuthoringChange[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const change of changes) {
    if (seen.has(change.path)) {
      duplicates.add(change.path);
    }
    seen.add(change.path);
  }
  return Array.from(duplicates).sort((left, right) => left.localeCompare(right));
}

function assertPathAccess(surfaceId: string, change: CodeAuthoringChange, access: WorkspaceAuthoringPathAccess): void {
  const allowed =
    change.type === 'create'
      ? access.canCreate
      : change.type === 'delete'
        ? access.canDelete
        : change.type === 'patch'
          ? access.canPatch ?? access.canWrite
          : access.canUpdate ?? access.canWrite;
  if (allowed !== true) {
    throw new WorkspaceAuthoringError(
      'PATH_ACCESS_DENIED',
      `Path is outside the writable workspace scope: ${change.path}`,
      {
        surfaceId,
        path: change.path,
        reason: access.reason,
      },
    );
  }
}

function assertSupportedLanguage(
  surfaceId: string,
  path: string,
  language: string,
  supportedLanguages: Set<string>,
): void {
  if (!supportedLanguages.has(language)) {
    throw new WorkspaceAuthoringError('UNSUPPORTED_LANGUAGE', `Unsupported language '${language}' for ${path}`, {
      surfaceId,
      path,
    });
  }
}

function assertTextContent(surfaceId: string, path: string, content: string): void {
  for (let index = 0; index < content.length; index += 1) {
    const code = content.charCodeAt(index);
    if (code === 0 || (code < 32 && code !== 9 && code !== 10 && code !== 13) || code === 127) {
      throw new WorkspaceAuthoringError('BINARY_CONTENT', `Binary content is not supported: ${path}`, {
        surfaceId,
        path,
      });
    }
  }
}

function applyStrictUnifiedPatch(source: string, patch: string, surfaceId: string, path: string): string {
  assertTextContent(surfaceId, path, patch);
  const sourceHasFinalNewline = source.endsWith('\n');
  const sourceLines = source.length === 0 ? [] : source.replace(/\r\n/g, '\n').split('\n');
  if (sourceHasFinalNewline) {
    sourceLines.pop();
  }
  const patchLines = patch.replace(/\r\n/g, '\n').split('\n');
  const output: string[] = [];
  let sourceIndex = 0;
  let patchIndex = 0;
  let hunkCount = 0;

  while (patchIndex < patchLines.length) {
    const header = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/.exec(patchLines[patchIndex]);
    if (!header) {
      patchIndex += 1;
      continue;
    }

    hunkCount += 1;
    const oldStart = Number(header[1]);
    const oldCount = header[2] === undefined ? 1 : Number(header[2]);
    const newCount = header[4] === undefined ? 1 : Number(header[4]);
    const expectedSourceIndex = oldStart === 0 ? 0 : oldStart - 1;
    if (expectedSourceIndex < sourceIndex || expectedSourceIndex > sourceLines.length) {
      throwPatchConflict(surfaceId, path);
    }
    output.push(...sourceLines.slice(sourceIndex, expectedSourceIndex));
    sourceIndex = expectedSourceIndex;
    patchIndex += 1;
    let consumedOld = 0;
    let producedNew = 0;

    while (patchIndex < patchLines.length && !patchLines[patchIndex].startsWith('@@ ')) {
      const line = patchLines[patchIndex];
      if (line.startsWith('--- ') || line.startsWith('+++ ')) {
        throwPatchConflict(surfaceId, path);
      }
      if (line === '\\ No newline at end of file' || line === '') {
        patchIndex += 1;
        continue;
      }
      const marker = line[0];
      const content = line.slice(1);
      if (marker === ' ') {
        if (sourceLines[sourceIndex] !== content) {
          throwPatchConflict(surfaceId, path);
        }
        output.push(content);
        sourceIndex += 1;
        consumedOld += 1;
        producedNew += 1;
      } else if (marker === '-') {
        if (sourceLines[sourceIndex] !== content) {
          throwPatchConflict(surfaceId, path);
        }
        sourceIndex += 1;
        consumedOld += 1;
      } else if (marker === '+') {
        output.push(content);
        producedNew += 1;
      } else {
        throwPatchConflict(surfaceId, path);
      }
      patchIndex += 1;
    }

    if (consumedOld !== oldCount || producedNew !== newCount) {
      throwPatchConflict(surfaceId, path);
    }
  }

  if (hunkCount === 0) {
    throwPatchConflict(surfaceId, path);
  }
  output.push(...sourceLines.slice(sourceIndex));
  const result = output.join('\n');
  return sourceHasFinalNewline && result ? `${result}\n` : result;
}

function throwPatchConflict(surfaceId: string, path: string): never {
  throw new WorkspaceAuthoringError('PATCH_CONFLICT', `Patch does not apply exactly to the current file: ${path}`, {
    surfaceId,
    path,
  });
}
