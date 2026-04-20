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

function parseAssociatedIndex(value: unknown) {
  if (typeof value !== 'string') {
    return {};
  }

  const separatorIndex = value.indexOf('.');
  if (separatorIndex === -1) {
    return {};
  }

  return {
    dataSourceKey: value.slice(0, separatorIndex),
    collectionName: value.slice(separatorIndex + 1),
  };
}

function pickCollectionSummary(item: Record<string, any>) {
  return {
    name: item?.name,
    title: item?.title ?? item?.options?.title ?? item?.displayName,
    description: item?.description ?? item?.options?.description,
    dataSourceKey: item?.dataSourceKey,
  };
}

function pickFieldSummary(item: Record<string, any>) {
  return {
    name: item?.name,
    type: item?.type,
    title: item?.uiSchema?.title,
    description: item?.description,
    dataSourceKey: item?.dataSourceKey,
    collectionName: item?.collectionName,
  };
}

function pickRemoteFieldSummary(
  item: Record<string, any>,
  defaults: {
    dataSourceKey?: string;
    collectionName?: string;
  },
) {
  return {
    name: item?.name,
    type: item?.type,
    title: item?.uiSchema?.title,
    description: item?.description,
    dataSourceKey: item?.dataSourceKey,
    collectionName: item?.collectionName,
    ...defaults,
  };
}

function pickDataSourceSummary(item: Record<string, any>) {
  const summary: Record<string, any> = {
    displayName: item?.displayName,
    key: item?.key,
    type: item?.type,
    status: item?.status,
  };

  if (Array.isArray(item?.collections)) {
    summary.collections = item.collections.map((collection: Record<string, any>) => {
      const nextCollection: Record<string, any> = pickCollectionSummary({
        ...collection,
        dataSourceKey: collection?.dataSourceKey ?? item?.key,
      });

      if (Array.isArray(collection?.fields)) {
        nextCollection.fields = collection.fields.map((field: Record<string, any>) =>
          pickRemoteFieldSummary(field, {
            dataSourceKey: collection?.dataSourceKey ?? item?.key,
            collectionName: collection?.name,
          }),
        );
      }

      return nextCollection;
    });
  }

  return summary;
}

export function simplifyDataSourceListResult(result: any) {
  const items = toArray(result);

  return {
    data: items.map((item: Record<string, any>) => pickDataSourceSummary(item)),
    meta: result?.meta,
  };
}

export function simplifyDataSourceCollectionsListResult(result: any) {
  const items = toArray(result);

  return {
    data: items.map((item: Record<string, any>) => pickCollectionSummary(item)),
    meta: result?.meta,
  };
}

export function simplifyDataSourceFieldsListResult(
  result: any,
  options?: {
    flags?: Record<string, unknown>;
  },
) {
  const items = toArray(result);
  const defaults = parseAssociatedIndex(options?.flags?.['associated-index']);

  return {
    data: items.map((item: Record<string, any>) =>
      item?.dataSourceKey || item?.collectionName ? pickFieldSummary(item) : pickRemoteFieldSummary(item, defaults),
    ),
    meta: result?.meta,
  };
}

export function registerDataSourceManagerPostProcessors() {
  postProcessorRegistry.register('data-sources', 'list', simplifyDataSourceListResult);
  postProcessorRegistry.register('data-sources', 'list-enabled', simplifyDataSourceListResult);
  postProcessorRegistry.register('data-sources.collections', 'list', simplifyDataSourceCollectionsListResult);
  postProcessorRegistry.register('data-sources-collections.fields', 'list', (result, context) =>
    simplifyDataSourceFieldsListResult(result, {
      flags: context.flags,
    }),
  );
}
