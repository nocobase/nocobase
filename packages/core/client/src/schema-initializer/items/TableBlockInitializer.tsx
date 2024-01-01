import React from 'react';
import { TableOutlined } from '@ant-design/icons';
import { DataBlockInitializer } from './DataBlockInitializer';
import { createTableBlockSchema } from '../utils';
import { useCollectionManagerV2, useSchemaInitializer, useSchemaInitializerItem } from '../../application';

export const TableBlockInitializer = () => {
  const { insert } = useSchemaInitializer();
  const cm = useCollectionManagerV2();
  const itemConfig = useSchemaInitializerItem();
  return (
    <DataBlockInitializer
      {...itemConfig}
      icon={<TableOutlined />}
      componentType={'Table'}
      onCreateBlockSchema={async ({ item }) => {
        const collection = cm.getCollection(item.name);
        const schema = createTableBlockSchema({
          collection: item.name,
          rowKey: collection.filterTargetKey || 'id',
        });
        insert(schema);
      }}
    />
  );
};
