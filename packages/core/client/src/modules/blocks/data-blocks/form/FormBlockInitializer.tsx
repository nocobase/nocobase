import { FormOutlined } from '@ant-design/icons';
import React, { useCallback } from 'react';
import { useSchemaInitializer, useSchemaInitializerItem } from '../../../../application';
import { Collection, CollectionFieldOptions } from '../../../../data-source/collection/Collection';
import { DataBlockInitializer } from '../../../../schema-initializer/items/DataBlockInitializer';
import { createCreateFormBlockUISchema } from './createCreateFormBlockUISchema';

export const FormBlockInitializer = ({
  filterCollections,
  onlyCurrentDataSource,
  hideSearch,
  createBlockSchema,
  componentType = 'FormItem',
  templateWrap,
  showAssociationFields,
  hideChildrenIfSingleCollection,
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
  hideChildrenIfSingleCollection?: boolean;
}) => {
  const { insert } = useSchemaInitializer();
  const itemConfig = useSchemaInitializerItem();
  const { isCusomeizeCreate } = itemConfig;
  const onCreateFormBlockSchema = useCallback(
    ({ item }) => {
      if (createBlockSchema) {
        return createBlockSchema({ item });
      }

      insert(
        createCreateFormBlockUISchema({
          collectionName: item.collectionName || item.name,
          dataSource: item.dataSource,
          isCusomeizeCreate,
        }),
      );
    },
    [createBlockSchema, insert, isCusomeizeCreate],
  );

  return (
    <DataBlockInitializer
      {...itemConfig}
      icon={<FormOutlined />}
      componentType={componentType}
      templateWrap={(templateSchema, { item }) => {
        if (templateWrap) {
          return templateWrap(templateSchema, { item });
        }

        const schema = createCreateFormBlockUISchema({
          isCusomeizeCreate,
          dataSource: item.dataSource,
          templateSchema: templateSchema,
          collectionName: item.name,
        });
        if (item.template && item.mode === 'reference') {
          schema['x-template-key'] = item.template.key;
        }
        return schema;
      }}
      onCreateBlockSchema={onCreateFormBlockSchema}
      filter={filterCollections}
      onlyCurrentDataSource={onlyCurrentDataSource}
      hideSearch={hideSearch}
      showAssociationFields={showAssociationFields}
      hideChildrenIfSingleCollection={hideChildrenIfSingleCollection}
    />
  );
};
