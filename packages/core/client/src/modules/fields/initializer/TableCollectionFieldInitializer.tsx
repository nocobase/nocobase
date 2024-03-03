import React from 'react';
import { ISchema } from '@formily/react';

import { InitializerWithSwitch } from '../../../schema-initializer/items/InitializerWithSwitch';
import { useSchemaInitializerItem } from '../../../application';

export const TableCollectionFieldInitializer = () => {
  const schema: ISchema = {};
  const itemConfig = useSchemaInitializerItem();
  return <InitializerWithSwitch {...itemConfig} schema={schema} item={itemConfig} type={'x-collection-field'} />;
};
