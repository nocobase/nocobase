import React from 'react';
import { TableOutlined } from '@ant-design/icons';

import { DataBlockInitializer } from './DataBlockInitializer';
import { createCollapseBlockSchema } from '../utils';

export const FilterCollapseBlockInitializer = (props) => {
  const { insert } = props;
  return (
    <DataBlockInitializer
      {...props}
      icon={<TableOutlined />}
      componentType={'Collapse'}
      onCreateBlockSchema={async ({ item }) => {
        const schema = createCollapseBlockSchema({
          collection: item.name,
          // 与数据区块做区分
          blockType: 'filter',
        });
        insert(schema);
      }}
    />
  );
};
