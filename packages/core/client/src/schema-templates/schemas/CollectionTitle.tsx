import React, { useMemo } from 'react';
import { useDataSourceManager, useCollectionRecordData } from '../../data-source';
import { useCompile } from '../../schema-component';

export const CollectionTitle = (props) => {
  const { dataSourceKey = 'main', collectionName } = useCollectionRecordData();
  const dataSourceManager = useDataSourceManager();
  const compile = useCompile();
  const [title1, title2] = useMemo(() => {
    const dataSource = dataSourceManager.getDataSource(dataSourceKey);
    if (dataSource) {
      const collection = dataSource.collectionManager.getCollection(collectionName);
      return [dataSource.displayName, collection?.title || collectionName];
    }
    return [dataSourceKey, null];
  }, [dataSourceManager, dataSourceKey, collectionName]);
  return (
    <>
      {compile(title1)} {'>'} {compile(title2)}
    </>
  );
};
