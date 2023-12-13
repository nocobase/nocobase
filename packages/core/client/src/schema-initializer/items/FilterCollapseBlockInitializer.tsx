import { TableOutlined } from '@ant-design/icons';
import React from 'react';

import { useSchemaInitializer, useSchemaInitializerItem } from '../../application';
import { createCollapseBlockSchema } from '../utils';
import { DataBlockInitializer } from './DataBlockInitializer';

export const FilterCollapseBlockInitializer = () => {
  const itemConfig = useSchemaInitializerItem();
  const { insert } = useSchemaInitializer();
  const items = itemConfig?.name === 'filterCollapseBlockInTableSelector' ? [] : undefined;

  return (
    <DataBlockInitializer
      {...itemConfig}
      icon={<TableOutlined />}
      componentType={'FilterCollapse'}
      onCreateBlockSchema={async ({ item }) => {
        const schema = createCollapseBlockSchema({
          collection: item.collectionName || item.name,
          // 与数据区块做区分
          blockType: 'filter',
        });
        insert(schema);
      }}
      items={items}
    />
  );
};
