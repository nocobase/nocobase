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

export function buildWorkspaceAuthoringTreeSnapshot(options: {
  sourceFiles: WorkspaceAuthoringFile[];
  virtualFiles: WorkspaceAuthoringFile[];
  getPathWritable?: (path: string, file: WorkspaceAuthoringFile) => boolean;
}): WorkspaceAuthoringTreeSnapshot {
  const sourceFiles = normalizeFiles(options.sourceFiles, 'source', options.getPathWritable);
  const virtualFiles = normalizeFiles(options.virtualFiles, 'virtual', options.getPathWritable);
  const files = [...sourceFiles, ...virtualFiles].sort(compareFiles);
  const paths = new Set<string>();
  for (const file of files) {
    if (paths.has(file.path)) {
      throw new Error(`Workspace authoring files contain duplicate path: ${file.path}`);
    }
    paths.add(file.path);
  }
  return {
    snapshotId: hashWorkspaceAuthoringValue(files.map(({ source: _source, ...file }) => file)),
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
  if (segments.some((segment) => segment === '..')) {
    throw new Error(`Workspace authoring path cannot contain '..': ${path}`);
  }
  const normalized = segments.filter((segment) => segment && segment !== '.').join('/');
  if (!normalized) {
    throw new Error('Workspace authoring path must not be empty');
  }
  return normalized;
}

export function inferWorkspaceAuthoringLanguage(path: string): string {
  const extension = path.split('.').pop()?.toLowerCase();
  return (
    (extension &&
      {
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
      }[extension]) ||
    'plaintext'
  );
}

export function hashWorkspaceAuthoringValue(value: unknown): string {
  const input = JSON.stringify(toStableValue(value)) ?? 'undefined';
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `wa-${(hash >>> 0).toString(36)}`;
}

function normalizeFiles(
  files: WorkspaceAuthoringFile[],
  kind: CodeAuthoringFileKind,
  getPathWritable?: (path: string, file: WorkspaceAuthoringFile) => boolean,
): WorkspaceAuthoringSnapshotFile[] {
  return files.map((source) => {
    const path = normalizeWorkspaceAuthoringPath(source.path);
    const language = source.language?.trim() || inferWorkspaceAuthoringLanguage(path);
    const normalizedSource = { ...source, path, language, content: source.content || '' };
    const writable =
      kind === 'source' &&
      source.readOnly !== true &&
      source.writable !== false &&
      (getPathWritable?.(path, normalizedSource) ?? true);
    return {
      path,
      content: normalizedSource.content,
      language,
      hash: hashWorkspaceAuthoringValue({ path, content: normalizedSource.content, language, kind, writable }),
      kind,
      writable,
      ...(source.description ? { description: source.description } : {}),
      source: normalizedSource,
    };
  });
}

function compareFiles(left: WorkspaceAuthoringSnapshotFile, right: WorkspaceAuthoringSnapshotFile): number {
  return left.path.localeCompare(right.path) || left.kind.localeCompare(right.kind);
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
  return typeof value === 'bigint' || (typeof value === 'number' && !Number.isFinite(value)) ? String(value) : value;
}
