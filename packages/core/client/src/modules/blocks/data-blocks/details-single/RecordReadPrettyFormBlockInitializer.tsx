import { FormOutlined } from '@ant-design/icons';
import React, { useCallback } from 'react';
import { SchemaInitializerItem, useSchemaInitializer, useSchemaInitializerItem } from '../../../../application';
import { useBlockAssociationContext, useBlockRequestContext } from '../../../../block-provider';
import { useCollection_deprecated } from '../../../../collection-manager';
import { useSchemaTemplateManager } from '../../../../schema-templates';
import { createDetailsBlockSchema, useRecordCollectionDataSourceItems } from '../../../../schema-initializer/utils';

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
  const itemConfig = useSchemaInitializerItem();
  const { insert } = useSchemaInitializer();
  const { getTemplateSchemaByMode } = useSchemaTemplateManager();
  const association = useBlockAssociationContext();
  const { block } = useBlockRequestContext();
  const actionInitializers =
    block !== 'TableField' ? itemConfig.actionInitializers || 'details:configureActions' : null;

  const templateWrap = useCallback(
    (templateSchema, options) => {
      const { item } = options;
      if (item.template.componentName === 'ReadPrettyFormItem') {
        const blockSchema = createDetailsBlockSchema({
          actionInitializers,
          association,
          collection: item.collectionName || item.name,
          dataSource: item.dataSource,
          action: 'get',
          useSourceId: '{{ useSourceIdFromParentRecord }}',
          useParams: '{{ useParamsFromRecord }}',
          template: templateSchema,
          settings: 'blockSettings:singleDataDetails',
        });
        if (item.mode === 'reference') {
          blockSchema['x-template-key'] = item.template.key;
        }
        return blockSchema;
      } else {
        return templateSchema;
      }
    },
    [actionInitializers, association],
  );

  const createSingleDetailsSchema = useCallback(
    async ({ item }) => {
      if (item.template) {
        const template = await getTemplateSchemaByMode(item);
        insert(templateWrap(template, { item }));
      } else {
        insert(
          createDetailsBlockSchema({
            actionInitializers,
            association,
            collection: item.collectionName || item.name,
            dataSource: item.dataSource,
            action: 'get',
            useSourceId: '{{ useSourceIdFromParentRecord }}',
            useParams: '{{ useParamsFromRecord }}',
            settings: 'blockSettings:singleDataDetails',
          }),
        );
      }
    },
    [actionInitializers, association, getTemplateSchemaByMode, insert, templateWrap],
  );

  return { createSingleDetailsSchema, templateWrap };
}
