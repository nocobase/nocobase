/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { postProcessorRegistry } from '../lib/post-processors.js';

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

function simplifyCollectionsListResult(result: any) {
  const items = toArray(result);

  return {
    data: items.map((item: Record<string, any>) => pickCollectionSummary(item)),
    meta: result?.meta,
    nextActions: [
      'Use collections:get with filterByTk=<collectionName> to inspect one collection in detail.',
      'Use collections:apply with --verify when you need normalized verification in the same response.',
    ],
  };
}

function simplifyFieldsListResult(result: any) {
  const items = toArray(result);

  return {
    data: items.map((item: Record<string, any>) => pickFieldSummary(item)),
    meta: result?.meta,
  };
}

export function registerDataModelingPostProcessors() {
  postProcessorRegistry.register('collections', 'list', simplifyCollectionsListResult);
  postProcessorRegistry.register('collections', 'apply', (result: any) => ({
    data: pickCollectionSummary(result?.data || {}),
    verify: result?.verify,
  }));
  postProcessorRegistry.register('collections', 'verify', (result: any) => result);
  postProcessorRegistry.register('fields', 'apply', (result: any) => ({
    data: pickFieldSummary(result?.data || {}),
  }));
  postProcessorRegistry.register('collections.fields', 'list', simplifyFieldsListResult);
}
