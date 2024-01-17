import React from 'react';
import { OrderedListOutlined } from '@ant-design/icons';
import { createListBlockSchema } from '../utils';
import { DataBlockInitializer } from './DataBlockInitializer';
import { useCollectionManager } from '../../collection-manager';
import { useSchemaInitializer, useSchemaInitializerItem } from '../../application';

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
        const collection = getCollection(item.name, item.namespace);
        const schema = createListBlockSchema({
          collection: item.name,
          namespace: item.namespace,
          rowKey: collection.filterTargetKey || 'id',
        });
        insert(schema);
      }}
    />
  );
};
