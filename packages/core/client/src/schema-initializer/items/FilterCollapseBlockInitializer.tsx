import { TableOutlined } from '@ant-design/icons';
import React from 'react';

import { createCollapseBlockSchema } from '../utils';
import { DataBlockInitializer } from './DataBlockInitializer';

export const FilterCollapseBlockInitializer = (props) => {
  const { insert, item } = props;
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
