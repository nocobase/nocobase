import React from 'react';

import { BlockInitializer } from '.';
import { useSchemaInitializerItem } from '../../application';

export const CustomizeActionInitializer = () => {
  const itemConfig = useSchemaInitializerItem();
  return <BlockInitializer {...itemConfig} item={itemConfig} />;
};
