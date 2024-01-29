import { FormOutlined } from '@ant-design/icons';
import React from 'react';

import { SchemaInitializerItem, useSchemaInitializer, useSchemaInitializerItem } from '../../application';
import { useCollection } from '../../collection-manager';
import { createTableSelectorSchema } from '../utils';

export const TableSelectorInitializer = () => {
  const itemConfig = useSchemaInitializerItem();
  const { onCreateBlockSchema, componentType, createBlockSchema, ...others } = itemConfig;
  const { insert } = useSchemaInitializer();
  const collection = useCollection();
  return (
    <SchemaInitializerItem
      icon={<FormOutlined />}
      {...others}
      onClick={async ({ item }) => {
        insert(
          createTableSelectorSchema({
            rowKey: collection.filterTargetKey,
            collection: collection.name,
            dataSource: collection.dataSource,
          }),
        );
      }}
    />
  );
};
