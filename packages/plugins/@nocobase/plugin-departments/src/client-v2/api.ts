/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { DepartmentPrimaryKey, DepartmentRecord } from './shared/department';

export interface DepartmentFormValues {
  title: string;
  parentId?: DepartmentPrimaryKey | null;
  roleNames?: string[];
  ownerIds?: DepartmentPrimaryKey[];
}

interface DepartmentParentValue {
  id: DepartmentPrimaryKey;
}

export interface DepartmentPayload {
  title: string;
  parent: DepartmentParentValue | null;
  roles?: Array<{ name: string }>;
  owners?: Array<{ id: DepartmentPrimaryKey }>;
}

export interface DepartmentResource {
  create(params: { values: DepartmentPayload }): Promise<unknown>;
  update(params: { filterByTk: DepartmentPrimaryKey; values: DepartmentPayload }): Promise<unknown>;
  destroy(params: { filterByTk: DepartmentPrimaryKey }): Promise<unknown>;
}

export function buildDepartmentPayload(values: DepartmentFormValues, includeOwners = false): DepartmentPayload {
  const parentId = values.parentId ?? null;

  return {
    title: values.title,
    parent: parentId != null ? { id: parentId } : null,
    roles: (values.roleNames || []).map((name) => ({ name })),
    ...(includeOwners ? { owners: (values.ownerIds || []).map((id) => ({ id })) } : {}),
  };
}

export async function createDepartment(resource: DepartmentResource, values: DepartmentFormValues) {
  await resource.create({ values: buildDepartmentPayload(values) });
}

export async function updateDepartment(
  resource: DepartmentResource,
  record: Pick<DepartmentRecord, 'id'>,
  values: DepartmentFormValues,
) {
  if (record.id == null) {
    throw new Error('Edit mode requires department.id');
  }

  await resource.update({
    filterByTk: record.id,
    values: buildDepartmentPayload(values, true),
  });
}

export async function destroyDepartment(resource: DepartmentResource, record: Pick<DepartmentRecord, 'id'>) {
  if (record.id == null) {
    throw new Error('Delete mode requires department.id');
  }

  await resource.destroy({ filterByTk: record.id });
}
