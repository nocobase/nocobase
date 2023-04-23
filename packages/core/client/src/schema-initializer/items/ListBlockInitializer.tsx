import React from 'react';
import { OrderedListOutlined } from '@ant-design/icons';
import { DataBlockInitializer, useCollectionManager } from '@nocobase/client';
import { createListBlockSchema } from '../utils';

export const ListBlockInitializer = (props) => {
  const { insert } = props;
  const { getCollection } = useCollectionManager();
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
          actionInitializers: collection.template !== 'view' && 'DetailsActionInitializers',
        });
        insert(schema);
      }}
    />
  );
};
