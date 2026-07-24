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
  buildDepartmentPayload,
  createDepartment,
  destroyDepartment,
  updateDepartment,
  type DepartmentResource,
} from '../api';

function makeResource(): DepartmentResource {
  return {
    create: vi.fn().mockResolvedValue(undefined),
    update: vi.fn().mockResolvedValue(undefined),
    destroy: vi.fn().mockResolvedValue(undefined),
  };
}

describe('department request helpers', () => {
  it('builds owner payloads only when requested', () => {
    expect(
      buildDepartmentPayload({
        title: 'Engineering',
        parentId: null,
        ownerIds: [1],
      }),
    ).toEqual({
      title: 'Engineering',
      parent: null,
      roles: [],
    });
    expect(
      buildDepartmentPayload(
        {
          title: 'Engineering',
          parentId: null,
          ownerIds: [1],
        },
        true,
      ),
    ).toEqual({
      title: 'Engineering',
      parent: null,
      roles: [],
      owners: [{ id: 1 }],
    });
  });

  it('fires resource.create on create submit', async () => {
    const resource = makeResource();

    await createDepartment(resource, {
      title: 'Engineering',
      parentId: null,
      roleNames: ['admin'],
    });

    expect(resource.create).toHaveBeenCalledWith({
      values: {
        title: 'Engineering',
        parent: null,
        roles: [{ name: 'admin' }],
      },
    });
  });

  it('fires resource.update with department id as filterByTk on edit submit', async () => {
    const resource = makeResource();

    await updateDepartment(
      resource,
      { id: 987654321 },
      {
        title: 'Product',
        parentId: 123,
        roleNames: ['member'],
        ownerIds: [1, 2],
      },
    );

    expect(resource.update).toHaveBeenCalledWith({
      filterByTk: 987654321,
      values: {
        title: 'Product',
        parent: { id: 123 },
        roles: [{ name: 'member' }],
        owners: [{ id: 1 }, { id: 2 }],
      },
    });
  });

  it('maps parentId to parent relation on create submit', async () => {
    const resource = makeResource();

    await createDepartment(resource, {
      title: 'Frontend',
      parentId: 456,
    });

    expect(resource.create).toHaveBeenCalledWith({
      values: {
        title: 'Frontend',
        parent: { id: 456 },
        roles: [],
      },
    });
  });

  it('fires resource.destroy with department id for row delete', async () => {
    const resource = makeResource();

    await destroyDepartment(resource, { id: 987654321 });

    expect(resource.destroy).toHaveBeenCalledWith({ filterByTk: 987654321 });
  });

  it('throws when edit or delete is requested without a department id', async () => {
    const resource = makeResource();

    await expect(updateDepartment(resource, { id: undefined as never }, { title: 'No id' })).rejects.toThrow(
      'Edit mode requires department.id',
    );
    await expect(destroyDepartment(resource, { id: undefined as never })).rejects.toThrow(
      'Delete mode requires department.id',
    );
    expect(resource.update).not.toHaveBeenCalled();
    expect(resource.destroy).not.toHaveBeenCalled();
  });
});
