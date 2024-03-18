import React from 'react';
import { InitializerWithSwitch, useSchemaInitializerItem } from '@nocobase/client';
import { ISchema } from '@formily/react';

export const CollectionFieldInitializer = () => {
  const schema: ISchema = {};
  const itemConfig = useSchemaInitializerItem();
  return <InitializerWithSwitch {...itemConfig} item={itemConfig} schema={schema} type={'name'} />;
};
