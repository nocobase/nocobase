import React from 'react';
import { CollectionProviderV2, useCollectionV2 } from '@nocobase/client';
import { createApp } from '../createApp';
import collections from '../collections.json';

const Demo = () => {
  const collection = useCollectionV2();
  return <div>collection.data.name: {collection.data.name}</div>;
};

const Root = () => {
  return (
    <CollectionProviderV2 collection={collections[0] as any}>
      <Demo />
    </CollectionProviderV2>
  );
};

export default createApp(Root);
