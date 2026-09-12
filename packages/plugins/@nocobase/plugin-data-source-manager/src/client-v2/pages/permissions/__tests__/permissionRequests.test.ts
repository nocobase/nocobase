/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import {
  destroyScopeRecord,
  saveRoleResourcePermissions,
  saveScopeRecord,
  updateGeneralActionPermissions,
  type CreateUpdateResource,
} from '../permissionRequests';

function makeResource(): CreateUpdateResource & { destroy: ReturnType<typeof vi.fn> } {
  return {
    create: vi.fn().mockResolvedValue(undefined),
    update: vi.fn().mockResolvedValue(undefined),
    destroy: vi.fn().mockResolvedValue(undefined),
  };
}

describe('data source permission request helpers', () => {
  it('updates general action permissions with role name as filterByTk', async () => {
    const resource = makeResource();

    await updateGeneralActionPermissions(resource, 'member', ['view:own', 'create']);

    expect(resource.update).toHaveBeenCalledWith({
      filterByTk: 'member',
      values: {
        strategy: {
          actions: ['view:own', 'create'],
        },
      },
    });
  });

  it('creates role resource permissions with dataSourceKey and collection name', async () => {
    const resource = makeResource();

    await saveRoleResourcePermissions(resource, { name: 'posts', roleName: 'member', exists: false }, 'external', {
      usingActionsConfig: true,
      actions: [{ name: 'view', fields: ['title'] }],
    });

    expect(resource.create).toHaveBeenCalledWith({
      values: {
        usingActionsConfig: true,
        actions: [{ name: 'view', fields: ['title'] }],
        name: 'posts',
        dataSourceKey: 'external',
      },
    });
  });

  it('updates role resource permissions with dataSourceKey and collection name filter', async () => {
    const resource = makeResource();

    await saveRoleResourcePermissions(resource, { name: 'posts', roleName: 'member', exists: true }, 'external', {
      usingActionsConfig: false,
      actions: [],
    });

    expect(resource.update).toHaveBeenCalledWith({
      filter: {
        dataSourceKey: 'external',
        name: 'posts',
      },
      values: {
        usingActionsConfig: false,
        actions: [],
        name: 'posts',
        dataSourceKey: 'external',
      },
    });
  });

  it('creates scope records with resourceName and filter scope', async () => {
    const resource = makeResource();

    await saveScopeRecord(resource, {
      resourceName: 'posts',
      values: { name: 'own posts' },
      scope: { title: { $includes: 'test' } },
    });

    expect(resource.create).toHaveBeenCalledWith({
      values: {
        name: 'own posts',
        resourceName: 'posts',
        scope: { title: { $includes: 'test' } },
      },
    });
  });

  it('updates scope records with scope id as filterByTk', async () => {
    const resource = makeResource();

    await saveScopeRecord(resource, {
      id: 123,
      resourceName: 'posts',
      values: { name: 'own posts' },
      scope: { title: { $includes: 'test' } },
    });

    expect(resource.update).toHaveBeenCalledWith({
      filterByTk: 123,
      values: {
        name: 'own posts',
        resourceName: 'posts',
        scope: { title: { $includes: 'test' } },
      },
    });
  });

  it('destroys scope records with scope id as filterByTk', async () => {
    const resource = makeResource();

    await destroyScopeRecord(resource, 123);

    expect(resource.destroy).toHaveBeenCalledWith({
      filterByTk: 123,
    });
  });
});
