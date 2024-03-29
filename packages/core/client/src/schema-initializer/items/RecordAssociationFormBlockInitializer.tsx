import { FormOutlined } from '@ant-design/icons';
import React, { useCallback, useMemo } from 'react';

import { SchemaInitializerItem, useSchemaInitializer, useSchemaInitializerItem } from '../../application';
import { useCollectionManager_deprecated } from '../../collection-manager';
import { createCreateFormBlockUISchema } from '../../modules/blocks/data-blocks/form/createCreateFormBlockUISchema';
import { useSchemaTemplateManager } from '../../schema-templates';
import { useRecordCollectionDataSourceItems } from '../utils';

/**
 * @deprecated
 */
export const RecordAssociationFormBlockInitializer = () => {
  const itemConfig = useSchemaInitializerItem();
  const { onCreateBlockSchema, componentType, createBlockSchema, ...others } = itemConfig;
  const { insert } = useSchemaInitializer();
  const { getCollection } = useCollectionManager_deprecated();
  const { getTemplateSchemaByMode } = useSchemaTemplateManager();
  const field = itemConfig.field;
  const collectionName = field.target;
  const collection = useMemo(() => getCollection(collectionName), [collectionName]);
  return (
    <SchemaInitializerItem
      icon={<FormOutlined />}
      {...others}
      onClick={async ({ item }) => {
        if (item.template) {
          const template = await getTemplateSchemaByMode(item);
          if (item.template.componentName === 'FormItem') {
            const blockSchema = createCreateFormBlockUISchema({
              dataSource: collection.dataSource,
              association: `${field.collectionName}.${field.name}`,
              templateSchema: template,
            });
            if (item.mode === 'reference') {
              blockSchema['x-template-key'] = item.template.key;
            }
            insert(blockSchema);
          } else {
            insert(template);
          }
        } else {
          insert(
            createCreateFormBlockUISchema({
              dataSource: collection.dataSource,
              association: `${field.collectionName}.${field.name}`,
            }),
          );
        }
      }}
      items={useRecordCollectionDataSourceItems(
        'FormItem',
        itemConfig,
        collection,
        `${field.collectionName}.${field.name}`,
      )}
    />
  );
};

export function useCreateAssociationFormBlock() {
  const { insert } = useSchemaInitializer();
  const { getCollection } = useCollectionManager_deprecated();

  const createAssociationFormBlock = useCallback(
    ({ item }) => {
      const field = item.associationField;
      const collection = getCollection(field.target);

      insert(
        createCreateFormBlockUISchema({
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

      if (item.template.componentName === 'FormItem') {
        const blockSchema = createCreateFormBlockUISchema({
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

  return { createAssociationFormBlock, templateWrap };
}
