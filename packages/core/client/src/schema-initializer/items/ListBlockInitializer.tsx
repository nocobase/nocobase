import { OrderedListOutlined } from '@ant-design/icons';
import React from 'react';
import { useSchemaInitializer, useSchemaInitializerItem } from '../../application';
import { useCollectionManager } from '../../collection-manager';
import { createListBlockSchema } from '../utils';
import { DataBlockInitializer } from './DataBlockInitializer';

export const ListBlockInitializer = () => {
  const { getCollection } = useCollectionManager();
  const { insert } = useSchemaInitializer();
  const itemConfig = useSchemaInitializerItem();
  return (
    <DataBlockInitializer
      {...itemConfig}
      icon={<OrderedListOutlined />}
      componentType={'List'}
      onCreateBlockSchema={async ({ item }) => {
        const collection = getCollection(item.name);
        const schema = createListBlockSchema({
          collection: item.name,
          rowKey: collection.filterTargetKey || 'id',
          settings: 'blockSettings:list',
        });
        insert(schema);
      }}
    />
  );
};
