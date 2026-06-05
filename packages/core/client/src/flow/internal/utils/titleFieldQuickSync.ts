/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { CollectionFieldOptions, DataSourceManager } from '../../../data-source';
import { DEFAULT_DATA_SOURCE_KEY } from '../../../data-source';

type CollectionLike = {
  name?: unknown;
  dataSource?: unknown;
  dataSourceKey?: unknown;
  setOption?: (key: string, value: any) => any;
};

type ApiClientLike = {
  request?: (options: {
    url: string;
    method?: string;
    params?: Record<string, any>;
    data?: Record<string, any>;
  }) => Promise<any>;
};

export function isTitleUsableField(
  dm: DataSourceManager | undefined,
  field: CollectionFieldOptions | undefined,
): boolean {
  const ifaceName = typeof field?.interface === 'string' ? field.interface : undefined;
  if (!dm || !ifaceName) return false;
  return !!dm.collectionFieldInterfaceManager.getFieldInterface(ifaceName)?.titleUsable;
}

function resolveDataSourceKey(targetCollection: CollectionLike | null | undefined): string {
  const raw = targetCollection?.dataSourceKey ?? targetCollection?.dataSource;
  if (typeof raw === 'string' && raw) return raw;
  return DEFAULT_DATA_SOURCE_KEY;
}

function resolveCollectionName(targetCollection: CollectionLike | null | undefined): string {
  const name = targetCollection?.name;
  if (typeof name === 'string' && name) return name;
  throw new Error('Target collection name is required for syncing title field.');
}

function resolveUpdateUrl(dataSourceKey: string): string {
  if (!dataSourceKey || dataSourceKey === DEFAULT_DATA_SOURCE_KEY) {
    return 'collections:update';
  }
  return `dataSources/${dataSourceKey}/collections:update`;
}

export async function syncCollectionTitleField(options: {
  api: ApiClientLike;
  dataSourceManager?: DataSourceManager;
  targetCollection: CollectionLike | null | undefined;
  titleField: string;
}) {
  const { api, dataSourceManager, targetCollection, titleField } = options;

  if (typeof api?.request !== 'function') {
    throw new Error('API client is unavailable.');
  }
  if (typeof titleField !== 'string' || !titleField) {
    throw new Error('Title field is required.');
  }

  const collectionName = resolveCollectionName(targetCollection);
  const dataSourceKey = resolveDataSourceKey(targetCollection);

  await api.request({
    url: resolveUpdateUrl(dataSourceKey),
    method: 'post',
    params: { filterByTk: collectionName },
    data: { titleField },
  });

  targetCollection?.setOption?.('titleField', titleField);

  const dataSource = dataSourceManager?.getDataSource?.(dataSourceKey);
  if (dataSource && typeof dataSource.reload === 'function') {
    await dataSource.reload();
  }

  return {
    dataSourceKey,
    collectionName,
    titleField,
  };
}
