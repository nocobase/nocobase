import React, { FC } from 'react';
import { DataSourceManagerProviderV2, DataSourceManagerV2 } from '../data-source';
import { CollectionManagerProviderPropsV2, CollectionManagerProviderV2 } from '../collection';

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
