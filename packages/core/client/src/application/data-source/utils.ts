// import { CascaderProps } from 'antd';
import _ from 'lodash';
import { useMemo } from 'react';
import { DEFAULT_DATA_SOURCE_NAME, type CollectionFieldOptionsV2, type CollectionManagerV2 } from '../collection';

// 等把老的去掉后，再把这个函数的实现从那边移动过来
// export function getCollectionFieldsOptions(){}

export const isTitleFieldV3 = (cm: CollectionManagerV2, field: CollectionFieldOptionsV2) => {
  return !field.isForeignKey && cm.getFieldInterface(field.interface)?.titleUsable;
};

export const useDataSourceHeadersV3 = (dataSource?: string) => {
  const headers = useMemo(() => {
    if (dataSource && dataSource !== DEFAULT_DATA_SOURCE_NAME) {
      return { 'x-data-source': dataSource };
      // return { 'x-connection': dataSource };
    }
  }, [dataSource]);

  return headers;
};
