import React, { FC } from 'react';

import { SelfCollectionFieldsProps, getInitializerItemsByFields, useCollectionFieldContext } from '../utils';
import { SchemaInitializerItemGroup } from '../../../application/schema-initializer';

export const SelfFields: FC<SelfCollectionFieldsProps> = (props) => {
  const callbackContext = useCollectionFieldContext();
  const { t, collection } = callbackContext;
  const fields = collection.getFields();
  const children = getInitializerItemsByFields(props, fields, callbackContext);

  return <SchemaInitializerItemGroup title={t('Display fields')}>{children}</SchemaInitializerItemGroup>;
};
