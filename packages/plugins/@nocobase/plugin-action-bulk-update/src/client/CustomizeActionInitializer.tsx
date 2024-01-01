import React from 'react';
import { BlockInitializer, useCollectionV2, useSchemaInitializerItem } from '@nocobase/client';

export const CustomizeActionInitializer = () => {
  const collection = useCollectionV2();
  const itemConfig = useSchemaInitializerItem();

  const schema = {};
  if (collection && schema['x-acl-action']) {
    schema['x-acl-action'] = `${collection.name}:${schema['x-acl-action']}`;
    schema['x-decorator'] = 'ACLActionProvider';
  }

  return <BlockInitializer {...itemConfig} schema={schema} item={itemConfig} />;
};
