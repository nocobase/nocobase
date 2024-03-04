import { TableOutlined } from '@ant-design/icons';
import React from 'react';

import { useSchemaInitializer, useSchemaInitializerItem } from '../../../../application';
import { createCollapseBlockSchema } from '../../../../schema-initializer/utils';
import { DataBlockInitializer } from '../../../../schema-initializer/items/DataBlockInitializer';
import { Collection } from '../../../../data-source';

export const FilterCollapseBlockInitializer = ({
  filterMenuItemChildren,
  onlyCurrentDataSource,
}: {
  filterMenuItemChildren: (collection: Collection) => boolean;
  onlyCurrentDataSource: boolean;
}) => {
  const itemConfig = useSchemaInitializerItem();
  const { insert } = useSchemaInitializer();

  return (
    <DataBlockInitializer
      {...itemConfig}
      onlyCurrentDataSource={onlyCurrentDataSource}
      icon={<TableOutlined />}
      componentType={'FilterCollapse'}
      onCreateBlockSchema={async ({ item }) => {
        const schema = createCollapseBlockSchema({
          dataSource: item.dataSource,
          collection: item.collectionName || item.name,
          // 与数据区块做区分
          blockType: 'filter',
        });
        insert(schema);
      }}
      filter={filterMenuItemChildren}
    />
  );
};
