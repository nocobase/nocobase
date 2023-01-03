import { CollectionManagerContext, useHistoryCollection } from '@nocobase/client';
import React, { useContext } from 'react';

export const SnapshotHistoryCollectionProvider: React.FC<{ collectionName: string }> = (props) => {
  const { collectionName } = props;
  const { collections: allCollections, ...rest } = useContext(CollectionManagerContext);
  const historyCollection = useHistoryCollection(collectionName);

  const filterdAllCollection = allCollections.filter((c) => historyCollection?.key !== c.key);

  // 用历史 collection 替换当前的 collection
  const overridedCollections = historyCollection ? [...filterdAllCollection, historyCollection] : allCollections;

  return (
    <CollectionManagerContext.Provider
      value={{
        ...rest,
        collections: overridedCollections,
      }}
    >
      {props.children}
    </CollectionManagerContext.Provider>
  );
};
