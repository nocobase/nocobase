import { TableOutlined } from '@ant-design/icons';
import React from 'react';
import { useSchemaInitializer, useSchemaInitializerItem } from '../../../../application';
import { useCollectionManager_deprecated } from '../../../../collection-manager';
import { createDetailsBlockSchema } from '../../../../schema-initializer/utils';
import { DataBlockInitializer } from '../../../../schema-initializer/items/DataBlockInitializer';

export const DetailsBlockInitializer = () => {
  const { insert } = useSchemaInitializer();
  const { getCollection } = useCollectionManager_deprecated();
  const itemConfig = useSchemaInitializerItem();
  return (
    <DataBlockInitializer
      {...itemConfig}
      icon={<TableOutlined />}
      componentType={'Details'}
      onCreateBlockSchema={async ({ item }) => {
        const collection = getCollection(item.name, item.dataSource);
        const schema = createDetailsBlockSchema({
          collection: item.name,
          dataSource: item.dataSource,
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
