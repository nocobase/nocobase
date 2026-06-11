/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DataSource, type DataSourceManager, type DataSourceOptions } from '@nocobase/flow-engine';
import type React from 'react';

export function syncDataSourcesToRuntime(
  dataSourceManager: DataSourceManager | undefined,
  records: Array<Record<string, any>>,
) {
  if (!dataSourceManager) {
    return;
  }

  records.forEach((record) => {
    const options: DataSourceOptions = {
      ...record,
      key: record.key,
      use: record.key === 'main' ? undefined : DataSource,
    };
    if (dataSourceManager.getDataSource(record.key)) {
      dataSourceManager.getDataSource(record.key)?.patchOptions(options);
    } else {
      dataSourceManager.addDataSource(options);
    }
    if (Array.isArray(record.collections)) {
      dataSourceManager.getDataSource(record.key)?.setCollections(record.collections, { clearFields: true });
    }
  });
}

export function removeDataSourcesFromRuntime(dataSourceManager: DataSourceManager | undefined, keys: React.Key[]) {
  if (!dataSourceManager) {
    return;
  }

  keys.forEach((key) => {
    if (String(key) !== 'main') {
      dataSourceManager.removeDataSource(String(key));
    }
  });
}
