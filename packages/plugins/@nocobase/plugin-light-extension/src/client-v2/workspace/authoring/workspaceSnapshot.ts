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
  scope?: string;
  metadata?: Record<string, unknown>;
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
  const snapshotId = hashStableValue(
    files.map((file) => ({
      ...stableFileValue(file.source),
      kind: file.kind,
      path: file.path,
      language: file.language,
      writable: file.writable,
      persisted: file.persisted,
    })),
  );

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
  return files.map((file) => ({
    ...file,
    ...(file.metadata ? { metadata: cloneStableValue(file.metadata) as Record<string, unknown> } : {}),
  }));
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
  return hashStableValue(value);
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
      const metadataForHash = {
        ...stableFileValue(normalizedSource),
        kind,
        path,
        language,
        writable,
        persisted,
      };

      return {
        path,
        content: normalizedSource.content,
        language,
        hash: hashStableValue(metadataForHash),
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

function stableFileValue(file: WorkspaceAuthoringFile): Record<string, unknown> {
  const value: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(file)) {
    if (typeof entry !== 'function' && entry !== undefined) {
      value[key] = entry;
    }
  }
  return value;
}

function hashStableValue(value: unknown): string {
  const input = stableStringify(value);
  let first = 0x811c9dc5;
  let second = 0x9e3779b9;

  for (let index = 0; index < input.length; index += 1) {
    const code = input.charCodeAt(index);
    first ^= code;
    first = Math.imul(first, 0x01000193);
    second ^= code + index;
    second = Math.imul(second, 0x85ebca6b);
  }

  return `wa-${toHex(first)}${toHex(second)}`;
}

function toHex(value: number): string {
  return (value >>> 0).toString(16).padStart(8, '0');
}

function stableStringify(value: unknown): string {
  return JSON.stringify(toStableValue(value));
}

function toStableValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(toStableValue);
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, entry]) => entry !== undefined && typeof entry !== 'function')
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, toStableValue(entry)]),
    );
  }
  if (typeof value === 'bigint') {
    return value.toString();
  }
  if (typeof value === 'number' && !Number.isFinite(value)) {
    return String(value);
  }
  return value;
}

function cloneStableValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(cloneStableValue);
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => [key, cloneStableValue(entry)]),
    );
  }
  return value;
}
