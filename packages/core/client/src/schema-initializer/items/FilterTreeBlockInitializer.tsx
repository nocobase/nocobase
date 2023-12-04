import React from 'react';
import { FormOutlined } from '@ant-design/icons';
import { createTreeBlockSchema } from '../utils';
import { FilterBlockInitializer } from './FilterBlockInitializer';
import { useCollectionManager } from '../../collection-manager';

export const FilterTreeBlockInitializer = (props) => {
  const { insert } = props;
  const { getCollection } = useCollectionManager();
  return (
    <FilterBlockInitializer
      {...props}
      icon={<FormOutlined />}
      componentType={'FilterTree'}
      onCreateBlockSchema={async ({ item }) => {
        const collection = getCollection(item.name);
        const schema = createTreeBlockSchema({
          collection: item.name,
          rowKey: collection.filterTargetKey || 'id',
        });
        insert(schema);
      }}
    />
  );
};
