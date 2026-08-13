/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';

import type { JsTemplateKind } from '../../constants';
import {
  canReadJsTemplateWorkspacePathForAI,
  getJsTemplateRoot,
  getManagedJsTemplateRoot,
  getJsTemplateWorkspaceAuthoringPathAccess,
  getJsTemplateWorkspacePathAccess,
  type JsTemplateWorkspaceScope,
} from '../workspace/jsTemplateWorkspaceAccess';

const cases: Array<{ entryPath: string; kind: JsTemplateKind; lockedPath: string }> = [
  {
    entryPath: 'src/client/js-blocks/current/index.tsx',
    kind: 'js-block',
    lockedPath: 'src/client/js-actions/other/index.ts',
  },
  {
    entryPath: 'src/client/js-blocks/current/index.tsx',
    kind: 'js-block',
    lockedPath: 'src/client/js-blocks/other/index.tsx',
  },
  {
    entryPath: 'src/client/js-actions/current/index.ts',
    kind: 'js-action',
    lockedPath: 'src/client/js-items/other/index.tsx',
  },
  {
    entryPath: 'src/client/js-items/current/index.tsx',
    kind: 'js-item',
    lockedPath: 'src/client/js-fields/other/index.tsx',
  },
  {
    entryPath: 'src/client/js-fields/current/index.tsx',
    kind: 'js-field',
    lockedPath: 'src/client/js-blocks/other/index.tsx',
  },
];

describe('JS Template workspace access', () => {
  it.each(cases)('allows the current $kind template and locks other templates', ({ entryPath, kind, lockedPath }) => {
    const scope: JsTemplateWorkspaceScope = { mode: 'template', entryPath, kind };

    expect(getJsTemplateRoot(scope)).toBe(entryPath.slice(0, entryPath.lastIndexOf('/')));
    expect(getJsTemplateWorkspacePathAccess(scope, entryPath, 'file').canWrite).toBe(true);
    expect(getJsTemplateWorkspacePathAccess(scope, lockedPath, 'file')).toMatchObject({
      canDelete: false,
      canMove: false,
      canRename: false,
      canWrite: false,
    });
  });

  it('allows shared and ordinary project files while protecting managed roots', () => {
    const scope: JsTemplateWorkspaceScope = {
      mode: 'template',
      entryPath: 'src/client/js-blocks/current/index.tsx',
      kind: 'js-block',
    };

    expect(getJsTemplateWorkspacePathAccess(scope, 'src/shared/helpers.ts', 'file').canWrite).toBe(true);
    expect(getJsTemplateWorkspacePathAccess(scope, 'src/client/components/Card.tsx', 'file').canWrite).toBe(true);
    expect(getJsTemplateWorkspacePathAccess(scope, 'README.md', 'file').canWrite).toBe(true);
    expect(getJsTemplateWorkspacePathAccess(scope, 'src/client/js-blocks', 'folder')).toMatchObject({
      canCreate: false,
      canDelete: false,
      canMove: false,
      canRename: false,
    });
    expect(getJsTemplateWorkspacePathAccess(scope, 'src/client/js-blocks/current', 'folder')).toMatchObject({
      canCreate: true,
      canDelete: false,
      canMove: false,
      canRename: false,
    });
    expect(getJsTemplateWorkspacePathAccess(scope, 'src/client/js-blocks/current/entry.json', 'file')).toEqual({
      canCreate: true,
      canDelete: false,
      canMove: false,
      canRename: false,
      canWrite: true,
    });
  });

  it('keeps project workspaces unrestricted', () => {
    expect(
      getJsTemplateWorkspacePathAccess({ mode: 'project' }, 'src/client/js-actions/other/index.ts', 'file'),
    ).toEqual({
      canCreate: true,
      canDelete: true,
      canMove: true,
      canRename: true,
      canWrite: true,
    });
  });

  it('limits template authoring to source files in the current template while exposing explicit read-only dependencies', () => {
    const scope: JsTemplateWorkspaceScope = {
      mode: 'template',
      entryPath: 'src/client/js-blocks/current/index.tsx',
      kind: 'js-block',
    };

    expect(getJsTemplateWorkspaceAuthoringPathAccess(scope, scope.entryPath)).toMatchObject({
      canRead: true,
      canCreate: true,
      canUpdate: true,
      canDelete: true,
    });
    expect(getJsTemplateWorkspaceAuthoringPathAccess(scope, 'src/client/js-blocks/current/helper.ts')).toMatchObject({
      canRead: true,
      canCreate: true,
      canUpdate: true,
      canDelete: true,
    });
    expect(getJsTemplateWorkspaceAuthoringPathAccess(scope, 'src/client/js-blocks/current/entry.json')).toEqual({
      canRead: true,
      canCreate: true,
      canUpdate: true,
      canDelete: false,
    });
    expect(getJsTemplateWorkspaceAuthoringPathAccess(scope, 'src/shared/helpers.ts')).toMatchObject({
      canRead: true,
      canCreate: false,
      canUpdate: false,
      canDelete: false,
    });
    expect(canReadJsTemplateWorkspacePathForAI(scope, 'tsconfig.json')).toBe(true);
    expect(canReadJsTemplateWorkspacePathForAI(scope, 'README.md')).toBe(false);
    expect(canReadJsTemplateWorkspacePathForAI(scope, 'src/client/js-actions/other/index.ts')).toBe(false);
    expect(
      getJsTemplateWorkspaceAuthoringPathAccess(scope, 'src/client/js-blocks/current/../other/index.tsx'),
    ).toMatchObject({ canRead: false, canUpdate: false, reason: 'outside_template_scope' });
    expect(getJsTemplateWorkspaceAuthoringPathAccess(scope, '/src/client/js-blocks/current/index.tsx')).toMatchObject({
      canRead: false,
      canUpdate: false,
      reason: 'outside_template_scope',
    });
  });

  it('marks generated, blocked, read-only, and project-gated authoring paths explicitly', () => {
    const scope: JsTemplateWorkspaceScope = {
      mode: 'template',
      entryPath: 'src/client/js-blocks/current/index.tsx',
      kind: 'js-block',
    };

    expect(getJsTemplateWorkspaceAuthoringPathAccess(scope, '.js-template/types/sdk.d.ts', { virtual: true })).toEqual({
      canRead: true,
      canCreate: false,
      canUpdate: false,
      canDelete: false,
      reason: 'generated_file',
    });
    expect(
      getJsTemplateWorkspaceAuthoringPathAccess(scope, scope.entryPath, { blockedDirtyChange: true }),
    ).toMatchObject({ canRead: true, canUpdate: false, reason: 'blocked_dirty_change' });
    expect(
      getJsTemplateWorkspaceAuthoringPathAccess(scope, scope.entryPath, { workspaceWritable: false }),
    ).toMatchObject({ canRead: true, canUpdate: false, reason: 'workspace_read_only' });
    expect(
      getJsTemplateWorkspaceAuthoringPathAccess(scope, 'src/client/js-blocks/current/entry.json', {
        blockedDirtyChange: true,
      }),
    ).toMatchObject({ canRead: true, canCreate: false, canUpdate: false, reason: 'blocked_dirty_change' });
    expect(
      getJsTemplateWorkspaceAuthoringPathAccess(scope, 'src/client/js-blocks/current/entry.json', {
        workspaceWritable: false,
      }),
    ).toMatchObject({ canRead: true, canCreate: false, canUpdate: false, reason: 'workspace_read_only' });
    expect(getJsTemplateWorkspaceAuthoringPathAccess({ mode: 'project' }, scope.entryPath)).toEqual({
      canRead: false,
      canCreate: false,
      canUpdate: false,
      canDelete: false,
      reason: 'project_authoring_gate',
    });
  });

  it('recognizes only managed template root folders', () => {
    expect(getManagedJsTemplateRoot('src/client/js-blocks/orders')).toEqual({
      kind: 'js-block',
      path: 'src/client/js-blocks/orders',
    });
    expect(getManagedJsTemplateRoot('src/client/js-actions/send-email')).toEqual({
      kind: 'js-action',
      path: 'src/client/js-actions/send-email',
    });
    expect(getManagedJsTemplateRoot('src/client/js-actions')).toBeNull();
    expect(getManagedJsTemplateRoot('src/client/js-actions/send-email/helpers')).toBeNull();
    expect(getManagedJsTemplateRoot('src/client/runjs/calculate-subtotal')).toBeNull();
    expect(getManagedJsTemplateRoot('src/shared/send-email')).toBeNull();
  });
});
