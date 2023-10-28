import { TableOutlined } from '@ant-design/icons';
import React from 'react';

import { createCollapseBlockSchema } from '../utils';
import { DataBlockInitializer } from './DataBlockInitializer';
import { useSchemaInitializer, useSchemaInitializerItem } from '../../application';

export const FilterCollapseBlockInitializer = () => {
  const itemConfig = useSchemaInitializerItem();
  const { insert } = useSchemaInitializer();
  const items = itemConfig?.key === 'filterCollapseBlockInTableSelector' && [];

  return (
    <DataBlockInitializer
      {...itemConfig}
      icon={<TableOutlined />}
      componentType={'FilterCollapse'}
      onCreateBlockSchema={async ({ item }) => {
        const schema = createCollapseBlockSchema({
          collection: item.name,
          // 与数据区块做区分
          blockType: 'filter',
        });
        insert(schema);
      }}
      items={items}
    />
  );
};
