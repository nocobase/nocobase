import { FormOutlined } from '@ant-design/icons';
import React, { useCallback } from 'react';
import { SchemaInitializerItem, useSchemaInitializer, useSchemaInitializerItem } from '../../../../application';
import { useBlockAssociationContext } from '../../../../block-provider';
import { useCollection_deprecated } from '../../../../collection-manager';
import { useRecordCollectionDataSourceItems } from '../../../../schema-initializer/utils';
import { useSchemaTemplateManager } from '../../../../schema-templates';
import { createDetailsUISchema } from './createDetailsUISchema';

export const RecordReadPrettyFormBlockInitializer = () => {
  const itemConfig = useSchemaInitializerItem();
  const { icon = true, targetCollection, ...others } = itemConfig;
  const currentCollection = useCollection_deprecated();
  const collection = targetCollection || currentCollection;
  const { createSingleDetailsSchema } = useCreateSingleDetailsSchema();

  return (
    <SchemaInitializerItem
      icon={icon && <FormOutlined />}
      {...others}
      onClick={(options) => createSingleDetailsSchema(options)}
      items={useRecordCollectionDataSourceItems('ReadPrettyFormItem', null, collection?.name)}
    />
  );
};

export function useCreateSingleDetailsSchema() {
  const { insert } = useSchemaInitializer();
  const { getTemplateSchemaByMode } = useSchemaTemplateManager();
  const association = useBlockAssociationContext();

  const templateWrap = useCallback(
    (templateSchema, options) => {
      const { item } = options;
      if (item.template.componentName === 'ReadPrettyFormItem') {
        const blockSchema = createDetailsUISchema(
          association
            ? {
                association,
                dataSource: item.dataSource,
                templateSchema: templateSchema,
                isCurrent: true,
              }
            : {
                collectionName: item.collectionName || item.name,
                dataSource: item.dataSource,
                templateSchema: templateSchema,
              },
        );
        if (item.mode === 'reference') {
          blockSchema['x-template-key'] = item.template.key;
        }
        return blockSchema;
      } else {
        return templateSchema;
      }
    },
    [association],
  );

  const createSingleDetailsSchema = useCallback(
    async ({ item }) => {
      if (item.template) {
        const template = await getTemplateSchemaByMode(item);
        insert(templateWrap(template, { item }));
      } else {
        insert(
          createDetailsUISchema(
            association
              ? {
                  association,
                  dataSource: item.dataSource,
                  isCurrent: true,
                }
              : {
                  collectionName: item.collectionName || item.name,
                  dataSource: item.dataSource,
                },
          ),
        );
      }
    },
    [association, getTemplateSchemaByMode, insert, templateWrap],
  );

  return { createSingleDetailsSchema, templateWrap };
}
