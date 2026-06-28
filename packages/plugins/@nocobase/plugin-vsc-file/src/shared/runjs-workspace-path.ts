/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { normalizePath } from './path';

export const runJSManifestPath = '.nocobase/runjs-source.json';

const allowedExtensions = ['.ts', '.tsx', '.js', '.jsx', '.json', '.css', '.md'];

export type RunJSWorkspacePathValidationReason =
  | 'invalid'
  | 'outsideWorkspace'
  | 'extensionNotAllowed'
  | 'hiddenDirectory';

export interface RunJSWorkspacePathValidationResult {
  valid: boolean;
  path?: string;
  reason?: RunJSWorkspacePathValidationReason;
  message?: string;
}

export function validateRunJSWorkspacePathValue(path: string): RunJSWorkspacePathValidationResult {
  let normalizedPath: string;
  try {
    normalizedPath = normalizeRunJSWorkspacePathValue(path);
  } catch (error) {
    return {
      valid: false,
      reason: 'invalid',
      message: error instanceof Error && error.message ? error.message : 'Invalid file path',
    };
  }

  if (!isAllowedRunJSPath(normalizedPath)) {
    return {
      valid: false,
      path: normalizedPath,
      reason: 'outsideWorkspace',
      message: 'File path must be under src, README.md, or .nocobase/runjs-source.json',
    };
  }

  if (!hasAllowedExtension(normalizedPath)) {
    return {
      valid: false,
      path: normalizedPath,
      reason: 'extensionNotAllowed',
      message: 'File extension is not allowed',
    };
  }

  if (hasHiddenDirectory(normalizedPath)) {
    return {
      valid: false,
      path: normalizedPath,
      reason: 'hiddenDirectory',
      message: 'Hidden directories are not allowed',
    };
  }

  return {
    valid: true,
    path: normalizedPath,
  };
}

export function normalizeRunJSWorkspacePathValue(path: string): string {
  return normalizePath(path.trim());
}

function isAllowedRunJSPath(path: string): boolean {
  return path === runJSManifestPath || path === 'README.md' || path.startsWith('src/');
}

function hasAllowedExtension(path: string): boolean {
  return allowedExtensions.some((extension) => path.endsWith(extension));
}

function hasHiddenDirectory(path: string): boolean {
  if (path === runJSManifestPath) {
    return false;
  }

  return path
    .split('/')
    .slice(0, -1)
    .some((segment) => segment.startsWith('.'));
}
