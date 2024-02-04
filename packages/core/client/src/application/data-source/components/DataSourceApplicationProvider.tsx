import React, { FC } from 'react';
import { DataSourceManagerProviderV3, DataSourceManagerV3 } from '../data-source';
import { CollectionManagerProviderPropsV3, CollectionManagerProviderV3 } from '../collection';

interface DataSourceApplicationProviderProps extends CollectionManagerProviderPropsV3 {
  dataSourceManager: DataSourceManagerV3;
}

export const DataSourceApplicationProvider: FC<DataSourceApplicationProviderProps> = ({
  children,
  dataSourceManager,
  ...otherProps
}) => {
  return (
    <DataSourceManagerProviderV3 dataSourceManager={dataSourceManager}>
      <CollectionManagerProviderV3 {...otherProps}>{children}</CollectionManagerProviderV3>
    </DataSourceManagerProviderV3>
  );
};
