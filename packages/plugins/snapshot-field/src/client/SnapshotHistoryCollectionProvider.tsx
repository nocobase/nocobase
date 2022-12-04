import { CollectionManagerContext, useRequest } from '@nocobase/client';
import React, { useContext } from 'react';
import { Spin } from 'antd';

export const SnapshotHistoryCollectionProvider: React.FC<{ collectionKey?: string }> = (props) => {
  const { collectionKey } = props;
  const { collections: allCollections, ...rest } = useContext(CollectionManagerContext);

  const options = {
    resource: 'collectionsHistory',
    action: 'list',
    params: {
      paginate: false,
      appends: ['fields', 'fields.uiSchema'],
      filter: {
        // inherit: false,
        key: collectionKey,
      },
      sort: ['sort'],
    },
  };
  const service = useRequest(options);

  if (service.loading) {
    return <Spin />;
  }

  const historyCollections = service?.data?.data ?? [];

  const filterdAllCollection = allCollections.filter((c) => !historyCollections.find((i) => i.key === c.key));

  // 用历史 collection 替换当前的 collection
  const overridedCollections = [...filterdAllCollection, ...historyCollections];

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
