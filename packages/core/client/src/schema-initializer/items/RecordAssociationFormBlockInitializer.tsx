import React, { useCallback, useMemo } from 'react';
import { FormOutlined } from '@ant-design/icons';

import { SchemaInitializerItem, useSchemaInitializer, useSchemaInitializerItem } from '../../application';
import { useSchemaTemplateManager } from '../../schema-templates';
import { createFormBlockSchema, useRecordCollectionDataSourceItems } from '../utils';
import { useCollectionManager_deprecated } from '../../collection-manager';

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
  const resource = `${field.collectionName}.${field.name}`;
  return (
    <SchemaInitializerItem
      icon={<FormOutlined />}
      {...others}
      onClick={async ({ item }) => {
        const action = ['hasOne', 'belongsTo'].includes(field.type) ? 'get' : null;
        const actionInitializers = ['hasOne', 'belongsTo'].includes(field.type)
          ? 'editForm:configureActions'
          : 'createForm:configureActions';

        if (item.template) {
          const template = await getTemplateSchemaByMode(item);
          if (item.template.componentName === 'FormItem') {
            const blockSchema = createFormBlockSchema({
              collection: collectionName,
              dataSource: collection.dataSource,
              resource,
              association: resource,
              action,
              useSourceId: '{{ useSourceIdFromParentRecord }}',
              useParams: '{{ useParamsFromRecord }}',
              actionInitializers,
              template: template,
              settings: 'blockSettings:createForm',
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
            createFormBlockSchema({
              collection: collectionName,
              resource,
              dataSource: collection.dataSource,
              association: resource,
              action,
              useSourceId: '{{ useSourceIdFromParentRecord }}',
              useParams: '{{ useParamsFromRecord }}',
              actionInitializers,
              settings: 'blockSettings:createForm',
            }),
          );
        }
      }}
      items={useRecordCollectionDataSourceItems('FormItem', itemConfig, collection, resource)}
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
      const action = ['hasOne', 'belongsTo'].includes(field.type) ? 'get' : null;
      const actionInitializers = ['hasOne', 'belongsTo'].includes(field.type)
        ? 'editForm:configureActions'
        : 'createForm:configureActions';

      insert(
        createFormBlockSchema({
          collection: field.target,
          dataSource: collection.dataSource,
          association: `${field.collectionName}.${field.name}`,
          action,
          useSourceId: '{{ useSourceIdFromParentRecord }}',
          useParams: '{{ useParamsFromRecord }}',
          actionInitializers,
          settings: 'blockSettings:createForm',
        }),
      );
    },
    [getCollection, insert],
  );

  const templateWrap = useCallback(
    (templateSchema, { item }) => {
      const field = item.associationField;
      const action = ['hasOne', 'belongsTo'].includes(field.type) ? 'get' : null;
      const collection = getCollection(field.target);
      const actionInitializers = ['hasOne', 'belongsTo'].includes(field.type)
        ? 'editForm:configureActions'
        : 'createForm:configureActions';

      if (item.template.componentName === 'FormItem') {
        const blockSchema = createFormBlockSchema({
          collection: field.target,
          dataSource: collection.dataSource,
          association: `${field.collectionName}.${field.name}`,
          action,
          useSourceId: '{{ useSourceIdFromParentRecord }}',
          useParams: '{{ useParamsFromRecord }}',
          actionInitializers,
          template: templateSchema,
          settings: 'blockSettings:createForm',
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
