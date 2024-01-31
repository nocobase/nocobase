import React, { FC, ReactNode, createContext, useContext, useMemo } from 'react';
import { useCollectionManagerV2 } from '../collection';
import { Result } from 'antd';
import { DeletedPlaceholder } from '../collection/DeletedPlaceholder';

export const CollectionDataSourceName = createContext<string>(undefined);
CollectionDataSourceName.displayName = 'CollectionDataSourceName';

export const CollectionDataSourceProvider: FC<{ dataSource: string; children?: ReactNode }> = ({
  dataSource,
  children,
}) => {
  const cm = useCollectionManagerV2();
  const dataSourceData = useMemo(() => cm.getDataSource(dataSource), [cm, dataSource]);
  if (!dataSourceData) {
    return <DeletedPlaceholder type="DataSource" name={dataSource}></DeletedPlaceholder>;
  }

  if (dataSourceData.status === 'failed') {
    return <Result status="error" title={dataSourceData.errorMessage} />;
  }

  return <CollectionDataSourceName.Provider value={dataSource}>{children}</CollectionDataSourceName.Provider>;
};

export const useCollectionDataSourceName = () => {
  return useContext(CollectionDataSourceName);
};
