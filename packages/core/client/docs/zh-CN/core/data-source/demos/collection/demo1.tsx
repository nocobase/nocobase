import React from 'react';
import { CollectionProvider, useCollection } from '@nocobase/client';
import { createApp } from '../createApp';

const Demo = () => {
  const collection = useCollection();
  return <pre>{JSON.stringify(collection.getField('username'), null, 2)}</pre>;
};

const Root = () => {
  return (
    <CollectionProvider name="users">
      <Demo />
    </CollectionProvider>
  );
};

export default createApp(Root);
