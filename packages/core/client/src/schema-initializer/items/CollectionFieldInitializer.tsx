import { ISchema } from '@formily/react';
import React from 'react';

import { InitializerWithSwitch } from './InitializerWithSwitch';
import { useSchemaInitializerItem } from '../../application';

export const CollectionFieldInitializer = () => {
  const schema: ISchema = {};
  const itemConfig = useSchemaInitializerItem();
  return <InitializerWithSwitch {...itemConfig} item={itemConfig} schema={schema} type={'x-collection-field'} />;
};
