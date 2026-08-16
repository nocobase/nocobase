/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { JS_TEMPLATE_DESCRIPTOR_FILE, type JsTemplateKind } from '../../constants';

export type JsTemplateWorkspaceScope =
  | { mode: 'project' }
  | {
      mode: 'template';
      entryPath: string;
      kind: JsTemplateKind;
    };

export type JsTemplateWorkspacePathType = 'file' | 'folder';

export interface JsTemplateWorkspacePathAccess {
  canCreate: boolean;
  canDelete: boolean;
  canMove: boolean;
  canRename: boolean;
  canWrite: boolean;
}

export interface JsTemplateWorkspaceAuthoringPathAccess {
  canRead: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  reason?:
    | 'outside_project_scope'
    | 'outside_template_scope'
    | 'generated_file'
    | 'blocked_dirty_change'
    | 'workspace_read_only';
}

export interface JsTemplateWorkspaceAuthoringPathOptions {
  blockedDirtyChange?: boolean;
  virtual?: boolean;
  workspaceWritable?: boolean;
}

const KIND_ROOTS: Record<JsTemplateKind, string> = {
  'js-action': 'src/client/js-actions',
  'js-block': 'src/client/js-blocks',
  'js-field': 'src/client/js-fields',
  'js-item': 'src/client/js-items',
};

const MANAGED_TEMPLATE_ROOTS = Object.values(KIND_ROOTS);
const AI_READABLE_SHARED_ROOTS = ['src/shared'] as const;
const AI_READABLE_ROOT_FILES = new Set(['tsconfig.json']);
const GENERATED_TYPES_ROOT = '.js-template/types';

export function getManagedJsTemplateRoot(path: string): { kind: JsTemplateKind; path: string } | null {
  const normalizedPath = normalizeWorkspacePath(path);
  for (const [kind, kindRoot] of Object.entries(KIND_ROOTS) as Array<[JsTemplateKind, string]>) {
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

export function getJsTemplateRoot(scope: JsTemplateWorkspaceScope): string | null {
  if (scope.mode !== 'template') {
    return null;
  }

  const kindRoot = KIND_ROOTS[scope.kind];
  const entryPath = normalizeWorkspacePath(scope.entryPath);
  if (!isPathInside(entryPath, kindRoot) || entryPath === kindRoot) {
    return null;
  }

  const relativePath = entryPath.slice(kindRoot.length + 1);
  const [templateName, ...remainingSegments] = relativePath.split('/').filter(Boolean);
  if (!templateName) {
    return null;
  }

  return remainingSegments.length > 0 ? `${kindRoot}/${templateName}` : entryPath;
}

export function getJsTemplateWorkspacePathAccess(
  scope: JsTemplateWorkspaceScope,
  path: string,
  pathType: JsTemplateWorkspacePathType,
): JsTemplateWorkspacePathAccess {
  if (scope.mode === 'project') {
    return allowAllPathOperations();
  }

  const normalizedPath = normalizeWorkspacePath(path);
  const templateRoot = getJsTemplateRoot(scope);
  if (!normalizedPath || !templateRoot) {
    return denyAllPathOperations();
  }

  const managedRoot = MANAGED_TEMPLATE_ROOTS.find((root) => isPathInside(normalizedPath, root));
  if (managedRoot && !isPathInside(normalizedPath, templateRoot)) {
    return denyAllPathOperations();
  }

  if (pathType === 'file') {
    if (normalizedPath === `${templateRoot}/${JS_TEMPLATE_DESCRIPTOR_FILE}`) {
      return {
        canCreate: true,
        canDelete: false,
        canMove: false,
        canRename: false,
        canWrite: true,
      };
    }

    return allowAllPathOperations();
  }

  const isProtectedFolder =
    normalizedPath === templateRoot ||
    MANAGED_TEMPLATE_ROOTS.includes(normalizedPath) ||
    MANAGED_TEMPLATE_ROOTS.some((root) => isPathInside(root, normalizedPath));

  if (isProtectedFolder) {
    return {
      canCreate: normalizedPath === templateRoot || !MANAGED_TEMPLATE_ROOTS.includes(normalizedPath),
      canDelete: false,
      canMove: false,
      canRename: false,
      canWrite: true,
    };
  }

  return allowAllPathOperations();
}

export function canChangeJsTemplateWorkspacePath(scope: JsTemplateWorkspaceScope, path: string): boolean {
  return getJsTemplateWorkspacePathAccess(scope, path, 'file').canWrite;
}

export function getJsTemplateWorkspaceAuthoringPathAccess(
  scope: JsTemplateWorkspaceScope,
  path: string,
  options: JsTemplateWorkspaceAuthoringPathOptions = {},
): JsTemplateWorkspaceAuthoringPathAccess {
  if (!isSafeAuthoringWorkspacePath(path)) {
    return denyAuthoringAccess(scope.mode === 'project' ? 'outside_project_scope' : 'outside_template_scope');
  }

  const normalizedPath = normalizeWorkspacePath(path);
  const generated = options.virtual === true || isPathInside(normalizedPath, GENERATED_TYPES_ROOT);
  if (generated) {
    return {
      ...denyAuthoringAccess('generated_file'),
      canRead: isPathInside(normalizedPath, GENERATED_TYPES_ROOT),
    };
  }

  if (scope.mode === 'project') {
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

    if (isManagedJsTemplateDescriptorPath(normalizedPath)) {
      return {
        canRead: true,
        canCreate: true,
        canUpdate: true,
        canDelete: false,
      };
    }

    return {
      canRead: true,
      canCreate: true,
      canUpdate: true,
      canDelete: true,
    };
  }

  if (!isSafeAuthoringWorkspacePath(scope.entryPath)) {
    return denyAuthoringAccess('outside_template_scope');
  }

  const templateRoot = getJsTemplateRoot(scope);
  if (!normalizedPath || !templateRoot) {
    return denyAuthoringAccess('outside_template_scope');
  }

  const insideTemplate = isPathInside(normalizedPath, templateRoot);
  const readableShared =
    AI_READABLE_SHARED_ROOTS.some((root) => isPathInside(normalizedPath, root)) ||
    AI_READABLE_ROOT_FILES.has(normalizedPath);
  if (!insideTemplate && !readableShared) {
    return denyAuthoringAccess('outside_template_scope');
  }

  if (!insideTemplate) {
    return {
      ...denyAuthoringAccess('outside_template_scope'),
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

  if (normalizedPath === `${templateRoot}/${JS_TEMPLATE_DESCRIPTOR_FILE}`) {
    return {
      canRead: true,
      canCreate: true,
      canUpdate: true,
      canDelete: false,
    };
  }

  return {
    canRead: true,
    canCreate: true,
    canUpdate: true,
    canDelete: true,
  };
}

export function canReadJsTemplateWorkspacePathForAI(
  scope: JsTemplateWorkspaceScope,
  path: string,
  options?: JsTemplateWorkspaceAuthoringPathOptions,
): boolean {
  return getJsTemplateWorkspaceAuthoringPathAccess(scope, path, options).canRead;
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

function allowAllPathOperations(): JsTemplateWorkspacePathAccess {
  return {
    canCreate: true,
    canDelete: true,
    canMove: true,
    canRename: true,
    canWrite: true,
  };
}

function denyAllPathOperations(): JsTemplateWorkspacePathAccess {
  return {
    canCreate: false,
    canDelete: false,
    canMove: false,
    canRename: false,
    canWrite: false,
  };
}

function denyAuthoringAccess(
  reason: NonNullable<JsTemplateWorkspaceAuthoringPathAccess['reason']>,
): JsTemplateWorkspaceAuthoringPathAccess {
  return {
    canRead: false,
    canCreate: false,
    canUpdate: false,
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

function isManagedJsTemplateDescriptorPath(path: string): boolean {
  if (!path.endsWith(`/${JS_TEMPLATE_DESCRIPTOR_FILE}`)) {
    return false;
  }
  const templateRoot = path.slice(0, -(JS_TEMPLATE_DESCRIPTOR_FILE.length + 1));
  return getManagedJsTemplateRoot(templateRoot) !== null;
}
