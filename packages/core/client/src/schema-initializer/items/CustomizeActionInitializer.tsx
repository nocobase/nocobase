import React from 'react';

import { BlockInitializer } from '.';
import { useCollectionV2, useSchemaInitializerItem } from '../../application';

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
