import React from 'react';
import { TableOutlined } from '@ant-design/icons';
import { useCollectionManager } from '../../collection-manager';
import { DataBlockInitializer } from './DataBlockInitializer';
import { createTableBlockSchema } from '../utils';
import { useSchemaInitializerV2 } from '../../application';

export const TableBlockInitializer = (props) => {
  const { insert } = useSchemaInitializerV2();
  const { getCollection } = useCollectionManager();
  return (
    <DataBlockInitializer
      {...props}
      icon={<TableOutlined />}
      componentType={'Table'}
      onCreateBlockSchema={async ({ item }) => {
        const collection = getCollection(item.name);
        const schema = createTableBlockSchema({
          collection: item.name,
          rowKey: collection.filterTargetKey || 'id',
        });
        insert(schema);
      }}
    />
  );
};
