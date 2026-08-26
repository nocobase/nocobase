/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

type FieldAction = 'list' | 'create' | 'update' | 'destroy';

export function getCollectionFieldActionUrl(
  dataSourceKey: string,
  collectionName: string,
  action: FieldAction,
  filterByTk?: string | number,
) {
  const baseUrl =
    dataSourceKey === 'main'
      ? `collections/${collectionName}/fields:${action}`
      : `dataSourcesCollections/${dataSourceKey}.${collectionName}/fields:${action}`;

  if (filterByTk === undefined || filterByTk === null) {
    return baseUrl;
  }

  return `${baseUrl}?filterByTk=${encodeURIComponent(String(filterByTk))}`;
}
