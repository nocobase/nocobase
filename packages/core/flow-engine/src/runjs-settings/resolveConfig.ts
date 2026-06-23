/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { DataSourceManager } from '../data-source';
import type { RunJSSettingsJSONValue } from './types';
import { isPlainRecord } from './values';

export function resolveRunJSSettingsConfigValue(
  dataSourceManager: DataSourceManager | undefined,
  value: RunJSSettingsJSONValue | undefined,
): unknown {
  if (!isPlainRecord(value) || typeof value.$type !== 'string') {
    return value;
  }
  if (!dataSourceManager) {
    return undefined;
  }
  if (value.$type === 'dataSource' && typeof value.name === 'string') {
    return dataSourceManager.getDataSource(value.name);
  }
  if (value.$type === 'collection' && typeof value.dataSource === 'string' && typeof value.name === 'string') {
    return dataSourceManager.getCollection(value.dataSource, value.name);
  }
  if (
    value.$type === 'collectionField' &&
    typeof value.dataSource === 'string' &&
    typeof value.collection === 'string' &&
    typeof value.name === 'string'
  ) {
    return dataSourceManager.getCollection(value.dataSource, value.collection)?.getField(value.name);
  }
  return undefined;
}
