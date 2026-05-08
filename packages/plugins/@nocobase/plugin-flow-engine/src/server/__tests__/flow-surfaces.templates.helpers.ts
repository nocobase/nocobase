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
import { resolveFlowSurfaceDefaultFilterMinimumCandidateFieldNames } from '../flow-surfaces/public-data-surface-default-filter';
import { waitForFixtureCollectionsReady } from './flow-surfaces.fixture-ready';

const FLOW_SURFACES_TEST_PUBLIC_DATA_BLOCK_TYPES = new Set(['table', 'list', 'gridCard', 'calendar', 'kanban']);

function normalizeText(value: any) {
  return typeof value === 'string' && value.trim() ? value.trim() : '';
}

function isPublicDataBlockType(type: any) {
  return FLOW_SURFACES_TEST_PUBLIC_DATA_BLOCK_TYPES.has(normalizeText(type));
}

function fallbackDefaultFilterFieldPaths(collection: any) {
  const fields = Array.isArray(collection?.fields)
    ? collection.fields
    : collection?.fields && typeof collection.fields.values === 'function'
      ? Array.from(collection.fields.values())
      : [];
  const fieldNames = fields.map((field: any) => normalizeText(field?.name || field?.options?.name)).filter(Boolean);
  return [fieldNames.find((fieldName) => fieldName !== 'id') || fieldNames[0] || 'id'];
}

function buildDefaultFilter(collectionName: string, collectionMeta: any[]) {
  const normalizedCollectionName = normalizeText(collectionName);
  const collection = Array.isArray(collectionMeta)
    ? collectionMeta.find((item) => normalizeText(item?.name) === normalizedCollectionName)
    : undefined;
  const minimumCandidateFieldNames = collection
    ? resolveFlowSurfaceDefaultFilterMinimumCandidateFieldNames(collection)
    : [];
  const fieldPaths =
    minimumCandidateFieldNames.length > 0 ? minimumCandidateFieldNames : fallbackDefaultFilterFieldPaths(collection);
  const items = fieldPaths.length
    ? fieldPaths.map((path) => ({
        path,
        operator: '$notEmpty',
      }))
    : [
        {
          path: 'id',
          operator: '$notEmpty',
        },
      ];
  return {
    logic: '$and',
    items,
  };
}

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
      values: await withDefaultFilterForPublicDataBlock(rootAgent, values),
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

async function loadCollectionMeta(rootAgent: any) {
  const response = await rootAgent.resource('collections').listMeta();
  expect(response.status).toBe(200);
  return Array.isArray(response.body?.data) ? response.body.data : [];
}

async function withDefaultFilterForPublicDataBlock(rootAgent: any, values: Record<string, any>) {
  if (!values || !isPublicDataBlockType(values.type) || Object.prototype.hasOwnProperty.call(values, 'defaultFilter')) {
    return values;
  }
  const collectionName =
    normalizeText(values?.resourceInit?.collectionName) ||
    normalizeText(values?.resource?.collectionName) ||
    normalizeText(values?.collection);
  if (!collectionName) {
    return values;
  }
  const collectionMeta = await loadCollectionMeta(rootAgent);
  return {
    ...values,
    defaultFilter: buildDefaultFilter(collectionName, collectionMeta),
  };
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
