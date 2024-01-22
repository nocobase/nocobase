import { TableOutlined } from '@ant-design/icons';
import React, { useCallback } from 'react';

import { useSchemaInitializer, useSchemaInitializerItem } from '../../application';
import { createCollapseBlockSchema } from '../utils';
import { DataBlockInitializer } from './DataBlockInitializer';

export const FilterCollapseBlockInitializer = () => {
  const itemConfig = useSchemaInitializerItem();
  const { insert } = useSchemaInitializer();

  return (
    <DataBlockInitializer
      {...itemConfig}
      icon={<TableOutlined />}
      componentType={'FilterCollapse'}
      isItem={itemConfig?.name === 'filterCollapseBlockInTableSelector'}
      onCreateBlockSchema={async ({ item }) => {
        const schema = createCollapseBlockSchema({
          dataSource: item.dataSource,
          collection: item.collectionName || item.name,
          // 与数据区块做区分
          blockType: 'filter',
        });
        insert(schema);
      }}
    />
  );
};
