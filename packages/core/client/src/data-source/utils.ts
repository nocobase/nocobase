// import { CascaderProps } from 'antd';
import _ from 'lodash';
import { useMemo } from 'react';
import { CollectionFieldOptions } from './collection';
import { DEFAULT_DATA_SOURCE_KEY, DataSourceManager } from './data-source/DataSourceManager';

// 等把老的去掉后，再把这个函数的实现从那边移动过来
// export function getCollectionFieldsOptions(){}

export const isTitleField = (dm: DataSourceManager, field: CollectionFieldOptions) => {
  return !field.isForeignKey && dm.collectionFieldInterfaceManager.getFieldInterface(field.interface)?.titleUsable;
};

export const useDataSourceHeaders = (dataSource?: string) => {
  const headers = useMemo(() => {
    if (dataSource && dataSource !== DEFAULT_DATA_SOURCE_KEY) {
      return { 'x-data-source': dataSource };
      // return { 'x-connection': dataSource };
    }
  }, [dataSource]);

  return headers;
};
