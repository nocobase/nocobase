import { FormOutlined } from '@ant-design/icons';
import React from 'react';

import { createTableSelectorSchema } from '../utils';
import {
  SchemaInitializerItem,
  useCollectionV2,
  useSchemaInitializer,
  useSchemaInitializerItem,
} from '../../application';

export const TableSelectorInitializer = () => {
  const itemConfig = useSchemaInitializerItem();
  const { onCreateBlockSchema, componentType, createBlockSchema, ...others } = itemConfig;
  const { insert } = useSchemaInitializer();
  const collection = useCollectionV2();
  return (
    <SchemaInitializerItem
      icon={<FormOutlined />}
      {...others}
      onClick={async ({ item }) => {
        insert(
          createTableSelectorSchema({
            rowKey: collection.filterTargetKey,
            collection: collection.name,
            resource: collection.name,
          }),
        );
      }}
    />
  );
};
