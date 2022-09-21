import React from 'react';
import { BranchesOutlined } from '@ant-design/icons';

import { DataBlockInitializer } from './DataBlockInitializer';
import { createTreeBlockSchema } from '../utils';

export const TreeBlockInitializer = (props) => {
  const { insert } = props;
  return (
    <DataBlockInitializer
      {...props}
      icon={<BranchesOutlined />}
      componentType={'Tree'}
      onCreateBlockSchema={async ({ item }) => {
        const schema = createTreeBlockSchema({
          collection: item.name,
        });
        insert(schema);
      }}
    />
  );
};
