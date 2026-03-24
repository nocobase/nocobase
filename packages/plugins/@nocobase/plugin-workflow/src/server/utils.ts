/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Model } from '@nocobase/database';
import { parseCollectionName } from '@nocobase/data-source-manager';
import type { DataSourceManager } from '@nocobase/data-source-manager';

export function validateCollectionField(
  collection: string,
  dataSourceManager: DataSourceManager,
): Record<string, string> | null {
  const [dataSourceName, collectionName] = parseCollectionName(collection);
  if (collection.includes(':')) {
    const parts = collection.split(':');
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      return { collection: `"collection" must be in the format "dataSourceName:collectionName"` };
    }
  }

  const dataSource = dataSourceManager.dataSources.get(dataSourceName);
  if (!dataSource) {
    return { collection: `Data source "${dataSourceName}" does not exist` };
  }

  if (!dataSource.collectionManager.getCollection(collectionName)) {
    return { collection: `Collection "${collectionName}" does not exist in data source "${dataSourceName}"` };
  }

  return null;
}

export function toJSON(data: any): any {
  if (Array.isArray(data)) {
    return data.map(toJSON);
  }
  if (!(data instanceof Model) || !data) {
    return data;
  }
  const result = data.get();
  Object.keys((<typeof Model>data.constructor).associations).forEach((key) => {
    if (result[key] != null && typeof result[key] === 'object') {
      result[key] = toJSON(result[key]);
    }
  });
  return result;
}
