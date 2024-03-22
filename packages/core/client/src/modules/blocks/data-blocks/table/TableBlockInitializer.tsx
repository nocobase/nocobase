import { TableOutlined } from '@ant-design/icons';
import { useSchemaInitializer, useSchemaInitializerItem } from '../../../../application/schema-initializer/context';
import { useCollectionManager_deprecated } from '../../../../collection-manager/hooks/useCollectionManager_deprecated';
import { DataBlockInitializer } from '../../../../schema-initializer/items/DataBlockInitializer';
import React from 'react';
import { Collection, CollectionFieldOptions } from '../../../../data-source/collection/Collection';
import { createTableBlockUISchema } from './createTableBlockUISchema';

export const TableBlockInitializer = ({
  filterCollections,
  onlyCurrentDataSource,
  hideSearch,
  createBlockSchema,
  templateWrap,
  showAssociationFields,
}: {
  filterCollections: (options: { collection?: Collection; associationField?: CollectionFieldOptions }) => boolean;
  onlyCurrentDataSource: boolean;
  hideSearch?: boolean;
  createBlockSchema?: (options: any) => any;
  templateWrap?: (
    templateSchema: any,
    {
      item,
    }: {
      item: any;
    },
  ) => any;
  showAssociationFields?: boolean;
}) => {
  const { insert } = useSchemaInitializer();
  const { getCollection } = useCollectionManager_deprecated();
  const itemConfig = useSchemaInitializerItem();
  return (
    <DataBlockInitializer
      {...itemConfig}
      icon={<TableOutlined />}
      componentType={'Table'}
      onCreateBlockSchema={async ({ item }) => {
        if (createBlockSchema) {
          return createBlockSchema({ item });
        }

        const collection = getCollection(item.name, item.dataSource);
        const schema = createTableBlockUISchema({
          collectionName: item.name,
          dataSource: item.dataSource,
          rowKey: collection.filterTargetKey || 'id',
        });
        insert(schema);
      }}
      onlyCurrentDataSource={onlyCurrentDataSource}
      hideSearch={hideSearch}
      filter={filterCollections}
      showAssociationFields={showAssociationFields}
    />
  );
};
