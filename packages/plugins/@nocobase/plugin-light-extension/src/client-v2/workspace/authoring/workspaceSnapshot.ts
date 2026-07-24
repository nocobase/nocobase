/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { CodeAuthoringFile, CodeAuthoringFileKind, CodeAuthoringFileMeta } from '@nocobase/client-v2';

export interface WorkspaceAuthoringFile {
  path: string;
  content: string;
  language?: string;
  readOnly?: boolean;
  writable?: boolean;
  persisted?: boolean;
  description?: string;
  mode?: string;
}

export interface WorkspaceAuthoringSnapshotFile extends CodeAuthoringFile {
  source: WorkspaceAuthoringFile;
}

export interface WorkspaceAuthoringTreeSnapshot {
  snapshotId: string;
  sourceFiles: WorkspaceAuthoringSnapshotFile[];
  virtualFiles: WorkspaceAuthoringSnapshotFile[];
  files: WorkspaceAuthoringSnapshotFile[];
}

export interface BuildWorkspaceAuthoringSnapshotOptions {
  sourceFiles: WorkspaceAuthoringFile[];
  virtualFiles: WorkspaceAuthoringFile[];
  getPathWritable?: (path: string, file: WorkspaceAuthoringFile) => boolean;
}

export function buildWorkspaceAuthoringTreeSnapshot(
  options: BuildWorkspaceAuthoringSnapshotOptions,
): WorkspaceAuthoringTreeSnapshot {
  const sourceFiles = normalizeFiles(options.sourceFiles, 'source', options.getPathWritable);
  const virtualFiles = normalizeFiles(options.virtualFiles, 'virtual', options.getPathWritable);
  const allPaths = new Set<string>();

  for (const file of [...sourceFiles, ...virtualFiles]) {
    if (allPaths.has(file.path)) {
      throw new Error(`Workspace authoring files contain duplicate path: ${file.path}`);
    }
    allPaths.add(file.path);
  }

  const files = [...sourceFiles, ...virtualFiles].sort(compareSnapshotFiles);
  const snapshotId = hashWorkspaceAuthoringValue(files.map(({ source: _source, ...file }) => file));

  return {
    snapshotId,
    sourceFiles,
    virtualFiles,
    files,
  };
}

export function toCodeAuthoringFileMeta(file: WorkspaceAuthoringSnapshotFile): CodeAuthoringFileMeta {
  return {
    path: file.path,
    language: file.language,
    hash: file.hash,
    kind: file.kind,
    writable: file.writable,
    persisted: file.persisted,
    size: file.size,
    ...(file.description ? { description: file.description } : {}),
  };
}

export function cloneWorkspaceAuthoringFiles(files: WorkspaceAuthoringFile[]): WorkspaceAuthoringFile[] {
  return files.map((file) => ({ ...file }));
}

export function normalizeWorkspaceAuthoringPath(path: string): string {
  if (typeof path !== 'string' || path.includes('\0')) {
    throw new Error('Workspace authoring path must be a non-empty text path');
  }

  const trimmed = path.trim();
  if (!trimmed || /^(?:[a-zA-Z]:[\\/]|[\\/]{1,2})/.test(trimmed)) {
    throw new Error(`Workspace authoring path must be relative: ${path}`);
  }

  const segments = trimmed.replace(/\\/g, '/').split('/');
  const normalizedSegments: string[] = [];
  for (const segment of segments) {
    if (!segment || segment === '.') {
      continue;
    }
    if (segment === '..') {
      throw new Error(`Workspace authoring path cannot contain '..': ${path}`);
    }
    normalizedSegments.push(segment);
  }

  if (!normalizedSegments.length) {
    throw new Error('Workspace authoring path must not be empty');
  }

  return normalizedSegments.join('/');
}

export function inferWorkspaceAuthoringLanguage(path: string): string {
  const extension = path.split('.').pop()?.toLowerCase();
  const languageByExtension: Record<string, string> = {
    css: 'css',
    html: 'html',
    js: 'javascript',
    jsx: 'javascriptreact',
    json: 'json',
    md: 'markdown',
    mjs: 'javascript',
    cjs: 'javascript',
    ts: 'typescript',
    tsx: 'typescriptreact',
    txt: 'plaintext',
    yaml: 'yaml',
    yml: 'yaml',
  };
  return (extension && languageByExtension[extension]) || 'plaintext';
}

export function hashWorkspaceAuthoringValue(value: unknown): string {
  const input = JSON.stringify(toStableHashValue(value)) ?? 'undefined';
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `wa-${(hash >>> 0).toString(36)}`;
}

function toStableHashValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(toStableHashValue);
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, entry]) => entry !== undefined && typeof entry !== 'function')
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, toStableHashValue(entry)]),
    );
  }
  return typeof value === 'bigint' || (typeof value === 'number' && !Number.isFinite(value)) ? String(value) : value;
}

function normalizeFiles(
  files: WorkspaceAuthoringFile[],
  kind: CodeAuthoringFileKind,
  getPathWritable?: (path: string, file: WorkspaceAuthoringFile) => boolean,
): WorkspaceAuthoringSnapshotFile[] {
  return cloneWorkspaceAuthoringFiles(files)
    .map((file) => {
      const path = normalizeWorkspaceAuthoringPath(file.path);
      const language = file.language?.trim() || inferWorkspaceAuthoringLanguage(path);
      const writableByFile = file.writable !== false && file.readOnly !== true;
      const writable = kind === 'source' && writableByFile && (getPathWritable?.(path, file) ?? true);
      const persisted = kind === 'source' ? file.persisted !== false : file.persisted === true;
      const normalizedSource: WorkspaceAuthoringFile = {
        ...file,
        path,
        content: file.content || '',
        language,
      };
      const fileForHash = {
        kind,
        path,
        content: normalizedSource.content,
        language,
        writable,
        persisted,
        description: normalizedSource.description,
        mode: normalizedSource.mode,
      };

      return {
        path,
        content: normalizedSource.content,
        language,
        hash: hashWorkspaceAuthoringValue(fileForHash),
        kind,
        writable,
        persisted,
        size: new TextEncoder().encode(normalizedSource.content).byteLength,
        ...(file.description ? { description: file.description } : {}),
        source: normalizedSource,
      };
    })
    .sort(compareSnapshotFiles);
}

function compareSnapshotFiles(left: WorkspaceAuthoringSnapshotFile, right: WorkspaceAuthoringSnapshotFile): number {
  const pathOrder = left.path.localeCompare(right.path);
  if (pathOrder !== 0) {
    return pathOrder;
  }
  return left.kind.localeCompare(right.kind);
}
