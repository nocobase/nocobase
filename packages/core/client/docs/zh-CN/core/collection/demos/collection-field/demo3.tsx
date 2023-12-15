import React from 'react';
import { CollectionFieldProviderV2, CollectionFieldV2, useCollectionFieldV2 } from '@nocobase/client';
import { createApp } from '../createApp';
import collections from '../collections.json';

const Demo = () => {
  const collectionField = useCollectionFieldV2();
  return <div>collectionField.data.name: {collectionField.data.name}</div>;
};

const Root = () => {
  const collectionField = new CollectionFieldV2(collections[0].fields[5] as any);
  return (
    <CollectionFieldProviderV2 collectionField={collectionField}>
      <Demo />
    </CollectionFieldProviderV2>
  );
};

export default createApp(Root);
