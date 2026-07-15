/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { LightExtensionKind } from '../../constants';

export type LightExtensionWorkspaceScope =
  | { mode: 'repository' }
  | {
      mode: 'entry';
      entryPath: string;
      kind: LightExtensionKind;
    };

export type LightExtensionWorkspacePathType = 'file' | 'folder';

export interface LightExtensionWorkspacePathAccess {
  canCreate: boolean;
  canDelete: boolean;
  canMove: boolean;
  canRename: boolean;
  canWrite: boolean;
}

const KIND_ROOTS: Record<LightExtensionKind, string> = {
  'js-action': 'src/client/js-actions',
  'js-block': 'src/client/js-blocks',
  'js-field': 'src/client/js-fields',
  'js-item': 'src/client/js-items',
  runjs: 'src/client/runjs',
};

const MANAGED_ENTRY_ROOTS = Object.values(KIND_ROOTS);

export function getManagedLightExtensionEntryRoot(path: string): { kind: LightExtensionKind; path: string } | null {
  const normalizedPath = normalizeWorkspacePath(path);
  for (const [kind, kindRoot] of Object.entries(KIND_ROOTS) as Array<[LightExtensionKind, string]>) {
    if (!normalizedPath.startsWith(`${kindRoot}/`)) {
      continue;
    }
    const relativePath = normalizedPath.slice(kindRoot.length + 1);
    if (relativePath && !relativePath.includes('/')) {
      return { kind, path: normalizedPath };
    }
  }

  return null;
}

export function getLightExtensionEntryRoot(scope: LightExtensionWorkspaceScope): string | null {
  if (scope.mode !== 'entry') {
    return null;
  }

  const kindRoot = KIND_ROOTS[scope.kind];
  const entryPath = normalizeWorkspacePath(scope.entryPath);
  if (!isPathInside(entryPath, kindRoot) || entryPath === kindRoot) {
    return null;
  }

  const relativePath = entryPath.slice(kindRoot.length + 1);
  const [entryName, ...remainingSegments] = relativePath.split('/').filter(Boolean);
  if (!entryName) {
    return null;
  }

  return remainingSegments.length > 0 ? `${kindRoot}/${entryName}` : entryPath;
}

export function getLightExtensionWorkspacePathAccess(
  scope: LightExtensionWorkspaceScope,
  path: string,
  pathType: LightExtensionWorkspacePathType,
): LightExtensionWorkspacePathAccess {
  if (scope.mode === 'repository') {
    return allowAllPathOperations();
  }

  const normalizedPath = normalizeWorkspacePath(path);
  const entryRoot = getLightExtensionEntryRoot(scope);
  if (!normalizedPath || !entryRoot) {
    return denyAllPathOperations();
  }

  const managedRoot = MANAGED_ENTRY_ROOTS.find((root) => isPathInside(normalizedPath, root));
  if (managedRoot && !isPathInside(normalizedPath, entryRoot)) {
    return denyAllPathOperations();
  }

  if (pathType === 'file') {
    return allowAllPathOperations();
  }

  const isProtectedFolder =
    normalizedPath === entryRoot ||
    MANAGED_ENTRY_ROOTS.includes(normalizedPath) ||
    MANAGED_ENTRY_ROOTS.some((root) => isPathInside(root, normalizedPath));

  if (isProtectedFolder) {
    return {
      canCreate: normalizedPath === entryRoot || !MANAGED_ENTRY_ROOTS.includes(normalizedPath),
      canDelete: false,
      canMove: false,
      canRename: false,
      canWrite: true,
    };
  }

  return allowAllPathOperations();
}

export function canChangeLightExtensionWorkspacePath(scope: LightExtensionWorkspaceScope, path: string): boolean {
  return getLightExtensionWorkspacePathAccess(scope, path, 'file').canWrite;
}

export function normalizeWorkspacePath(path: string): string {
  return path
    .trim()
    .replace(/\\/g, '/')
    .replace(/\/+/g, '/')
    .replace(/^\/+|\/+$/g, '');
}

function isPathInside(path: string, folderPath: string): boolean {
  return path === folderPath || path.startsWith(`${folderPath}/`);
}

function allowAllPathOperations(): LightExtensionWorkspacePathAccess {
  return {
    canCreate: true,
    canDelete: true,
    canMove: true,
    canRename: true,
    canWrite: true,
  };
}

function denyAllPathOperations(): LightExtensionWorkspacePathAccess {
  return {
    canCreate: false,
    canDelete: false,
    canMove: false,
    canRename: false,
    canWrite: false,
  };
}
