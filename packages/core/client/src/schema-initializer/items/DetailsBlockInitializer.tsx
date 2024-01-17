import { TableOutlined } from '@ant-design/icons';
import React from 'react';
import { useCollectionManager } from '../../collection-manager';
import { createDetailsBlockSchema } from '../utils';
import { DataBlockInitializer } from './DataBlockInitializer';
import { useSchemaInitializer, useSchemaInitializerItem } from '../../application';

export const DetailsBlockInitializer = () => {
  const { insert } = useSchemaInitializer();
  const { getCollection } = useCollectionManager();
  const itemConfig = useSchemaInitializerItem();
  return (
    <DataBlockInitializer
      {...itemConfig}
      icon={<TableOutlined />}
      componentType={'Details'}
      onCreateBlockSchema={async ({ item }) => {
        const collection = getCollection(item.name, item.namespace);
        const schema = createDetailsBlockSchema({
          collection: item.name,
          namespace: item.namespace,
          rowKey: collection.filterTargetKey || 'id',
          actionInitializers:
            (collection.template !== 'view' || collection?.writableView) &&
            collection.template !== 'sql' &&
            'DetailsActionInitializers',
        });
        insert(schema);
      }}
    />
  );
};
