import { OrderedListOutlined } from '@ant-design/icons';
import React from 'react';
import { useSchemaInitializer, useSchemaInitializerItem } from '../../../../application';
import { useCollectionManager_deprecated } from '../../../../collection-manager';
import { createGridCardBlockSchema } from '../../../../schema-initializer/utils';
import { DataBlockInitializer } from '../../../../schema-initializer/items/DataBlockInitializer';

export const GridCardBlockInitializer = () => {
  const { insert } = useSchemaInitializer();
  const { getCollection } = useCollectionManager_deprecated();
  const itemConfig = useSchemaInitializerItem();
  return (
    <DataBlockInitializer
      {...itemConfig}
      icon={<OrderedListOutlined />}
      componentType={'GridCard'}
      onCreateBlockSchema={async ({ item }) => {
        const collection = getCollection(item.name, item.dataSource);
        const schema = createGridCardBlockSchema({
          collection: item.name,
          dataSource: item.dataSource,
          rowKey: collection.filterTargetKey || 'id',
          settings: 'blockSettings:gridCard',
        });
        insert(schema);
      }}
    />
  );
};
