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
  addAvailableAIEmployee,
  listAvailableAIEmployees,
  listPermissionAIEmployees,
  removeAvailableAIEmployee,
  setAvailableAIEmployees,
  updateAllowNewAIEmployee,
  type PermissionsAPIClient,
} from '../pages/permissions/Permissions';

describe('AI employees v2 permissions request helpers', () => {
  it('lists AI employees from aiEmployees', async () => {
    const list = vi.fn().mockResolvedValue({
      data: {
        data: [{ username: 'atlas' }, { nickname: 'invalid' }],
      },
    });
    const api = {
      resource: () => ({ list }),
    } as unknown as PermissionsAPIClient;

    await expect(listPermissionAIEmployees(api)).resolves.toEqual([{ username: 'atlas' }]);
    expect(list).toHaveBeenCalledWith({
      paginate: false,
    });
  });

  it('lists available AI employees by role name', async () => {
    const list = vi.fn().mockResolvedValue({
      data: {
        data: [{ username: 'atlas' }, { username: 'vera' }],
      },
    });
    const resource = vi.fn(() => ({ list }));
    const api = { resource } as unknown as PermissionsAPIClient;

    await expect(listAvailableAIEmployees(api, 'admin')).resolves.toEqual(['atlas', 'vera']);
    expect(resource).toHaveBeenCalledWith('roles.aiEmployees', 'admin');
    expect(list).toHaveBeenCalledWith({
      paginate: false,
    });
  });

  it('updates allowNewAiEmployee by role primary key', async () => {
    const update = vi.fn().mockResolvedValue({});
    const api = {
      resource: () => ({ update }),
    } as unknown as PermissionsAPIClient;

    await expect(
      updateAllowNewAIEmployee(api, { name: 'admin', title: 'Admin', allowNewAiEmployee: false }, true),
    ).resolves.toMatchObject({
      name: 'admin',
      allowNewAiEmployee: true,
    });
    expect(update).toHaveBeenCalledWith({
      filterByTk: 'admin',
      values: {
        allowNewAiEmployee: true,
      },
    });
  });

  it('sets available AI employees through roles.aiEmployees.set', async () => {
    const set = vi.fn().mockResolvedValue({});
    const resource = vi.fn(() => ({ set }));
    const api = { resource } as unknown as PermissionsAPIClient;

    await setAvailableAIEmployees(api, 'member', ['atlas', 'vera']);
    expect(resource).toHaveBeenCalledWith('roles.aiEmployees', 'member');
    expect(set).toHaveBeenCalledWith({
      values: ['atlas', 'vera'],
    });
  });

  it('adds one available AI employee through roles.aiEmployees.add', async () => {
    const add = vi.fn().mockResolvedValue({});
    const resource = vi.fn(() => ({ add }));
    const api = { resource } as unknown as PermissionsAPIClient;

    await addAvailableAIEmployee(api, 'member', 'atlas');
    expect(resource).toHaveBeenCalledWith('roles.aiEmployees', 'member');
    expect(add).toHaveBeenCalledWith({
      values: ['atlas'],
    });
  });

  it('removes one available AI employee through roles.aiEmployees.remove', async () => {
    const remove = vi.fn().mockResolvedValue({});
    const resource = vi.fn(() => ({ remove }));
    const api = { resource } as unknown as PermissionsAPIClient;

    await removeAvailableAIEmployee(api, 'member', 'atlas');
    expect(resource).toHaveBeenCalledWith('roles.aiEmployees', 'member');
    expect(remove).toHaveBeenCalledWith({
      values: ['atlas'],
    });
  });
});
