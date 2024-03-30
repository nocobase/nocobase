import { FormOutlined } from '@ant-design/icons';
import React, { useCallback } from 'react';

import { SchemaInitializerItem, useSchemaInitializer, useSchemaInitializerItem } from '../../application';
import { useSchemaTemplateManager } from '../../schema-templates';
import { useRecordCollectionDataSourceItems } from '../utils';
import { useCollectionManager_deprecated } from '../../collection-manager';
import { createDetailsUISchema } from '../../modules/blocks/data-blocks/details-single/createDetailsUISchema';

/**
 * @deprecated
 */
export const RecordReadPrettyAssociationFormBlockInitializer = () => {
  const itemConfig = useSchemaInitializerItem();
  const { onCreateBlockSchema, componentType, createBlockSchema, ...others } = itemConfig;
  const { insert } = useSchemaInitializer();
  const { getCollection } = useCollectionManager_deprecated();
  const { getTemplateSchemaByMode } = useSchemaTemplateManager();

  const field = itemConfig.field;
  const collectionName = field.target;
  const collection = getCollection(collectionName);

  const resource = `${field.collectionName}.${field.name}`;

  return (
    <SchemaInitializerItem
      icon={<FormOutlined />}
      {...others}
      onClick={async ({ item }) => {
        if (item.template) {
          const s = await getTemplateSchemaByMode(item);
          if (item.template.componentName === 'ReadPrettyFormItem') {
            const blockSchema = createDetailsUISchema({
              dataSource: collection.dataSource,
              association: resource,
              templateSchema: s,
            });
            if (item.mode === 'reference') {
              blockSchema['x-template-key'] = item.template.key;
            }
            insert(blockSchema);
          } else {
            insert(s);
          }
        } else {
          insert(
            createDetailsUISchema({
              association: resource,
              dataSource: collection.dataSource,
            }),
          );
        }
      }}
      items={useRecordCollectionDataSourceItems('ReadPrettyFormItem', itemConfig, collection, resource)}
    />
  );
};

export function useCreateAssociationDetailsWithoutPagination() {
  const { insert } = useSchemaInitializer();
  const { getCollection } = useCollectionManager_deprecated();

  const createAssociationDetailsWithoutPagination = useCallback(
    ({ item }) => {
      const field = item.associationField;
      const collection = getCollection(field.target);

      insert(
        createDetailsUISchema({
          dataSource: collection.dataSource,
          association: `${field.collectionName}.${field.name}`,
        }),
      );
    },
    [getCollection, insert],
  );

  const templateWrap = useCallback(
    (templateSchema, { item }) => {
      const field = item.associationField;
      const collection = getCollection(field.target);

      if (item.template.componentName === 'ReadPrettyFormItem') {
        const blockSchema = createDetailsUISchema({
          dataSource: collection.dataSource,
          association: `${field.collectionName}.${field.name}`,
          templateSchema: templateSchema,
        });
        if (item.mode === 'reference') {
          blockSchema['x-template-key'] = item.template.key;
        }
        return blockSchema;
      } else {
        return templateSchema;
      }
    },
    [getCollection],
  );

  return { createAssociationDetailsWithoutPagination, templateWrap };
}
