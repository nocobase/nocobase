import React from 'react';
import { BlockInitializer, useCollection_deprecated, useSchemaInitializerItem } from '@nocobase/client';

export const CustomizeActionInitializer = () => {
  const collection = useCollection_deprecated();
  const itemConfig = useSchemaInitializerItem();

  const schema = {};
  if (collection && schema['x-acl-action']) {
    schema['x-acl-action'] = `${collection.name}:${schema['x-acl-action']}`;
    schema['x-decorator'] = 'ACLActionProvider';
  }

  return <BlockInitializer {...itemConfig} schema={schema} item={itemConfig} />;
};
