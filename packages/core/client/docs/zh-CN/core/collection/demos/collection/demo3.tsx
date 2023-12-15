import React from 'react';
import { CollectionProviderV2, useCollectionV2 } from '@nocobase/client';
import { createApp } from '../createApp';
import collections from '../collections.json';
import { CollectionV2 } from 'packages/core/client/src/application/collection/Collection';

const Demo = () => {
  const collection = useCollectionV2();
  return <div>collection.data.name: {collection.data.name}</div>;
};

const Root = () => {
  const collection = new CollectionV2(collections[0] as any);
  return (
    <CollectionProviderV2 collection={collection}>
      <Demo />
    </CollectionProviderV2>
  );
};

export default createApp(Root);
