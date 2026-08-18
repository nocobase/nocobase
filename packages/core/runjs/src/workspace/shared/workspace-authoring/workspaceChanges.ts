/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type {
  RunJSAuthoringChange as CodeAuthoringChange,
  RunJSAuthoringFileDiff as CodeAuthoringFileDiff,
} from '../authoring-surface-contracts';

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
  | 'PLAN_NOT_FOUND'
  | 'PLAN_APPLYING'
  | 'SURFACE_DISPOSED';

export class WorkspaceAuthoringError extends Error {
  constructor(
    readonly code: WorkspaceAuthoringErrorCode,
    message: string,
    readonly details: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = 'WorkspaceAuthoringError';
  }
}

export interface WorkspaceAuthoringPathAccess {
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  reason?: string;
}

export type WorkspaceAuthoringPathAccessResolver = (
  path: string,
  changeType: CodeAuthoringChange['type'],
) => WorkspaceAuthoringPathAccess;

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

export function prepareWorkspaceAuthoringChanges(options: {
  surfaceId: string;
  baseSnapshotId: string;
  changes: CodeAuthoringChange[];
  snapshot: WorkspaceAuthoringTreeSnapshot;
  getPathAccess: WorkspaceAuthoringPathAccessResolver;
  supportedLanguages?: readonly string[];
}): PreparedWorkspaceAuthoringChanges {
  const { surfaceId, snapshot, getPathAccess } = options;
  if (snapshot.snapshotId !== options.baseSnapshotId) {
    throw new WorkspaceAuthoringError('STALE_SNAPSHOT', 'The workspace changed; prepare a new plan', {
      surfaceId,
      expectedSnapshotId: options.baseSnapshotId,
      actualSnapshotId: snapshot.snapshotId,
    });
  }

  const changes = normalizeChanges(options.changes, surfaceId);
  const duplicatePath = findDuplicatePath(changes);
  if (duplicatePath) {
    throw new WorkspaceAuthoringError('DUPLICATE_TARGET', `A plan cannot target a path twice: ${duplicatePath}`, {
      surfaceId,
      path: duplicatePath,
    });
  }

  const supportedLanguages = new Set(options.supportedLanguages || DEFAULT_SUPPORTED_LANGUAGES);
  const sourceFiles = cloneWorkspaceAuthoringFiles(snapshot.sourceFiles.map((file) => file.source));
  const sourceByPath = new Map(sourceFiles.map((file) => [file.path, file]));
  const snapshotByPath = new Map(snapshot.sourceFiles.map((file) => [file.path, file]));
  const virtualPaths = new Set(snapshot.virtualFiles.map((file) => file.path));
  const diffs: CodeAuthoringFileDiff[] = [];

  for (const change of changes) {
    assertPathAccess(surfaceId, change, getPathAccess(change.path, change.type));
    if (virtualPaths.has(change.path)) {
      throw new WorkspaceAuthoringError('VIRTUAL_FILE', `Virtual file cannot be changed: ${change.path}`, {
        surfaceId,
        path: change.path,
      });
    }

    const current = sourceByPath.get(change.path);
    const currentSnapshot = snapshotByPath.get(change.path);
    if (change.type === 'create') {
      if (current) {
        throw new WorkspaceAuthoringError('FILE_EXISTS', `File already exists: ${change.path}`, {
          surfaceId,
          path: change.path,
        });
      }
      assertTextContent(surfaceId, change.path, change.content);
      const language = change.language?.trim() || inferWorkspaceAuthoringLanguage(change.path);
      assertSupportedLanguage(surfaceId, change.path, language, supportedLanguages);
      sourceByPath.set(change.path, { path: change.path, content: change.content, language });
      diffs.push({ path: change.path, status: 'created', after: change.content });
      continue;
    }

    if (!current || !currentSnapshot) {
      throw new WorkspaceAuthoringError('FILE_NOT_FOUND', `File does not exist: ${change.path}`, {
        surfaceId,
        path: change.path,
      });
    }
    if (!currentSnapshot.writable) {
      throw new WorkspaceAuthoringError('READ_ONLY_FILE', `File is read-only: ${change.path}`, {
        surfaceId,
        path: change.path,
      });
    }
    if (change.baseHash !== currentSnapshot.hash) {
      throw new WorkspaceAuthoringError('BASE_HASH_MISMATCH', `File changed since it was read: ${change.path}`, {
        surfaceId,
        path: change.path,
        expectedHash: change.baseHash,
        actualHash: currentSnapshot.hash,
      });
    }

    if (change.type === 'delete') {
      sourceByPath.delete(change.path);
      diffs.push({ path: change.path, status: 'deleted', before: current.content });
      continue;
    }

    assertSupportedLanguage(surfaceId, change.path, currentSnapshot.language, supportedLanguages);
    assertTextContent(surfaceId, change.path, change.content);
    sourceByPath.set(change.path, { ...current, content: change.content });
    diffs.push({ path: change.path, status: 'modified', before: current.content, after: change.content });
  }

  const nextSourceFiles = Array.from(sourceByPath.values()).sort((left, right) => left.path.localeCompare(right.path));
  buildWorkspaceAuthoringTreeSnapshot({ sourceFiles: nextSourceFiles, virtualFiles: [] });
  return {
    changes,
    diffs,
    nextSourceFiles,
    changedPaths: diffs.map((diff) => diff.path),
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
  if (!Array.isArray(changes) || !changes.length) {
    throw new WorkspaceAuthoringError('INVALID_CHANGE', 'An authoring plan must contain at least one change', {
      surfaceId,
    });
  }
  return changes.map((change) => {
    try {
      return { ...change, path: normalizeWorkspaceAuthoringPath(change.path) };
    } catch (error) {
      throw new WorkspaceAuthoringError('INVALID_PATH', error instanceof Error ? error.message : 'Invalid path', {
        surfaceId,
        path: change.path,
      });
    }
  });
}

function findDuplicatePath(changes: CodeAuthoringChange[]): string | undefined {
  const paths = new Set<string>();
  return changes.find((change) => (paths.has(change.path) ? true : !paths.add(change.path)))?.path;
}

function assertPathAccess(surfaceId: string, change: CodeAuthoringChange, access: WorkspaceAuthoringPathAccess): void {
  const allowed =
    change.type === 'create' ? access.canCreate : change.type === 'delete' ? access.canDelete : access.canUpdate;
  if (!allowed) {
    throw new WorkspaceAuthoringError('PATH_ACCESS_DENIED', `Path is not writable: ${change.path}`, {
      surfaceId,
      path: change.path,
      reason: access.reason,
    });
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
