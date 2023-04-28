import React from 'react';
import { OrderedListOutlined } from '@ant-design/icons';
import { createCardListBlockSchema, createListBlockSchema } from '../utils';
import { DataBlockInitializer } from './DataBlockInitializer';
import { useCollectionManager } from '../../collection-manager';

export const CardListBlockInitializer = (props) => {
  const { insert } = props;
  const { getCollection } = useCollectionManager();
  return (
    <DataBlockInitializer
      {...props}
      icon={<OrderedListOutlined />}
      componentType={'CardList'}
      onCreateBlockSchema={async ({ item }) => {
        const collection = getCollection(item.name);
        const schema = createCardListBlockSchema({
          collection: item.name,
          rowKey: collection.filterTargetKey || 'id',
        });
        insert(schema);
      }}
    />
  );
};
