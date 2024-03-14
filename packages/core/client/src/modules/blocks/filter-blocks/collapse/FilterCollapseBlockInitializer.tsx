import { TableOutlined } from '@ant-design/icons';
import React from 'react';

import { useSchemaInitializer, useSchemaInitializerItem } from '../../../../application';
import { createCollapseBlockSchema } from '../../../../schema-initializer/utils';
import { DataBlockInitializer } from '../../../../schema-initializer/items/DataBlockInitializer';
import { Collection, CollectionFieldOptions } from '../../../../data-source';

export const FilterCollapseBlockInitializer = ({
  filterCollections,
  onlyCurrentDataSource,
  showChildren,
}: {
  filterCollections: (options: { collection?: Collection; associationField?: CollectionFieldOptions }) => boolean;
  onlyCurrentDataSource: boolean;
  showChildren?: boolean;
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
      filter={filterCollections}
      showChildren={showChildren}
    />
  );
};
