import { FormOutlined } from '@ant-design/icons';
import React from 'react';

import { useCollection } from '../../collection-manager';
import { createTableSelectorSchema } from '../utils';
import { SchemaInitializerItem } from '../../application';

export const TableSelectorInitializer = (props) => {
  const { onCreateBlockSchema, componentType, createBlockSchema, insert, ...others } = props;
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
            resource: collection.name,
          }),
        );
      }}
    />
  );
};
