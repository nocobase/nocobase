import React from 'react';
import { TableOutlined } from '@ant-design/icons';
import { useCollectionManager } from '../../collection-manager';
import { DataBlockInitializer } from './DataBlockInitializer';
import { createTableBlockSchema } from '../utils';
import { useSchemaInitializer, useSchemaInitializerItem } from '../../application';

export const TableBlockInitializer = () => {
  const { insert } = useSchemaInitializer();
  const { getCollection } = useCollectionManager();
  const itemConfig = useSchemaInitializerItem();
  return (
    <DataBlockInitializer
      {...itemConfig}
      icon={<TableOutlined />}
      componentType={'Table'}
      onCreateBlockSchema={async ({ item }) => {
        const collection = getCollection(item.name, item.namespace);
        const schema = createTableBlockSchema({
          collection: item.name,
          namespace: item.namespace,
          rowKey: collection.filterTargetKey || 'id',
        });
        insert(schema);
      }}
    />
  );
};
