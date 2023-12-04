import React from 'react';

import { BlockInitializer } from '.';
import { useCollection } from '../../collection-manager';
import { useSchemaInitializerItem } from '../../application';

export const CustomizeActionInitializer = () => {
  const collection = useCollection();
  const itemConfig = useSchemaInitializerItem();

  const schema = {};
  if (collection && schema['x-acl-action']) {
    schema['x-acl-action'] = `${collection.name}:${schema['x-acl-action']}`;
    schema['x-decorator'] = 'ACLActionProvider';
  }

  return <BlockInitializer {...itemConfig} schema={schema} item={itemConfig} />;
};
