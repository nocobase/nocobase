/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { RoleCollectionRecord } from './types';

export interface UpdateResource {
  update: (params: Record<string, unknown>) => Promise<unknown>;
}

export interface GetResource {
  get: (params: Record<string, unknown>) => Promise<unknown>;
}

export interface ListResource {
  list: (params: Record<string, unknown>) => Promise<unknown>;
}

export interface CreateUpdateResource extends UpdateResource {
  create: (params: Record<string, unknown>) => Promise<unknown>;
}

export interface DestroyResource {
  destroy: (params: Record<string, unknown>) => Promise<unknown>;
}

export async function updateGeneralActionPermissions(resource: UpdateResource, roleName: string, actions: string[]) {
  await resource.update({
    filterByTk: roleName,
    values: {
      strategy: {
        actions,
      },
    },
  });
}

export async function saveRoleResourcePermissions(
  resource: CreateUpdateResource,
  collection: RoleCollectionRecord,
  dataSourceKey: string,
  values: Record<string, unknown>,
) {
  const payload = {
    ...values,
    name: collection.name,
    dataSourceKey,
  };

  if (collection.exists) {
    await resource.update({
      filter: {
        dataSourceKey,
        name: collection.name,
      },
      values: payload,
    });
    return;
  }

  await resource.create({
    values: payload,
  });
}

export async function saveScopeRecord(
  resource: CreateUpdateResource,
  options: {
    id?: string | number;
    resourceName: string;
    values: Record<string, unknown>;
    scope: unknown;
  },
) {
  const payload = {
    ...options.values,
    resourceName: options.resourceName,
    scope: options.scope,
  };

  if (options.id != null) {
    await resource.update({
      filterByTk: options.id,
      values: payload,
    });
    return;
  }

  await resource.create({
    values: payload,
  });
}

export async function destroyScopeRecord(resource: DestroyResource, id: string | number) {
  await resource.destroy({ filterByTk: id });
}
