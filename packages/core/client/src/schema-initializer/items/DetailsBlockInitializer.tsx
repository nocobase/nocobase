import { TableOutlined } from '@ant-design/icons';
import React from 'react';
import { createDetailsBlockSchema } from '../utils';
import { DataBlockInitializer } from './DataBlockInitializer';
import { useCollectionManagerV2, useSchemaInitializer, useSchemaInitializerItem } from '../../application';

export const DetailsBlockInitializer = () => {
  const { insert } = useSchemaInitializer();
  const cm = useCollectionManagerV2();
  const itemConfig = useSchemaInitializerItem();
  return (
    <DataBlockInitializer
      {...itemConfig}
      icon={<TableOutlined />}
      componentType={'Details'}
      onCreateBlockSchema={async ({ item }) => {
        const collection = cm.getCollection(item.name);
        const schema = createDetailsBlockSchema({
          collection: item.name,
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
