import { OrderedListOutlined } from '@ant-design/icons';
import React from 'react';
import { useSchemaInitializer, useSchemaInitializerItem } from '../../application';
import { useCollectionManager } from '../../collection-manager';
import { createGridCardBlockSchema } from '../utils';
import { DataBlockInitializer } from './DataBlockInitializer';

export const GridCardBlockInitializer = () => {
  const { insert } = useSchemaInitializer();
  const { getCollection } = useCollectionManager();
  const itemConfig = useSchemaInitializerItem();
  return (
    <DataBlockInitializer
      {...itemConfig}
      icon={<OrderedListOutlined />}
      componentType={'GridCard'}
      onCreateBlockSchema={async ({ item }) => {
        const collection = getCollection(item.name);
        const schema = createGridCardBlockSchema({
          collection: item.name,
          rowKey: collection.filterTargetKey || 'id',
          settings: 'gridCardBlockSettings',
        });
        insert(schema);
      }}
    />
  );
};
