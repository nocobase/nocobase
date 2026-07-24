/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';

import { extractFrontendToolManifests, shouldAutoExecuteFrontendTool } from '../frontend-tools';

describe('workspace frontend tool server catalog', () => {
  it('allows describe, list, read, search, prepare, and validate while requiring approval for apply', () => {
    const expectedPermissions = {
      workspaceDescribe: 'ALLOW',
      workspaceListFiles: 'ALLOW',
      workspaceReadFiles: 'ALLOW',
      workspaceSearch: 'ALLOW',
      workspacePrepareChanges: 'ALLOW',
      workspaceValidateDraft: 'ALLOW',
      workspaceApplyPreparedChanges: 'ASK',
    } as const;
    const workspaceTools = Object.entries(expectedPermissions).map(([name, permission]) => ({
      id: `workspace-1:${name}`,
      blockUid: 'workspace-1',
      name,
      title: name,
      description: `${name} description`,
      permission,
      inputSchema: { type: 'object' },
    }));
    const catalog = extractFrontendToolManifests([
      {
        type: 'code-workspace',
        uid: 'workspace-1',
        frontendTools: workspaceTools,
      },
    ]);

    expect(Object.fromEntries(catalog.map((tool) => [tool.name, tool.permission]))).toEqual(expectedPermissions);
    for (const [name, permission] of Object.entries(expectedPermissions)) {
      const toolId = `workspace-1:${name}`;
      expect(shouldAutoExecuteFrontendTool(catalog, { toolId })).toBe(permission === 'ALLOW');
    }
  });
});
