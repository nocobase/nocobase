/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { McpToolsManager } from '@nocobase/ai';

function toArray(value: any) {
  if (Array.isArray(value)) {
    return value;
  }

  if (Array.isArray(value?.data)) {
    return value.data;
  }

  return [];
}

function pickCollectionSummary(item: Record<string, any>) {
  return {
    key: item?.key,
    name: item?.name,
    title: item?.title,
    description: item?.description,
  };
}

function pickFieldSummary(item: Record<string, any>) {
  return {
    key: item?.key,
    name: item?.name,
    type: item?.type,
    title: item?.uiSchema?.title,
    description: item?.description,
    collectionName: item?.collectionName,
  };
}

export function simplifyCollectionsListResult(result: any) {
  const items = toArray(result);

  return {
    data: items.map((item) => pickCollectionSummary(item)),
    meta: result?.meta,
    nextActions: [
      'Use collections:get with filterByTk=<collectionName> to inspect one collection in detail.',
      'Use collections.fields:list with sourceId=<collectionName> to inspect fields when needed.',
    ],
  };
}

export function simplifyFieldsListResult(result: any) {
  const items = toArray(result);

  return {
    data: items.map((item) => pickFieldSummary(item)),
    meta: result?.meta,
  };
}

export function registerDataSourceMainMcpPostProcessors(manager: McpToolsManager) {
  manager.registerToolResultPostProcessor('collections', 'list', simplifyCollectionsListResult);
  manager.registerToolResultPostProcessor('collections', 'listMeta', simplifyCollectionsListResult);
  manager.registerToolResultPostProcessor('collections.fields', 'list', simplifyFieldsListResult);
}
