import { TableOutlined } from '@ant-design/icons';
import React from 'react';
import { useSchemaInitializer, useSchemaInitializerItem } from '../../application';
import { useCollectionManager } from '../../collection-manager';
import { createDetailsBlockSchema } from '../utils';
import { DataBlockInitializer } from './DataBlockInitializer';

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
        const collection = getCollection(item.name);
        const schema = createDetailsBlockSchema({
          collection: item.name,
          rowKey: collection.filterTargetKey || 'id',
          actionInitializers:
            (collection.template !== 'view' || collection?.writableView) &&
            collection.template !== 'sql' &&
            'DetailsActionInitializers',
          settings: 'blockSettings:multiDataDetails',
        });
        insert(schema);
      }}
    />
  );
};
