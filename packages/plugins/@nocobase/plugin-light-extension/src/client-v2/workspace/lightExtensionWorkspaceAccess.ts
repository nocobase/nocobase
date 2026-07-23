/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { LIGHT_EXTENSION_ENTRY_DESCRIPTOR_FILE, type LightExtensionKind } from '../../constants';

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

export interface LightExtensionWorkspaceAuthoringPathAccess {
  canRead: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canPatch: boolean;
  canDelete: boolean;
  reason?:
    | 'repository_authoring_gate'
    | 'outside_entry_scope'
    | 'entry_descriptor'
    | 'generated_file'
    | 'blocked_dirty_change'
    | 'workspace_read_only';
}

export interface LightExtensionWorkspaceAuthoringPathOptions {
  blockedDirtyChange?: boolean;
  virtual?: boolean;
  workspaceWritable?: boolean;
}

const KIND_ROOTS: Record<LightExtensionKind, string> = {
  'js-action': 'src/client/js-actions',
  'js-block': 'src/client/js-blocks',
  'js-page': 'src/client/js-pages',
  'js-field': 'src/client/js-fields',
  'js-item': 'src/client/js-items',
};

const MANAGED_ENTRY_ROOTS = Object.values(KIND_ROOTS);
const AI_READABLE_SHARED_ROOTS = ['src/shared'] as const;
const AI_READABLE_ROOT_FILES = new Set(['tsconfig.json']);
const GENERATED_TYPES_ROOT = '.light-extension/types';

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

export function getLightExtensionWorkspaceAuthoringPathAccess(
  scope: LightExtensionWorkspaceScope,
  path: string,
  options: LightExtensionWorkspaceAuthoringPathOptions = {},
): LightExtensionWorkspaceAuthoringPathAccess {
  if (scope.mode === 'repository') {
    return denyAuthoringAccess('repository_authoring_gate');
  }

  if (!isSafeAuthoringWorkspacePath(path) || !isSafeAuthoringWorkspacePath(scope.entryPath)) {
    return denyAuthoringAccess('outside_entry_scope');
  }

  const normalizedPath = normalizeWorkspacePath(path);
  const entryRoot = getLightExtensionEntryRoot(scope);
  if (!normalizedPath || !entryRoot) {
    return denyAuthoringAccess('outside_entry_scope');
  }

  const generated = options.virtual === true || isPathInside(normalizedPath, GENERATED_TYPES_ROOT);
  if (generated) {
    return {
      ...denyAuthoringAccess('generated_file'),
      canRead: isPathInside(normalizedPath, GENERATED_TYPES_ROOT),
    };
  }

  const insideEntry = isPathInside(normalizedPath, entryRoot);
  const readableShared =
    AI_READABLE_SHARED_ROOTS.some((root) => isPathInside(normalizedPath, root)) ||
    AI_READABLE_ROOT_FILES.has(normalizedPath);
  if (!insideEntry && !readableShared) {
    return denyAuthoringAccess('outside_entry_scope');
  }

  if (!insideEntry) {
    return {
      ...denyAuthoringAccess('outside_entry_scope'),
      canRead: true,
    };
  }

  if (normalizedPath === `${entryRoot}/${LIGHT_EXTENSION_ENTRY_DESCRIPTOR_FILE}`) {
    return {
      ...denyAuthoringAccess('entry_descriptor'),
      canRead: true,
    };
  }

  if (options.blockedDirtyChange) {
    return {
      ...denyAuthoringAccess('blocked_dirty_change'),
      canRead: true,
    };
  }

  if (options.workspaceWritable === false) {
    return {
      ...denyAuthoringAccess('workspace_read_only'),
      canRead: true,
    };
  }

  return {
    canRead: true,
    canCreate: true,
    canUpdate: true,
    canPatch: true,
    canDelete: true,
  };
}

export function canReadLightExtensionWorkspacePathForAI(
  scope: LightExtensionWorkspaceScope,
  path: string,
  options?: LightExtensionWorkspaceAuthoringPathOptions,
): boolean {
  return getLightExtensionWorkspaceAuthoringPathAccess(scope, path, options).canRead;
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

function denyAuthoringAccess(
  reason: NonNullable<LightExtensionWorkspaceAuthoringPathAccess['reason']>,
): LightExtensionWorkspaceAuthoringPathAccess {
  return {
    canRead: false,
    canCreate: false,
    canUpdate: false,
    canPatch: false,
    canDelete: false,
    reason,
  };
}

function isSafeAuthoringWorkspacePath(path: string): boolean {
  const trimmedPath = path.trim();
  if (!trimmedPath || trimmedPath.includes('\0') || /^(?:[a-zA-Z]:[\\/]|[\\/])/.test(trimmedPath)) {
    return false;
  }

  return !trimmedPath
    .replace(/\\/g, '/')
    .split('/')
    .some((segment) => segment === '.' || segment === '..');
}
