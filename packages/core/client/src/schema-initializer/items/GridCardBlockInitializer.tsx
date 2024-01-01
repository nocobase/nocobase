import React from 'react';
import { OrderedListOutlined } from '@ant-design/icons';
import { createGridCardBlockSchema } from '../utils';
import { DataBlockInitializer } from './DataBlockInitializer';
import { useCollectionManagerV2, useSchemaInitializer, useSchemaInitializerItem } from '../../application';

export const GridCardBlockInitializer = () => {
  const { insert } = useSchemaInitializer();
  const cm = useCollectionManagerV2();
  const itemConfig = useSchemaInitializerItem();
  return (
    <DataBlockInitializer
      {...itemConfig}
      icon={<OrderedListOutlined />}
      componentType={'GridCard'}
      onCreateBlockSchema={async ({ item }) => {
        const collection = cm.getCollection(item.name);
        const schema = createGridCardBlockSchema({
          collection: item.name,
          rowKey: collection.filterTargetKey || 'id',
        });
        insert(schema);
      }}
    />
  );
};
