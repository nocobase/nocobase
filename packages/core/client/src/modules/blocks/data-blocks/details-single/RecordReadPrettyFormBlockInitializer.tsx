import { FormOutlined } from '@ant-design/icons';
import React from 'react';
import { SchemaInitializerItem, useSchemaInitializer, useSchemaInitializerItem } from '../../../../application';
import { useBlockAssociationContext, useBlockRequestContext } from '../../../../block-provider';
import { useCollection_deprecated } from '../../../../collection-manager';
import { useSchemaTemplateManager } from '../../../../schema-templates';
import {
  createReadPrettyFormBlockSchema,
  useRecordCollectionDataSourceItems,
} from '../../../../schema-initializer/utils';

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
  const { targetCollection } = itemConfig;
  const { insert } = useSchemaInitializer();
  const { getTemplateSchemaByMode } = useSchemaTemplateManager();
  const currentCollection = useCollection_deprecated();
  const collection = targetCollection || currentCollection;
  const association = useBlockAssociationContext();
  const { block } = useBlockRequestContext();
  const actionInitializers =
    block !== 'TableField' ? itemConfig.actionInitializers || 'ReadPrettyFormActionInitializers' : null;

  const templateWrap = (templateSchema, options) => {
    const { item } = options;
    if (item.template.componentName === 'ReadPrettyFormItem') {
      const blockSchema = createReadPrettyFormBlockSchema({
        actionInitializers,
        association,
        collection: collection.name,
        dataSource: collection.dataSource,
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
  };

  const createSingleDetailsSchema = async ({ item }) => {
    if (item.template) {
      const template = await getTemplateSchemaByMode(item);
      insert(templateWrap(template, { item }));
    } else {
      insert(
        createReadPrettyFormBlockSchema({
          actionInitializers,
          association,
          collection: item.name,
          dataSource: item.dataSource,
          action: 'get',
          useSourceId: '{{ useSourceIdFromParentRecord }}',
          useParams: '{{ useParamsFromRecord }}',
          settings: 'blockSettings:singleDataDetails',
        }),
      );
    }
  };

  return { createSingleDetailsSchema, templateWrap };
}
