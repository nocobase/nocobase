import { TableOutlined } from '@ant-design/icons';
import { useSchemaInitializer, useSchemaInitializerItem } from '../../../../application/schema-initializer/context';
import { useCollectionManager_deprecated } from '../../../../collection-manager/hooks/useCollectionManager_deprecated';
import { DataBlockInitializer } from '../../../../schema-initializer/items/DataBlockInitializer';
import { createTableBlockSchema } from '../../../../schema-initializer/utils';
import React from 'react';

export const TableBlockInitializer = () => {
  const { insert } = useSchemaInitializer();
  const { getCollection } = useCollectionManager_deprecated();
  const itemConfig = useSchemaInitializerItem();
  return (
    <DataBlockInitializer
      {...itemConfig}
      icon={<TableOutlined />}
      componentType={'Table'}
      onCreateBlockSchema={async ({ item }) => {
        const collection = getCollection(item.name, item.dataSource);
        const schema = createTableBlockSchema({
          collection: item.name,
          dataSource: item.dataSource,
          rowKey: collection.filterTargetKey || 'id',
        });
        insert(schema);
      }}
    />
  );
};
