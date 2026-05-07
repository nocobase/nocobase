/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database } from '@nocobase/database';
import { expect } from 'vitest';
import { waitForFixtureCollectionsReady } from './flow-surfaces.fixture-ready';

export function getData(response: any) {
  expect(response.status).toBe(200);
  return response.body?.data?.data ?? response.body?.data;
}

export function getListData(response: any) {
  expect(response.status).toBe(200);
  let current = response.body;
  let meta = response.body?.meta;
  if (current && typeof current === 'object' && 'data' in current) {
    current = current.data;
  }
  for (let i = 0; i < 4; i += 1) {
    if (current && typeof current === 'object' && Array.isArray(current.rows)) {
      return {
        ...current,
        count: current.count ?? meta?.count ?? meta?.total ?? meta?.totalCount,
        page: current.page ?? meta?.page,
        pageSize: current.pageSize ?? meta?.pageSize,
        totalPage: current.totalPage ?? meta?.totalPage,
      };
    }
    if (current && typeof current === 'object' && 'data' in current) {
      meta = current.meta ?? meta;
      current = current.data;
      continue;
    }
    break;
  }
  return {
    rows: Array.isArray(current) ? current : [],
    count: meta?.count ?? meta?.total ?? meta?.totalCount,
    page: meta?.page,
    pageSize: meta?.pageSize,
    totalPage: meta?.totalPage,
  };
}

export function readErrorMessage(response: any) {
  return response?.body?.errors?.[0]?.message || '';
}

export async function createPage(rootAgent: any, values: Record<string, any>) {
  return getData(
    await rootAgent.resource('flowSurfaces').createPage({
      values,
    }),
  );
}

export async function addBlockData(rootAgent: any, values: Record<string, any>) {
  return getData(
    await rootAgent.resource('flowSurfaces').addBlock({
      values,
    }),
  );
}

export async function addFieldData(rootAgent: any, values: Record<string, any>) {
  return getData(
    await rootAgent.resource('flowSurfaces').addField({
      values,
    }),
  );
}

export async function getSurface(rootAgent: any, target: Record<string, any>) {
  return getData(await rootAgent.resource('flowSurfaces').get(target));
}

export async function saveTemplate(rootAgent: any, values: Record<string, any>) {
  return getData(
    await rootAgent.resource('flowSurfaces').saveTemplate({
      values,
    }),
  );
}

export async function expectTemplateUsage(rootAgent: any, templateUid: string, usageCount: number) {
  const template = getData(
    await rootAgent.resource('flowSurfaces').getTemplate({
      values: {
        uid: templateUid,
      },
    }),
  );
  expect(template.usageCount).toBe(usageCount);
}

export function getPopupGridItems(tree: any) {
  return tree?.subModels?.tabs?.[0]?.subModels?.grid?.subModels?.items || [];
}

export function getPopupOpenView(tree: any) {
  return tree?.stepParams?.popupSettings?.openView || tree?.stepParams?.selectExitRecordSettings?.openView;
}

export async function setupFixtureCollections(rootAgent: any, db: Database) {
  await rootAgent.resource('collections').create({
    values: {
      name: 'employees',
      title: 'Employees',
      fields: [
        { name: 'nickname', type: 'string', interface: 'input' },
        { name: 'status', type: 'string', interface: 'input' },
      ],
    },
  });
  await rootAgent.resource('collections').create({
    values: {
      name: 'departments',
      title: 'Departments',
      titleField: 'title',
      filterTargetKey: 'title',
      fields: [{ name: 'title', type: 'string', interface: 'input' }],
    },
  });
  await rootAgent.resource('collections.fields', 'employees').create({
    values: {
      name: 'department',
      type: 'belongsTo',
      target: 'departments',
      foreignKey: 'departmentId',
      interface: 'm2o',
    },
  });
  await rootAgent.resource('collections.fields', 'employees').create({
    values: {
      name: 'secondaryDepartment',
      type: 'belongsTo',
      target: 'departments',
      foreignKey: 'secondaryDepartmentId',
      interface: 'm2o',
    },
  });

  await waitForFixtureCollectionsReady(db, {
    departments: ['title'],
    employees: ['nickname', 'status', 'departmentId', 'secondaryDepartmentId'],
  });
}
