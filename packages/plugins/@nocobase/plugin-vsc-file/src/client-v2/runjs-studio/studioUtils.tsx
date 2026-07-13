/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FileTextOutlined } from '@ant-design/icons';
import type {
  CodeEditorTypeScriptProject,
  DiagnoseRunJSResult,
  RunJSImportModuleCompletion,
} from '@nocobase/client-v2';
import React, { useRef } from 'react';

import type { RunJSCompileDiagnostic } from './types';
import type {
  RunJSChangeSummary,
  RunJSConsoleEntry,
  RunJSSourceOpenWorkspaceResult,
  RunJSWorkspaceFile,
} from './types';
import { RunJSSourceRequestError } from './useRunJSSourceResource';
import {
  compareRunJSPaths,
  hasWorkspaceChanges,
  normalizeWorkspaceFiles,
  readRunJSManifestFolders,
  runJSManifestPath,
} from './workspaceUtils';
import type { WorkspaceLoadResult } from './studioInternalTypes';
import { clientRunJSWorkspaceAdapter } from './workspaceAdapter';

export const defaultEntryPath = clientRunJSWorkspaceAdapter.defaultEntryPath;
export const defaultRunJSSourceRoot = clientRunJSWorkspaceAdapter.sourceRoot;
export const defaultStudioHeight = 'min(720px, calc(100vh - 112px))';
export const defaultConsolePanelHeight = 180;
export const minConsolePanelHeight = 80;
export const importableRunJSFileExtensions = [...clientRunJSWorkspaceAdapter.importableFileExtensions];
const runJSDragKindDataType = 'application/x-nocobase-runjs-kind';
const runJSDragPathDataType = 'application/x-nocobase-runjs-path';
const runJSFileTypeIconConfigs: Record<
  string,
  {
    background: string;
    borderColor: string;
    color: string;
    label: string;
  }
> = {
  css: { background: '#e6f4ff', borderColor: '#91caff', color: '#0958d9', label: 'CSS' },
  html: { background: '#fff2e8', borderColor: '#ffbb96', color: '#d4380d', label: 'H5' },
  js: { background: '#fffbe6', borderColor: '#ffe58f', color: '#ad8b00', label: 'JS' },
  jsx: { background: '#f6ffed', borderColor: '#b7eb8f', color: '#389e0d', label: 'JSX' },
  ts: { background: '#e6f4ff', borderColor: '#91caff', color: '#0958d9', label: 'TS' },
  tsx: { background: '#f9f0ff', borderColor: '#d3adf7', color: '#722ed1', label: 'TSX' },
};

export function formatVscComponentError(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (!error || typeof error !== 'object' || Array.isArray(error)) {
    return fallback;
  }

  const message = (error as { message?: unknown }).message;
  return typeof message === 'string' && message ? message : fallback;
}

export function buildWorkspaceLoadResult(opened: RunJSSourceOpenWorkspaceResult): WorkspaceLoadResult {
  const nextBaseFiles = normalizeWorkspaceFiles(opened.files || []);
  const nextCurrentFiles = normalizeWorkspaceFiles(nextBaseFiles);
  const nextEntryPath = clientRunJSWorkspaceAdapter.normalizeFilePath(
    clientRunJSWorkspaceAdapter.resolveInitialEntryPath(nextCurrentFiles, opened.legacy.entryPath, opened.legacy.entry),
  );

  return {
    opened,
    baseFiles: nextBaseFiles,
    currentFiles: nextCurrentFiles,
    entryPath: nextEntryPath,
  };
}

export function isViewportSizedValue(value: string | number | undefined): boolean {
  if (typeof value !== 'string') {
    return false;
  }

  return /(?:\b(?:vh|dvh|svh|lvh)\b|%|calc\()/i.test(value);
}

export function isLegacyCompactHeight(value: string | number | undefined): boolean {
  if (typeof value === 'number') {
    return value > 0 && value <= 240;
  }

  const match = typeof value === 'string' ? value.trim().match(/^(\d+(?:\.\d+)?)px$/i) : null;
  return Boolean(match && Number(match[1]) > 0 && Number(match[1]) <= 240);
}

export function resolveStudioSize(
  height: string | number | undefined,
  minHeight: string | number | undefined,
): { height: string | number; minHeight: string | number } {
  if (height === '100%') {
    return {
      height: 'calc(100vh - 42px)',
      minHeight: 0,
    };
  }

  if (isViewportSizedValue(minHeight)) {
    return {
      height: minHeight as string,
      minHeight: 0,
    };
  }

  if (height && !isLegacyCompactHeight(height)) {
    return {
      height,
      minHeight: minHeight ?? 0,
    };
  }

  return {
    height: defaultStudioHeight,
    minHeight: minHeight ?? 0,
  };
}

export type FileTreeFolderRow = {
  key: string;
  type: 'folder';
  path: string;
  name: string;
  depth: number;
};

export type FileTreeFileRow = {
  key: string;
  type: 'file';
  path: string;
  name: string;
  depth: number;
  file: RunJSWorkspaceFile;
};

export type FileTreeRow = FileTreeFolderRow | FileTreeFileRow;

export type InlineEditTarget = {
  isNew: boolean;
  path: string;
  type: 'file' | 'folder';
  value: string;
};

export type RunJSTreeDragKind = 'file' | 'folder';

export type RunJSTreeDragPayload = {
  kind: RunJSTreeDragKind;
  path: string;
};

export function buildFileTreeRows(
  files: RunJSWorkspaceFile[],
  folders: string[],
  collapsedFolderPaths: Set<string>,
): FileTreeRow[] {
  const rows: FileTreeRow[] = [];
  const folderPaths = new Set<string>();
  const folderChildren = new Map<string, Set<string>>();
  const filesByParent = new Map<string, RunJSWorkspaceFile[]>();

  const addFolder = (path: string) => {
    const segments = path.split('/');
    let currentFolderPath = '';
    segments.forEach((segment) => {
      const parentPath = currentFolderPath;
      currentFolderPath = currentFolderPath ? `${currentFolderPath}/${segment}` : segment;
      folderPaths.add(currentFolderPath);
      const siblings = folderChildren.get(parentPath) || new Set<string>();
      siblings.add(currentFolderPath);
      folderChildren.set(parentPath, siblings);
    });
  };

  folders.forEach(addFolder);

  for (const file of files) {
    const folderPath = getRunJSDirectory(file.path);
    if (folderPath) {
      addFolder(folderPath);
    }
    const siblings = filesByParent.get(folderPath) || [];
    siblings.push(file);
    filesByParent.set(folderPath, siblings);
  }

  const appendChildren = (parentPath: string) => {
    const childFolders = Array.from(folderChildren.get(parentPath) || []).sort(compareRunJSPaths);
    for (const folderPath of childFolders) {
      if (!folderPaths.has(folderPath)) {
        continue;
      }
      const segments = folderPath.split('/');
      rows.push({
        key: `folder:${folderPath}`,
        type: 'folder',
        path: folderPath,
        name: segments[segments.length - 1] || folderPath,
        depth: Math.max(segments.length - 1, 0),
      });
      if (!collapsedFolderPaths.has(folderPath)) {
        appendChildren(folderPath);
      }
    }

    const childFiles = [...(filesByParent.get(parentPath) || [])].sort((left, right) =>
      compareRunJSPaths(left.path, right.path),
    );
    for (const file of childFiles) {
      const segments = file.path.split('/');
      rows.push({
        key: `file:${file.path}`,
        type: 'file',
        path: file.path,
        name: segments[segments.length - 1] || file.path,
        depth: Math.max(segments.length - 1, 0),
        file,
      });
    }
  };

  appendChildren('');
  return rows;
}

export function isWorkspaceFileDirty(savedFiles: RunJSWorkspaceFile[], file: RunJSWorkspaceFile): boolean {
  return hasWorkspaceChanges(
    savedFiles.filter((item) => item.path === file.path),
    [file],
  );
}

export function getImportableRunJSExtension(filePath: string): string {
  return importableRunJSFileExtensions.find((extension) => filePath.endsWith(extension)) || '';
}

export function stripRunJSExtension(filePath: string): string {
  const extension = getImportableRunJSExtension(filePath);
  return extension ? filePath.slice(0, -extension.length) : filePath;
}

export function getRunJSDirectory(filePath: string): string {
  const index = filePath.lastIndexOf('/');
  return index >= 0 ? filePath.slice(0, index) : '';
}

export function getRunJSBaseName(path: string): string {
  const index = path.lastIndexOf('/');
  return index >= 0 ? path.slice(index + 1) : path;
}

export function getRunJSFileExtension(path: string): string {
  const name = getRunJSBaseName(path).toLowerCase();
  const index = name.lastIndexOf('.');
  return index >= 0 ? name.slice(index + 1) : '';
}

export function RunJSFileTypeIcon(props: { path: string }) {
  const { path } = props;
  const config = runJSFileTypeIconConfigs[getRunJSFileExtension(path)];

  if (!config) {
    return <FileTextOutlined />;
  }

  return (
    <span
      aria-hidden="true"
      style={{
        alignItems: 'center',
        background: config.background,
        border: `1px solid ${config.borderColor}`,
        borderRadius: 3,
        color: config.color,
        display: 'inline-flex',
        flex: '0 0 26px',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
        fontSize: 9,
        fontWeight: 700,
        height: 16,
        justifyContent: 'center',
        lineHeight: '14px',
        minWidth: 26,
      }}
    >
      {config.label}
    </span>
  );
}

export function joinRunJSPath(parentPath: string, name: string): string {
  return parentPath ? `${parentPath}/${name}` : name;
}

export function isRunJSPathInsideFolder(path: string, folderPath: string): boolean {
  return path === folderPath || path.startsWith(`${folderPath}/`);
}

export function setRunJSTreeDragPayload(dataTransfer: DataTransfer, kind: RunJSTreeDragKind, path: string) {
  dataTransfer.setData(runJSDragKindDataType, kind);
  dataTransfer.setData(runJSDragPathDataType, path);
  dataTransfer.setData('text/plain', path);
}

export function getRunJSTreeDragPayload(dataTransfer: DataTransfer): RunJSTreeDragPayload | null {
  const path = dataTransfer.getData(runJSDragPathDataType) || dataTransfer.getData('text/plain');
  if (!path) {
    return null;
  }

  const kind = dataTransfer.getData(runJSDragKindDataType) === 'folder' ? 'folder' : 'file';
  return { kind, path };
}

export function replaceRunJSPathPrefix(path: string, oldPrefix: string, nextPrefix: string): string {
  if (path === oldPrefix) {
    return nextPrefix;
  }

  if (path.startsWith(`${oldPrefix}/`)) {
    return `${nextPrefix}${path.slice(oldPrefix.length)}`;
  }

  return path;
}

export function collectRunJSWorkspaceFolders(files: RunJSWorkspaceFile[]): string[] {
  const folders = new Set<string>();
  readRunJSManifestFolders(files).forEach((folder) => folders.add(folder));

  for (const file of files) {
    const directory = getRunJSDirectory(file.path);
    if (!directory) {
      continue;
    }

    const segments = directory.split('/');
    let current = '';
    for (const segment of segments) {
      current = current ? `${current}/${segment}` : segment;
      folders.add(current);
    }
  }

  return Array.from(folders).sort(compareRunJSPaths);
}

export function validateRunJSWorkspaceForSave(
  files: RunJSWorkspaceFile[],
  entryPath: string,
  t: (key: string) => string,
): RunJSCompileDiagnostic[] {
  const diagnostics: RunJSCompileDiagnostic[] = [];

  for (const file of files) {
    const validation = clientRunJSWorkspaceAdapter.validateFilePath(file.path, t);
    if (!validation.valid) {
      diagnostics.push({
        code: 'RUNJS_WORKSPACE_PATH_INVALID',
        message: validation.message || t('Invalid file path'),
        path: file.path,
        severity: 'error',
      });
    }
  }

  if (!files.some((file) => file.path === entryPath)) {
    diagnostics.push({
      code: 'RUNJS_ENTRY_NOT_FOUND',
      message: t('RunJS entry file under src/client was not found'),
      path: entryPath,
      severity: 'error',
    });
  }

  return diagnostics;
}

export function canCreateRunJSFileInFolder(folderPath: string): boolean {
  return clientRunJSWorkspaceAdapter.canCreateFileInFolder(folderPath);
}

export function resolveRunJSCreateFolder(folderPath: string): string {
  return clientRunJSWorkspaceAdapter.resolveCreateFolder(folderPath);
}

export function buildUniqueRunJSPath(
  files: RunJSWorkspaceFile[],
  folderPath: string,
  baseName: string,
  extension: string,
): string {
  const targetFolder = resolveRunJSCreateFolder(folderPath);
  const existingPaths = new Set(files.map((file) => file.path));
  let index = 0;

  while (index < 1000) {
    const suffix = index === 0 ? '' : String(index + 1);
    const candidate = `${targetFolder}/${baseName}${suffix}${extension}`;
    if (!existingPaths.has(candidate)) {
      return candidate;
    }
    index += 1;
  }

  return `${targetFolder}/${baseName}${Date.now()}${extension}`;
}

export function buildNewFilePath(files: RunJSWorkspaceFile[], parentPath: string): string {
  return buildUniqueRunJSPath(files, parentPath, 'helper', '.ts');
}

export function buildNewFolderPath(files: RunJSWorkspaceFile[], parentPath: string): string {
  const targetFolder = resolveRunJSCreateFolder(parentPath);
  const existingFolders = new Set(collectRunJSWorkspaceFolders(files));
  let index = 0;

  while (index < 1000) {
    const suffix = index === 0 ? '' : String(index + 1);
    const candidate = `${targetFolder}/folder${suffix}`;
    if (!existingFolders.has(candidate)) {
      return candidate;
    }
    index += 1;
  }

  return `${targetFolder}/folder${Date.now()}`;
}

export function buildRelativeRunJSImportSpecifier(fromPath: string, targetPath: string): string {
  const fromDirectory = getRunJSDirectory(fromPath);
  const targetWithoutExtension = stripRunJSExtension(targetPath);
  const fromParts = fromDirectory ? fromDirectory.split('/').filter(Boolean) : [];
  const targetParts = targetWithoutExtension.split('/').filter(Boolean);
  let common = 0;

  while (common < fromParts.length && common < targetParts.length && fromParts[common] === targetParts[common]) {
    common += 1;
  }

  const upSegments = fromParts.slice(common).map(() => '..');
  const downSegments = targetParts.slice(common);
  const relative = [...upSegments, ...downSegments].join('/');
  if (!relative) {
    return './';
  }

  return relative.startsWith('.') ? relative : `./${relative}`;
}

export function collectRunJSNamedExports(content: string): string[] {
  const names = new Set<string>();
  const source = String(content || '');
  const identifierPattern = '[$_A-Za-z][$_A-Za-z0-9]*';
  const declarationPattern = new RegExp(
    `\\bexport\\s+(?:async\\s+)?(?:function|class|enum|interface|type)\\s+(${identifierPattern})`,
    'g',
  );
  const variablePattern = /\bexport\s+(?:const|let|var)\s+([^;\n]+)/g;
  const namedListPattern = /\bexport\s*\{([^}]+)\}/g;

  for (const match of source.matchAll(declarationPattern)) {
    if (match[1]) {
      names.add(match[1]);
    }
  }

  for (const match of source.matchAll(variablePattern)) {
    const declarationList = match[1] || '';
    for (const part of declarationList.split(',')) {
      const name = part.trim().match(/^([$_A-Za-z][$_A-Za-z0-9]*)/)?.[1];
      if (name) {
        names.add(name);
      }
    }
  }

  for (const match of source.matchAll(namedListPattern)) {
    const exportList = match[1] || '';
    for (const part of exportList.split(',')) {
      const cleaned = part.trim();
      if (!cleaned) {
        continue;
      }
      const alias = cleaned.match(/\bas\s+([$_A-Za-z][$_A-Za-z0-9]*)$/)?.[1];
      const direct = cleaned.match(/^([$_A-Za-z][$_A-Za-z0-9]*)/)?.[1];
      const name = alias || direct;
      if (name) {
        names.add(name);
      }
    }
  }

  return Array.from(names).sort();
}

export function buildRunJSImportModuleCompletions(
  files: RunJSWorkspaceFile[],
  activePath?: string,
): RunJSImportModuleCompletion[] {
  if (!activePath) {
    return [];
  }

  return files
    .filter((file) => file.path !== activePath)
    .filter((file) => file.path !== runJSManifestPath)
    .filter((file) => Boolean(getImportableRunJSExtension(file.path)))
    .map((file) => ({
      specifier: buildRelativeRunJSImportSpecifier(activePath, file.path),
      detail: file.path,
      exports: collectRunJSNamedExports(file.content),
    }))
    .sort((a, b) => a.specifier.localeCompare(b.specifier));
}

export function buildRunJSImportModuleCompletionSignature(files: RunJSWorkspaceFile[], activePath?: string): string {
  if (!activePath) {
    return '';
  }

  return files
    .filter((file) => file.path !== activePath)
    .filter((file) => file.path !== runJSManifestPath)
    .filter((file) => Boolean(getImportableRunJSExtension(file.path)))
    .map((file) => `${file.path}\u0000${file.content}`)
    .sort()
    .join('\u0001');
}

export function useRunJSImportModuleCompletions(
  files: RunJSWorkspaceFile[],
  activePath?: string,
): RunJSImportModuleCompletion[] {
  const signature = buildRunJSImportModuleCompletionSignature(files, activePath);
  const cacheRef = useRef<{
    completions: RunJSImportModuleCompletion[];
    signature: string;
  }>();

  if (!cacheRef.current || cacheRef.current.signature !== signature) {
    cacheRef.current = {
      completions: buildRunJSImportModuleCompletions(files, activePath),
      signature,
    };
  }

  return cacheRef.current.completions;
}

export function isRunJSTypeScriptProjectFile(path: string): boolean {
  return /\.(?:[cm]?[jt]sx?|d\.ts)$/i.test(path);
}

function isRunJSTypeScriptWorkspaceFile(path: string): boolean {
  return isRunJSTypeScriptProjectFile(path) || path.endsWith('.json');
}

export function buildRunJSTypeScriptProject(
  files: RunJSWorkspaceFile[],
  activeFile?: RunJSWorkspaceFile,
  modelUse?: string,
  globalContextType?: string,
): CodeEditorTypeScriptProject | undefined {
  if (!activeFile || !isRunJSTypeScriptProjectFile(activeFile.path)) {
    return undefined;
  }

  return {
    currentFilePath: activeFile.path,
    files: files
      .filter((file) => file.path !== runJSManifestPath)
      .filter((file) => isRunJSTypeScriptWorkspaceFile(file.path))
      .map((file) => ({
        content: file.content,
        path: file.path,
      })),
    ...(modelUse || globalContextType ? { runJSContext: { modelUse, globalContextType } } : {}),
  };
}

export function appendDiagnostics(
  diagnostics: RunJSCompileDiagnostic[],
  appendConsole: (entry: Omit<RunJSConsoleEntry, 'id'>) => void,
) {
  for (const diagnostic of diagnostics) {
    appendConsole({
      level: diagnostic.severity === 'error' ? 'error' : diagnostic.severity === 'warning' ? 'warn' : 'info',
      message: diagnostic.message,
      path: diagnostic.path,
      line: diagnostic.line,
      column: diagnostic.column,
    });
  }
}

export function appendRunDiagnostics(
  result: DiagnoseRunJSResult,
  appendConsole: (entry: Omit<RunJSConsoleEntry, 'id'>) => void,
) {
  for (const log of result.logs || []) {
    appendConsole({
      level: log.level,
      message: log.message,
    });
  }

  for (const issue of result.issues || []) {
    const start = issue.location?.start;
    appendConsole({
      column: start?.column,
      level: issue.type === 'runtime' ? 'error' : 'warn',
      line: start?.line,
      message: issue.message,
      path: issue.sourcePath,
    });
  }
}

export function formatCompileDiagnostics(diagnostics: RunJSCompileDiagnostic[]): string {
  return diagnostics
    .map((diagnostic) => {
      const location = diagnostic.path
        ? `${diagnostic.path}${diagnostic.line ? `:${diagnostic.line}` : ''}${
            diagnostic.column ? `:${diagnostic.column}` : ''
          }`
        : '';
      const code = diagnostic.code || diagnostic.ruleId ? ` (${diagnostic.code || diagnostic.ruleId})` : '';
      const prefix = `[${diagnostic.severity || 'error'}]${location ? ` ${location}` : ''}${code}`;
      const details = diagnostic.details ? `\n${JSON.stringify(diagnostic.details, null, 2)}` : '';

      return `${prefix} ${diagnostic.message}${details}`;
    })
    .join('\n\n');
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => {
      reject(reader.error || new Error('Failed to read file'));
    };
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === 'string') {
        resolve(result);
        return;
      }
      reject(new Error('Failed to read file'));
    };
    reader.readAsDataURL(file);
  });
}

export function buildRunJSExportFileName(label: string | undefined): string {
  const baseName = (label || 'runjs-workspace').replace(/[^\w.-]+/g, '-').replace(/^-+|-+$/g, '');
  return `${baseName || 'runjs-workspace'}.zip`;
}

export function normalizeRunJSWorkspaceBlob(value: Blob): Blob {
  const blob = value instanceof Blob ? value : new Blob([String(value)], { type: 'application/zip' });
  return blob.type === 'application/zip' ? blob : new Blob([blob], { type: 'application/zip' });
}

export function createRunJSWorkspaceObjectUrl(value: Blob): string | null {
  if (typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') {
    return null;
  }

  return URL.createObjectURL(normalizeRunJSWorkspaceBlob(value));
}

export function revokeRunJSWorkspaceObjectUrl(url: string): void {
  if (typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function') {
    URL.revokeObjectURL(url);
  }
}

export function canStartRunJSWorkspaceDownload(): boolean {
  if (typeof navigator === 'undefined') {
    return true;
  }

  const activation = (navigator as Navigator & { userActivation?: { isActive?: boolean } }).userActivation;
  return activation?.isActive !== false;
}

export function downloadRunJSWorkspaceBlob(value: Blob, fileName: string): boolean {
  if (typeof document === 'undefined' || !canStartRunJSWorkspaceDownload()) {
    return false;
  }

  const url = createRunJSWorkspaceObjectUrl(value);
  if (!url) {
    return false;
  }

  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => revokeRunJSWorkspaceObjectUrl(url), 0);
  return true;
}

export function canSaveVersion(
  versionMessage: string,
  summary: RunJSChangeSummary,
  diagnostics: RunJSCompileDiagnostic[],
  readOnly: boolean,
): boolean {
  const length = versionMessage.trim().length;
  return (
    !readOnly &&
    summary.files > 0 &&
    length >= 3 &&
    length <= 200 &&
    diagnostics.every((item) => item.severity !== 'error')
  );
}

export function hasCompileErrorDiagnostics(diagnostics: RunJSCompileDiagnostic[]): boolean {
  return diagnostics.some((item) => item.severity === 'error');
}

export function isOwnerOutdatedError(error: unknown): error is RunJSSourceRequestError {
  return error instanceof RunJSSourceRequestError && error.code === 'RUNJS_SOURCE_OWNER_OUTDATED';
}
