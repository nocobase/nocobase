import React, { FC } from 'react';
import type { DataSourceManagerV2 } from '../data-source/DataSourceManager';
import { DataSourceManagerProviderV2 } from '../data-source/DataSourceManagerProvider';
import {
  type CollectionManagerProviderPropsV2,
  CollectionManagerProviderV2,
} from '../collection/CollectionManagerProvider';

interface DataSourceApplicationProviderProps extends CollectionManagerProviderPropsV2 {
  dataSourceManager: DataSourceManagerV2;
}

export const DataSourceApplicationProvider: FC<DataSourceApplicationProviderProps> = ({
  children,
  dataSourceManager,
  ...otherProps
}) => {
  return (
    <DataSourceManagerProviderV2 dataSourceManager={dataSourceManager}>
      <CollectionManagerProviderV2 {...otherProps}>{children}</CollectionManagerProviderV2>
    </DataSourceManagerProviderV2>
  );
};
