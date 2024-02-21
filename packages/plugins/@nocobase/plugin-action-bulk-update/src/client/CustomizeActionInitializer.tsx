import { BlockInitializer, useSchemaInitializerItem } from '@nocobase/client';
import React from 'react';

export const CustomizeActionInitializer = () => {
  const itemConfig = useSchemaInitializerItem();
  return <BlockInitializer {...itemConfig} item={itemConfig} />;
};
