import React from 'react';

import { InitializerWithSwitch } from './InitializerWithSwitch';
import { useSchemaInitializerItem } from '../../application';

export const ActionInitializer = (props) => {
  const itemConfig = useSchemaInitializerItem();
  return <InitializerWithSwitch {...itemConfig} {...props} item={itemConfig} type={'x-action'} />;
};
