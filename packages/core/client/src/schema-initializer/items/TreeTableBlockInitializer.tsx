import React from 'react';
import { TableOutlined } from '@ant-design/icons';

import { useCollectionManager } from '../../collection-manager';
import { DataBlockInitializer } from './DataBlockInitializer';
import { createTreeTableBlockSchema } from '../utils';

export const TreeTableBlockInitializer = (props) => {
  const { insert } = props;
  const { getCollection } = useCollectionManager();
  return (
    <DataBlockInitializer
      {...props}
      icon={<TableOutlined />}
      componentType={'TreeTable'}
      onCreateBlockSchema={async ({ item }) => {
        const collection = getCollection(item.name);
        const schema = createTreeTableBlockSchema({
          collection: item.name,
          rowKey: collection.filterTargetKey || 'id',
        });
        insert(schema);
      }}
    />
  );
};
