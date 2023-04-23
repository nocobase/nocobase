import React from 'react';
import { OrderedListOutlined } from '@ant-design/icons';
import { DataBlockInitializer, useCollectionManager } from '@nocobase/client';
import { createDetailsListBlockSchema } from '../utils';

export const DetailsListBlockInitializer = (props) => {
  const { insert } = props;
  const { getCollection } = useCollectionManager();
  return (
    <DataBlockInitializer
      {...props}
      icon={<OrderedListOutlined />}
      componentType={'DetailsList'}
      onCreateBlockSchema={async ({ item }) => {
        const collection = getCollection(item.name);
        const schema = createDetailsListBlockSchema({
          collection: item.name,
          rowKey: collection.filterTargetKey || 'id',
          actionInitializers: collection.template !== 'view' && 'DetailsActionInitializers',
        });
        insert(schema);
      }}
    />
  );
};
