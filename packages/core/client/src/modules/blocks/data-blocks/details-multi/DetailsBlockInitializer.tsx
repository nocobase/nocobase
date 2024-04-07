import { TableOutlined } from '@ant-design/icons';
import React from 'react';
import { useSchemaInitializer, useSchemaInitializerItem } from '../../../../application';
import { useCollectionManager_deprecated } from '../../../../collection-manager';
import { DataBlockInitializer } from '../../../../schema-initializer/items/DataBlockInitializer';
import { Collection, CollectionFieldOptions } from '../../../../data-source/collection/Collection';
import { createDetailsWithPaginationUISchema } from './createDetailsWithPaginationUISchema';

export const DetailsBlockInitializer = ({
  filterCollections,
  onlyCurrentDataSource,
  hideSearch,
  componentType = 'Details',
  createBlockSchema,
  templateWrap,
  showAssociationFields,
  hideChildrenIfSingleCollection,
}: {
  filterCollections: (options: { collection?: Collection; associationField?: CollectionFieldOptions }) => boolean;
  onlyCurrentDataSource: boolean;
  hideSearch?: boolean;
  /**
   * 页面中的详情区块类型是 Details，弹窗中的详情区块类型是 ReadPrettyFormItem；
   * 虽然这里的命名现在看起来比较奇怪，但为了兼容旧版本的 template，暂时保留这个命名。
   */
  componentType?: 'Details' | 'ReadPrettyFormItem';
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
  hideChildrenIfSingleCollection?: boolean;
}) => {
  const { insert } = useSchemaInitializer();
  const { getCollection } = useCollectionManager_deprecated();
  const itemConfig = useSchemaInitializerItem();
  return (
    <DataBlockInitializer
      {...itemConfig}
      icon={<TableOutlined />}
      componentType={componentType}
      onCreateBlockSchema={async (options) => {
        if (createBlockSchema) {
          return createBlockSchema(options);
        }

        const { item } = options;
        const collection = getCollection(item.name, item.dataSource);
        const schema = createDetailsWithPaginationUISchema({
          collectionName: item.name,
          dataSource: item.dataSource,
          rowKey: collection.filterTargetKey || 'id',
          hideActionInitializer: !(
            (collection.template !== 'view' || collection?.writableView) &&
            collection.template !== 'sql'
          ),
        });
        insert(schema);
      }}
      onlyCurrentDataSource={!!onlyCurrentDataSource}
      hideSearch={hideSearch}
      filter={filterCollections}
      templateWrap={templateWrap}
      showAssociationFields={showAssociationFields}
      hideChildrenIfSingleCollection={hideChildrenIfSingleCollection}
    />
  );
};
