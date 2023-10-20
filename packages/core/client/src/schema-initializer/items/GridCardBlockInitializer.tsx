import React from 'react';
import { OrderedListOutlined } from '@ant-design/icons';
import { createGridCardBlockSchema } from '../utils';
import { DataBlockInitializer } from './DataBlockInitializer';
import { useCollectionManager } from '../../collection-manager';
import { useSchemaInitializerV2 } from '../../application';

export const GridCardBlockInitializer = (props) => {
  const { insert } = useSchemaInitializerV2();
  const { getCollection } = useCollectionManager();
  return (
    <DataBlockInitializer
      {...props}
      icon={<OrderedListOutlined />}
      componentType={'GridCard'}
      onCreateBlockSchema={async ({ item }) => {
        const collection = getCollection(item.name);
        const schema = createGridCardBlockSchema({
          collection: item.name,
          rowKey: collection.filterTargetKey || 'id',
        });
        insert(schema);
      }}
    />
  );
};
