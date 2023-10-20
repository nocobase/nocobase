import React from 'react';
import { OrderedListOutlined } from '@ant-design/icons';
import { createListBlockSchema } from '../utils';
import { DataBlockInitializer } from './DataBlockInitializer';
import { useCollectionManager } from '../../collection-manager';
import { useSchemaInitializerV2 } from '../../application';

export const ListBlockInitializer = (props) => {
  const { getCollection } = useCollectionManager();
  const { insert } = useSchemaInitializerV2();
  return (
    <DataBlockInitializer
      {...props}
      icon={<OrderedListOutlined />}
      componentType={'List'}
      onCreateBlockSchema={async ({ item }) => {
        const collection = getCollection(item.name);
        const schema = createListBlockSchema({
          collection: item.name,
          rowKey: collection.filterTargetKey || 'id',
        });
        insert(schema);
      }}
    />
  );
};
