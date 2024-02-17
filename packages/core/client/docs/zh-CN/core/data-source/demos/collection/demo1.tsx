import React from 'react';
import { CollectionProviderV2, useCollectionV2 } from '@nocobase/client';
import { createApp } from '../createApp';

const Demo = () => {
  const collection = useCollectionV2();
  return <pre>{JSON.stringify(collection.getField('username'), null, 2)}</pre>;
};

const Root = () => {
  return (
    <CollectionProviderV2 name="users">
      <Demo />
    </CollectionProviderV2>
  );
};

export default createApp(Root);
