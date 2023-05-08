import React from 'react';

import { BlockInitializer } from '.';
import { useCollection } from '../../collection-manager';

export const CustomizeActionInitializer = (props) => {
  const collection = useCollection();
  const schema = {};
  if (collection && schema['x-acl-action']) {
    schema['x-acl-action'] = `${collection.name}:${schema['x-acl-action']}`;
    schema['x-decorator'] = 'ACLActionProvider';
  }
  return <BlockInitializer {...props} schema={schema} />;
};
