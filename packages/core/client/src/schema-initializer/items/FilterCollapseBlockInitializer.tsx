import { TableOutlined } from '@ant-design/icons';
import React from 'react';

import { createCollapseBlockSchema } from '../utils';
import { DataBlockInitializer } from './DataBlockInitializer';
import { useSchemaInitializer } from '../../application';

export const FilterCollapseBlockInitializer = (props) => {
  const { item } = props;
  const { insert } = useSchemaInitializer();
  const items = item?.key === 'filterCollapseBlockInTableSelector' && [];

  return (
    <DataBlockInitializer
      {...props}
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
