/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { RunJSPathValidationResult, RunJSWorkspaceFile } from './types';
import {
  defaultRunJSEntryPath,
  defaultRunJSSourceRoot,
  normalizeRunJSWorkspaceFolderPath,
  normalizeRunJSWorkspacePath,
  resolveInitialEntryPath,
  resolveWorkspaceEntryPath,
  runJSManifestPath,
  validateRunJSWorkspaceFolderPath,
  validateRunJSWorkspacePath,
} from './workspaceUtils';

export interface RunJSWorkspaceAdapter {
  sourceRoot: string;
  defaultEntryPath: string;
  manifestPath: string;
  importableFileExtensions: readonly string[];
  normalizeFilePath(path: string): string;
  normalizeFolderPath(path: string): string;
  validateFilePath(path: string, t: (key: string) => string): RunJSPathValidationResult;
  validateFolderPath(path: string, t: (key: string) => string): RunJSPathValidationResult;
  resolveInitialEntryPath(files: RunJSWorkspaceFile[], legacyEntryPath?: string, legacyEntry?: string): string;
  resolveEntryPath(files: RunJSWorkspaceFile[], currentEntryPath: string): string;
  canCreateFileInFolder(folderPath: string): boolean;
  resolveCreateFolder(folderPath: string): string;
}

export const clientRunJSWorkspaceAdapter: RunJSWorkspaceAdapter = {
  sourceRoot: defaultRunJSSourceRoot,
  defaultEntryPath: defaultRunJSEntryPath,
  manifestPath: runJSManifestPath,
  importableFileExtensions: ['.ts', '.tsx', '.js', '.jsx'],
  normalizeFilePath: normalizeRunJSWorkspacePath,
  normalizeFolderPath: normalizeRunJSWorkspaceFolderPath,
  validateFilePath: validateRunJSWorkspacePath,
  validateFolderPath: validateRunJSWorkspaceFolderPath,
  resolveInitialEntryPath,
  resolveEntryPath: resolveWorkspaceEntryPath,
  canCreateFileInFolder(folderPath: string): boolean {
    return folderPath === 'src' || folderPath.startsWith('src/');
  },
  resolveCreateFolder(folderPath: string): string {
    return this.canCreateFileInFolder(folderPath) ? folderPath : this.sourceRoot;
  },
};
