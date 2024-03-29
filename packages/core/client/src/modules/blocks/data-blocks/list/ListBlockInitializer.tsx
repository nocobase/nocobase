import { OrderedListOutlined } from '@ant-design/icons';
import React from 'react';
import { useSchemaInitializer, useSchemaInitializerItem } from '../../../../application';
import { useCollectionManager_deprecated } from '../../../../collection-manager';
import { createListBlockSchema } from './createListBlockSchema';
import { DataBlockInitializer } from '../../../../schema-initializer/items/DataBlockInitializer';
import { Collection, CollectionFieldOptions } from '../../../../data-source/collection/Collection';

export const ListBlockInitializer = ({
  filterCollections,
  onlyCurrentDataSource,
  hideSearch,
  createBlockSchema,
  componentType = 'FormItem',
  templateWrap,
  showAssociationFields,
}: {
  filterCollections: (options: { collection?: Collection; associationField?: CollectionFieldOptions }) => boolean;
  onlyCurrentDataSource: boolean;
  hideSearch?: boolean;
  createBlockSchema?: (options: any) => any;
  /**
   * 虽然这里的命名现在看起来比较奇怪，但为了兼容旧版本的 template，暂时保留这个命名。
   */
  componentType?: 'FormItem';
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
  const { getCollection } = useCollectionManager_deprecated();
  const { insert } = useSchemaInitializer();
  const itemConfig = useSchemaInitializerItem();
  return (
    <DataBlockInitializer
      {...itemConfig}
      icon={<OrderedListOutlined />}
      componentType={'List'}
      onCreateBlockSchema={async ({ item }) => {
        if (createBlockSchema) {
          return createBlockSchema({ item });
        }

        const collection = getCollection(item.name, item.dataSource);
        const schema = createListBlockSchema({
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
