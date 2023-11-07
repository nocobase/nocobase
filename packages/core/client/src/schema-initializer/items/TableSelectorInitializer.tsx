import { FormOutlined } from '@ant-design/icons';
import React from 'react';

import { useCollection } from '../../collection-manager';
import { SchemaInitializer } from '../SchemaInitializer';
import { createTableSelectorSchema } from '../utils';

export const TableSelectorInitializer = (props) => {
  const { onCreateBlockSchema, componentType, createBlockSchema, insert, ...others } = props;
  const collection = useCollection();
  return (
    <SchemaInitializer.Item
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
