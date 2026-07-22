/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';

import type { LightExtensionKind } from '../../constants';
import {
  getLightExtensionEntryRoot,
  getManagedLightExtensionEntryRoot,
  getLightExtensionWorkspacePathAccess,
  type LightExtensionWorkspaceScope,
} from '../workspace/lightExtensionWorkspaceAccess';

const cases: Array<{ entryPath: string; kind: LightExtensionKind; lockedPath: string }> = [
  {
    entryPath: 'src/client/js-blocks/current/index.tsx',
    kind: 'js-block',
    lockedPath: 'src/client/js-actions/other/index.ts',
  },
  {
    entryPath: 'src/client/js-pages/current/index.tsx',
    kind: 'js-page',
    lockedPath: 'src/client/js-pages/other/index.tsx',
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

describe('light extension entry workspace access', () => {
  it.each(cases)('allows the current $kind entry and locks other entries', ({ entryPath, kind, lockedPath }) => {
    const scope: LightExtensionWorkspaceScope = { mode: 'entry', entryPath, kind };

    expect(getLightExtensionEntryRoot(scope)).toBe(entryPath.slice(0, entryPath.lastIndexOf('/')));
    expect(getLightExtensionWorkspacePathAccess(scope, entryPath, 'file').canWrite).toBe(true);
    expect(getLightExtensionWorkspacePathAccess(scope, lockedPath, 'file')).toMatchObject({
      canDelete: false,
      canMove: false,
      canRename: false,
      canWrite: false,
    });
  });

  it('allows shared and ordinary repository files while protecting managed roots', () => {
    const scope: LightExtensionWorkspaceScope = {
      mode: 'entry',
      entryPath: 'src/client/js-blocks/current/index.tsx',
      kind: 'js-block',
    };

    expect(getLightExtensionWorkspacePathAccess(scope, 'src/shared/helpers.ts', 'file').canWrite).toBe(true);
    expect(getLightExtensionWorkspacePathAccess(scope, 'src/client/components/Card.tsx', 'file').canWrite).toBe(true);
    expect(getLightExtensionWorkspacePathAccess(scope, 'README.md', 'file').canWrite).toBe(true);
    expect(getLightExtensionWorkspacePathAccess(scope, 'src/client/js-blocks', 'folder')).toMatchObject({
      canCreate: false,
      canDelete: false,
      canMove: false,
      canRename: false,
    });
    expect(getLightExtensionWorkspacePathAccess(scope, 'src/client/js-blocks/current', 'folder')).toMatchObject({
      canCreate: true,
      canDelete: false,
      canMove: false,
      canRename: false,
    });
  });

  it('keeps repository workspaces unrestricted', () => {
    expect(
      getLightExtensionWorkspacePathAccess({ mode: 'repository' }, 'src/client/js-actions/other/index.ts', 'file'),
    ).toEqual({
      canCreate: true,
      canDelete: true,
      canMove: true,
      canRename: true,
      canWrite: true,
    });
  });

  it('recognizes only managed entry root folders', () => {
    expect(getManagedLightExtensionEntryRoot('src/client/js-pages/orders')).toEqual({
      kind: 'js-page',
      path: 'src/client/js-pages/orders',
    });
    expect(getManagedLightExtensionEntryRoot('src/client/js-actions/send-email')).toEqual({
      kind: 'js-action',
      path: 'src/client/js-actions/send-email',
    });
    expect(getManagedLightExtensionEntryRoot('src/client/js-actions')).toBeNull();
    expect(getManagedLightExtensionEntryRoot('src/client/js-actions/send-email/helpers')).toBeNull();
    expect(getManagedLightExtensionEntryRoot('src/client/runjs/calculate-subtotal')).toBeNull();
    expect(getManagedLightExtensionEntryRoot('src/shared/send-email')).toBeNull();
  });
});
