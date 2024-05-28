/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

// import { CascaderProps } from 'antd';
import { useMemo } from 'react';
import { CollectionFieldOptions } from './collection';
import { DEFAULT_DATA_SOURCE_KEY, DataSourceManager } from './data-source/DataSourceManager';

const HEADERS_DATA_SOURCE_KEY = 'x-data-source';

// 等把老的去掉后，再把这个函数的实现从那边移动过来
// export function getCollectionFieldsOptions(){}

export const isTitleField = (dm: DataSourceManager, field: CollectionFieldOptions) => {
  return dm.collectionFieldInterfaceManager.getFieldInterface(field.interface)?.titleUsable;
};

export const useDataSourceHeaders = (dataSource?: string) => {
  const headers = useMemo(() => {
    if (dataSource && dataSource !== DEFAULT_DATA_SOURCE_KEY) {
      return { [HEADERS_DATA_SOURCE_KEY]: dataSource };
      // return { 'x-connection': dataSource };
    }
  }, [dataSource]);

  return headers;
};

export const getDataSourceHeaders = (dataSource?: string) => {
  if (dataSource && dataSource !== DEFAULT_DATA_SOURCE_KEY) {
    return { [HEADERS_DATA_SOURCE_KEY]: dataSource };
  }
  return {};
};
