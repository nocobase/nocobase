import React, { FC } from 'react';
import type { DataSourceManager } from '../data-source/DataSourceManager';
import { DataSourceManagerProvider } from '../data-source/DataSourceManagerProvider';
import {
  type CollectionManagerProviderProps,
  CollectionManagerProvider,
} from '../collection/CollectionManagerProvider';

interface DataSourceApplicationProviderProps extends CollectionManagerProviderProps {
  dataSourceManager: DataSourceManager;
}

/**
 * @internal
 */
export const DataSourceApplicationProvider: FC<DataSourceApplicationProviderProps> = ({
  children,
  dataSourceManager,
  ...otherProps
}) => {
  return (
    <DataSourceManagerProvider dataSourceManager={dataSourceManager}>
      <CollectionManagerProvider {...otherProps}>{children}</CollectionManagerProvider>
    </DataSourceManagerProvider>
  );
};
