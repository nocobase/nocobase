import { FormOutlined } from '@ant-design/icons';
import React, { useCallback } from 'react';
import { useSchemaInitializer, useSchemaInitializerItem } from '../../../../application';
import { createFormBlockSchema } from '../../../../schema-initializer/utils';
import { DataBlockInitializer } from '../../../../schema-initializer/items/DataBlockInitializer';
import { Collection, CollectionFieldOptions } from '../../../../data-source/collection/Collection';

export const FormBlockInitializer = ({
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
  const { insert } = useSchemaInitializer();
  const itemConfig = useSchemaInitializerItem();
  const { isCusomeizeCreate } = itemConfig;
  const onCreateFormBlockSchema = useCallback(
    ({ item }) => {
      if (createBlockSchema) {
        return createBlockSchema({ item });
      }

      insert(
        createFormBlockSchema({
          collection: item.collectionName || item.name,
          dataSource: item.dataSource,
          isCusomeizeCreate,
          settings: 'blockSettings:createForm',
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

        const schema = createFormBlockSchema({
          isCusomeizeCreate,
          dataSource: item.dataSource,
          template: templateSchema,
          collection: item.name,
          settings: 'blockSettings:createForm',
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
    />
  );
};
