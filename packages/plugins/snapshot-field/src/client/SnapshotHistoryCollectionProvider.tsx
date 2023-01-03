import { CollectionManagerContext, useHistoryCollectionsByNames } from '@nocobase/client';
import React, { useContext } from 'react';

export const SnapshotHistoryCollectionProvider: React.FC<{ collectionName: string }> = (props) => {
  const { collectionName } = props;
  const { collections: allCollections, ...rest } = useContext(CollectionManagerContext);
  const historyCollection = useHistoryCollectionsByNames([collectionName])?.[0];
  const inheritCollections = useHistoryCollectionsByNames(historyCollection.inherits ?? []);

  const finallyHistoryCollecionts = [historyCollection, ...inheritCollections].filter((i) => i);

  const filterdAllCollection = allCollections.filter(
    (c) => !finallyHistoryCollecionts.map((i) => i.name).includes(c.name),
  );

  // 用历史 collection 替换当前的 collection
  const overridedCollections = [...filterdAllCollection, ...finallyHistoryCollecionts];

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
