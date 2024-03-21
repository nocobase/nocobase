import { FormOutlined } from '@ant-design/icons';
import React, { useCallback } from 'react';
import { SchemaInitializerItem, useSchemaInitializer, useSchemaInitializerItem } from '../../../../application';
import { useBlockAssociationContext } from '../../../../block-provider';
import { useCollection_deprecated } from '../../../../collection-manager';
import { useSchemaTemplateManager } from '../../../../schema-templates';
import { createFormBlockSchema, useRecordCollectionDataSourceItems } from '../../../../schema-initializer/utils';

/**
 * @deprecated
 */
export const RecordFormBlockInitializer = () => {
  const itemConfig = useSchemaInitializerItem();
  const { targetCollection, ...others } = itemConfig;
  const { insert } = useSchemaInitializer();
  const { getTemplateSchemaByMode } = useSchemaTemplateManager();
  const currentCollection = useCollection_deprecated();
  const collection = targetCollection || currentCollection;

  const { createEditFormBlock, templateWrap } = useCreateEditFormBlock();

  return (
    <SchemaInitializerItem
      icon={<FormOutlined />}
      {...others}
      onClick={async ({ item }) => {
        if (item.template) {
          const template = await getTemplateSchemaByMode(item);
          insert(templateWrap(template, { item }));
        } else {
          createEditFormBlock({ item });
        }
      }}
      items={useRecordCollectionDataSourceItems('FormItem', null, collection?.name)}
    />
  );
};

export function useCreateEditFormBlock() {
  const { insert } = useSchemaInitializer();
  const association = useBlockAssociationContext();

  const createEditFormBlock = useCallback(
    ({ item }) => {
      insert(
        createFormBlockSchema({
          association,
          collection: item.collectionName || item.name,
          dataSource: item.dataSource,
          action: 'get',
          useSourceId: '{{ useSourceIdFromParentRecord }}',
          useParams: '{{ useParamsFromRecord }}',
          actionInitializers: 'editForm:configureActions',
          settings: 'blockSettings:editForm',
        }),
      );
    },
    [association, insert],
  );

  const templateWrap = useCallback(
    (templateSchema, { item }) => {
      if (item.template.componentName === 'FormItem') {
        const blockSchema = createFormBlockSchema({
          association,
          collection: item.collectionName || item.name,
          dataSource: item.dataSource,
          action: 'get',
          useSourceId: '{{ useSourceIdFromParentRecord }}',
          useParams: '{{ useParamsFromRecord }}',
          actionInitializers: 'editForm:configureActions',
          template: templateSchema,
          settings: 'blockSettings:editForm',
        });
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

  return { createEditFormBlock, templateWrap };
}
