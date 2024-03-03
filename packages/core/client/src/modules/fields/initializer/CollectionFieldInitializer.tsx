import { ISchema } from '@formily/react';
import React from 'react';

import { InitializerWithSwitch } from '../../../schema-initializer/items/InitializerWithSwitch';
import { useSchemaInitializerItem } from '../../../application';

export const CollectionFieldInitializer = () => {
  const schema: ISchema = {};
  const itemConfig = useSchemaInitializerItem();
  return <InitializerWithSwitch {...itemConfig} item={itemConfig} schema={schema} type={'x-collection-field'} />;
};
