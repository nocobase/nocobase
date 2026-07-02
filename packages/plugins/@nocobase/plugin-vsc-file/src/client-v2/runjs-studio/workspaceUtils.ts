/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { normalizePath } from '../../shared/path';
import {
  normalizeRunJSWorkspacePathValue,
  runJSManifestPath,
  validateRunJSWorkspacePathValue,
  type RunJSWorkspacePathValidationReason,
} from '../../shared/runjs-workspace-path';
import type { VscFileChange } from '../../shared/types';
import type { RunJSChangeSummary, RunJSLineDiffRow, RunJSPathValidationResult, RunJSWorkspaceFile } from './types';

export { runJSManifestPath };

export function compareRunJSPaths(left: string, right: string): number {
  return left.localeCompare(right);
}

export function normalizeWorkspaceFiles(files: RunJSWorkspaceFile[]): RunJSWorkspaceFile[] {
  const byPath = new Map<string, RunJSWorkspaceFile>();

  for (const file of files) {
    const path = normalizePath(file.path);
    byPath.set(path, {
      path,
      content: file.content || '',
      language: file.language || inferLanguageFromPath(path),
      mode: file.mode,
    });
  }

  return Array.from(byPath.values()).sort((left, right) => compareRunJSPaths(left.path, right.path));
}

export function buildWorkspaceChanges(
  baseFiles: RunJSWorkspaceFile[],
  nextFiles: RunJSWorkspaceFile[],
): VscFileChange[] {
  const baseByPath = new Map(normalizeWorkspaceFiles(baseFiles).map((file) => [file.path, file]));
  const nextByPath = new Map(normalizeWorkspaceFiles(nextFiles).map((file) => [file.path, file]));
  const changes: VscFileChange[] = [];

  for (const file of nextByPath.values()) {
    changes.push({
      path: file.path,
      operation: 'upsert',
      content: file.content,
      language: file.language || inferLanguageFromPath(file.path),
      mode: file.mode,
    });
  }

  for (const path of baseByPath.keys()) {
    if (!nextByPath.has(path)) {
      changes.push({
        path,
        operation: 'delete',
      });
    }
  }

  return changes.sort((left, right) => compareRunJSPaths(left.path, right.path));
}

export function buildChangedWorkspaceFileList(
  baseFiles: RunJSWorkspaceFile[],
  nextFiles: RunJSWorkspaceFile[],
): VscFileChange[] {
  const baseByPath = new Map(normalizeWorkspaceFiles(baseFiles).map((file) => [file.path, file]));
  const nextByPath = new Map(normalizeWorkspaceFiles(nextFiles).map((file) => [file.path, file]));
  const paths = Array.from(new Set([...baseByPath.keys(), ...nextByPath.keys()])).sort(compareRunJSPaths);
  const changes: VscFileChange[] = [];

  for (const path of paths) {
    const base = baseByPath.get(path);
    const next = nextByPath.get(path);
    if (base && next && base.content === next.content && base.language === next.language && base.mode === next.mode) {
      continue;
    }

    if (!next) {
      changes.push({
        path,
        operation: 'delete',
      });
      continue;
    }

    changes.push({
      path: next.path,
      operation: 'upsert',
      content: next.content,
      language: next.language || inferLanguageFromPath(next.path),
      mode: next.mode,
    });
  }

  return changes;
}

export function applyWorkspaceChanges(baseFiles: RunJSWorkspaceFile[], changes: VscFileChange[]): RunJSWorkspaceFile[] {
  const nextByPath = new Map(normalizeWorkspaceFiles(baseFiles).map((file) => [file.path, file]));

  for (const change of changes) {
    const path = normalizePath(change.path);
    if (change.operation === 'delete') {
      nextByPath.delete(path);
      continue;
    }

    const current = nextByPath.get(path);
    nextByPath.set(path, {
      path,
      content: change.content ?? current?.content ?? '',
      language: change.language || current?.language || inferLanguageFromPath(path),
      mode: change.mode || current?.mode,
    });
  }

  return Array.from(nextByPath.values()).sort((left, right) => compareRunJSPaths(left.path, right.path));
}

export function hasWorkspaceChanges(baseFiles: RunJSWorkspaceFile[], nextFiles: RunJSWorkspaceFile[]): boolean {
  const baseByPath = new Map(normalizeWorkspaceFiles(baseFiles).map((file) => [file.path, file]));
  const nextByPath = new Map(normalizeWorkspaceFiles(nextFiles).map((file) => [file.path, file]));
  const paths = new Set([...baseByPath.keys(), ...nextByPath.keys()]);

  for (const path of paths) {
    const base = baseByPath.get(path);
    const next = nextByPath.get(path);
    if (!base || !next) {
      return true;
    }
    if (base.content !== next.content || base.language !== next.language || base.mode !== next.mode) {
      return true;
    }
  }

  return false;
}

export function summarizeWorkspaceChanges(
  baseFiles: RunJSWorkspaceFile[],
  nextFiles: RunJSWorkspaceFile[],
): RunJSChangeSummary {
  const baseByPath = new Map(normalizeWorkspaceFiles(baseFiles).map((file) => [file.path, file]));
  const nextByPath = new Map(normalizeWorkspaceFiles(nextFiles).map((file) => [file.path, file]));
  const paths = Array.from(new Set([...baseByPath.keys(), ...nextByPath.keys()])).sort(compareRunJSPaths);
  let files = 0;
  let additions = 0;
  let deletions = 0;

  for (const path of paths) {
    const base = baseByPath.get(path);
    const next = nextByPath.get(path);
    if (base && next && base.content === next.content && base.language === next.language && base.mode === next.mode) {
      continue;
    }

    files += 1;
    const lineCounts = countChangedLines(base?.content || '', next?.content || '');
    additions += lineCounts.additions;
    deletions += lineCounts.deletions;
  }

  return {
    files,
    additions,
    deletions,
  };
}

export function buildLineDiff(
  baseFiles: RunJSWorkspaceFile[],
  nextFiles: RunJSWorkspaceFile[],
  path: string | undefined,
  ignoreWhitespace: boolean,
): RunJSLineDiffRow[] {
  if (!path) {
    return [];
  }

  const base = normalizeWorkspaceFiles(baseFiles).find((file) => file.path === path)?.content || '';
  const next = normalizeWorkspaceFiles(nextFiles).find((file) => file.path === path)?.content || '';
  const baseLines = splitLines(base);
  const nextLines = splitLines(next);
  const maxLength = Math.max(baseLines.length, nextLines.length);
  const rows: RunJSLineDiffRow[] = [];

  for (let index = 0; index < maxLength; index += 1) {
    const oldLine = baseLines[index];
    const newLine = nextLines[index];
    const comparableOld = ignoreWhitespace ? oldLine?.trim() : oldLine;
    const comparableNew = ignoreWhitespace ? newLine?.trim() : newLine;

    if (oldLine === undefined && newLine !== undefined) {
      rows.push({
        key: `insert:${index}`,
        type: 'insert',
        content: newLine,
        newLineNumber: index + 1,
      });
      continue;
    }

    if (oldLine !== undefined && newLine === undefined) {
      rows.push({
        key: `delete:${index}`,
        type: 'delete',
        content: oldLine,
        oldLineNumber: index + 1,
      });
      continue;
    }

    if (comparableOld !== comparableNew && oldLine !== undefined && newLine !== undefined) {
      rows.push({
        key: `delete:${index}`,
        type: 'delete',
        content: oldLine,
        oldLineNumber: index + 1,
      });
      rows.push({
        key: `insert:${index}`,
        type: 'insert',
        content: newLine,
        newLineNumber: index + 1,
      });
      continue;
    }

    if (oldLine !== undefined) {
      rows.push({
        key: `context:${index}`,
        type: 'context',
        content: oldLine,
        oldLineNumber: index + 1,
        newLineNumber: index + 1,
      });
    }
  }

  return rows;
}

export function inferLanguageFromPath(path: string): string {
  if (path.endsWith('.tsx')) {
    return 'tsx';
  }
  if (path.endsWith('.ts')) {
    return 'typescript';
  }
  if (path.endsWith('.jsx')) {
    return 'jsx';
  }
  if (path.endsWith('.js')) {
    return 'javascript';
  }
  if (path.endsWith('.json')) {
    return 'json';
  }
  if (path.endsWith('.css')) {
    return 'css';
  }
  if (path.endsWith('.md')) {
    return 'markdown';
  }

  return 'text';
}

export function validateRunJSWorkspacePath(path: string, t: (key: string) => string): RunJSPathValidationResult {
  const validation = validateRunJSWorkspacePathValue(path);
  if (!validation.valid) {
    return {
      valid: false,
      message: getPathValidationMessage(validation.reason, validation.message, t),
    };
  }

  return {
    valid: true,
  };
}

export function normalizeRunJSWorkspacePath(path: string): string {
  return normalizeRunJSWorkspacePathValue(path);
}

export function updateWorkspaceFile(
  files: RunJSWorkspaceFile[],
  path: string,
  updater: (file: RunJSWorkspaceFile) => RunJSWorkspaceFile,
): RunJSWorkspaceFile[] {
  return normalizeWorkspaceFiles(
    files.map((file) => {
      if (file.path !== path) {
        return file;
      }

      return updater(file);
    }),
  );
}

export function replaceWorkspaceFilePath(
  files: RunJSWorkspaceFile[],
  fromPath: string,
  toPath: string,
): RunJSWorkspaceFile[] {
  return normalizeWorkspaceFiles(
    files.map((file) => {
      if (file.path !== fromPath) {
        return file;
      }

      return {
        ...file,
        path: toPath,
        language: inferLanguageFromPath(toPath),
      };
    }),
  );
}

export function removeWorkspaceFile(files: RunJSWorkspaceFile[], path: string): RunJSWorkspaceFile[] {
  return normalizeWorkspaceFiles(files.filter((file) => file.path !== path));
}

export function upsertWorkspaceFile(files: RunJSWorkspaceFile[], file: RunJSWorkspaceFile): RunJSWorkspaceFile[] {
  return normalizeWorkspaceFiles([...files.filter((item) => item.path !== file.path), file]);
}

export function ensureManifestEntry(
  files: RunJSWorkspaceFile[],
  entryPath: string,
  createIfMissing: boolean,
): RunJSWorkspaceFile[] {
  const manifest = files.find((file) => file.path === runJSManifestPath);
  if (!manifest && !createIfMissing) {
    return files;
  }

  let nextManifest: Record<string, unknown> = {};
  if (manifest?.content) {
    try {
      const parsed = JSON.parse(manifest.content);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        nextManifest = parsed as Record<string, unknown>;
      }
    } catch (_) {
      nextManifest = {};
    }
  }

  nextManifest.entry = entryPath;

  return upsertWorkspaceFile(files, {
    path: runJSManifestPath,
    content: `${JSON.stringify(nextManifest, null, 2)}\n`,
    language: 'json',
    mode: manifest?.mode,
  });
}

export function resolveInitialEntryPath(
  files: RunJSWorkspaceFile[],
  legacyEntryPath?: string,
  legacyEntry?: string,
): string {
  const manifestEntry = readRunJSManifestEntry(files);
  if (manifestEntry) {
    return manifestEntry;
  }
  if (legacyEntryPath) {
    return legacyEntryPath;
  }
  if (legacyEntry) {
    return legacyEntry;
  }

  return files.find((file) => file.path !== runJSManifestPath)?.path || 'src/main.tsx';
}

export function resolveWorkspaceEntryPath(files: RunJSWorkspaceFile[], currentEntryPath: string): string {
  const normalizedFiles = normalizeWorkspaceFiles(files);
  const filePaths = new Set(normalizedFiles.map((file) => file.path));
  const manifestEntry = readRunJSManifestEntry(normalizedFiles);

  if (manifestEntry && filePaths.has(manifestEntry)) {
    return manifestEntry;
  }
  if (filePaths.has(currentEntryPath)) {
    return currentEntryPath;
  }

  return normalizedFiles.find((file) => file.path !== runJSManifestPath)?.path || currentEntryPath;
}

export function formatChangeSummary(summary: RunJSChangeSummary, t: (key: string) => string): string {
  if (!summary.files) {
    return t('No changes');
  }

  return t('{{files}} file(s) changed, +{{additions}} -{{deletions}}')
    .replace('{{files}}', String(summary.files))
    .replace('{{additions}}', String(summary.additions))
    .replace('{{deletions}}', String(summary.deletions));
}

export function formatVersion(seq?: number | null): string {
  return typeof seq === 'number' ? `v${seq}` : 'v-';
}

export function buildWorkspaceSnapshotKey(
  files: RunJSWorkspaceFile[],
  entryPath: string,
  version: string | undefined,
): string {
  return JSON.stringify({
    entryPath,
    version: version || '',
    files: normalizeWorkspaceFiles(files).map((file) => ({
      path: file.path,
      content: file.content,
      language: file.language || '',
      mode: file.mode || '',
    })),
  });
}

export function readRunJSManifestEntry(files: RunJSWorkspaceFile[]): string | null {
  const manifest = files.find((file) => file.path === runJSManifestPath);
  if (!manifest?.content) {
    return null;
  }

  try {
    const parsed = JSON.parse(manifest.content) as Record<string, unknown>;
    if (typeof parsed.entry !== 'string' || !parsed.entry) {
      return null;
    }
    const validation = validateRunJSWorkspacePathValue(parsed.entry);
    return validation.valid && validation.path ? validation.path : null;
  } catch (_) {
    return null;
  }
}

function splitLines(content: string): string[] {
  return content ? content.replace(/\r\n/g, '\n').split('\n') : [];
}

function countChangedLines(oldContent: string, newContent: string): { additions: number; deletions: number } {
  if (!oldContent) {
    return {
      additions: countLines(newContent),
      deletions: 0,
    };
  }
  if (!newContent) {
    return {
      additions: 0,
      deletions: countLines(oldContent),
    };
  }

  return {
    additions: countLines(newContent),
    deletions: countLines(oldContent),
  };
}

function countLines(content: string): number {
  if (!content) {
    return 0;
  }

  return content.endsWith('\n') ? content.split('\n').length - 1 : content.split('\n').length;
}

function getPathValidationMessage(
  reason: RunJSWorkspacePathValidationReason | undefined,
  fallbackMessage: string | undefined,
  t: (key: string) => string,
): string {
  if (reason === 'outsideWorkspace') {
    return t('File path must be under src, README.md, or .nocobase/runjs-source.json');
  }
  if (reason === 'extensionNotAllowed') {
    return t('File extension is not allowed');
  }
  if (reason === 'hiddenDirectory') {
    return t('Hidden directories are not allowed');
  }

  return fallbackMessage || t('Invalid file path');
}
