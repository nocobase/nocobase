import React from 'react';
import { TableOutlined } from '@ant-design/icons';

import { useCollectionManager } from '../../collection-manager';
import { DataBlockInitializer } from './DataBlockInitializer';
import { createTableBlockSchema } from '../utils';

export const FilterTableBlockInitializer = (props) => {
  const { insert } = props;
  const { getCollection } = useCollectionManager();
  return (
    <DataBlockInitializer
      {...props}
      icon={<TableOutlined />}
      componentType={'FilterTable'}
      onCreateBlockSchema={async ({ item }) => {
        const collection = getCollection(item.name);
        const schema = createTableBlockSchema({
          collection: item.name,
          rowKey: collection.filterTargetKey || 'id',
          TableBlockDesigner: 'TableV2.FilterDesigner',
          tableColumnInitializers: 'FilterTableColumnInitializers',
          tableActionInitializers: 'FilterTableActionInitializers',
          rowSelection: {
            type: 'radio',
          },
          noAction: true,
          // 与数据区块做区分
          blockType: 'filter',
          pageSize: 10,
        });
        insert(schema);
      }}
    />
  );
};
