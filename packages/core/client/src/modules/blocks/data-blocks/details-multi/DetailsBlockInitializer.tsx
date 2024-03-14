import { TableOutlined } from '@ant-design/icons';
import React from 'react';
import { useSchemaInitializer, useSchemaInitializerItem } from '../../../../application';
import { useCollectionManager_deprecated } from '../../../../collection-manager';
import { createDetailsBlockSchema } from '../../../../schema-initializer/utils';
import { DataBlockInitializer } from '../../../../schema-initializer/items/DataBlockInitializer';
import { Collection, CollectionFieldOptions } from '../../../../data-source/collection/Collection';

export const DetailsBlockInitializer = ({
  filterCollections,
  onlyCurrentDataSource,
  hideSearch,
  componentType = 'Details',
  createBlockSchema,
  templateWrap,
  showAssociationFields,
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
        const schema = createDetailsBlockSchema({
          collection: item.name,
          dataSource: item.dataSource,
          rowKey: collection.filterTargetKey || 'id',
          actionInitializers:
            (collection.template !== 'view' || collection?.writableView) &&
            collection.template !== 'sql' &&
            'detailsWithPaging:configureActions',
          settings: 'blockSettings:multiDataDetails',
        });
        insert(schema);
      }}
      onlyCurrentDataSource={!!onlyCurrentDataSource}
      hideSearch={hideSearch}
      filter={filterCollections}
      templateWrap={templateWrap}
      showAssociationFields={showAssociationFields}
    />
  );
};
