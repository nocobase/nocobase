import { FormOutlined } from '@ant-design/icons';
import React, { useCallback } from 'react';

import { SchemaInitializerItem, useSchemaInitializer, useSchemaInitializerItem } from '../../application';
import { useBlockRequestContext } from '../../block-provider';
import { useSchemaTemplateManager } from '../../schema-templates';
import { createDetailsBlockSchema, useRecordCollectionDataSourceItems } from '../utils';
import { useCollectionManager_deprecated } from '../../collection-manager';

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
  const { block } = useBlockRequestContext();
  const actionInitializers = block !== 'TableField' ? 'details:configureActions' : null;

  return (
    <SchemaInitializerItem
      icon={<FormOutlined />}
      {...others}
      onClick={async ({ item }) => {
        if (item.template) {
          const s = await getTemplateSchemaByMode(item);
          if (item.template.componentName === 'ReadPrettyFormItem') {
            const blockSchema = createDetailsBlockSchema({
              actionInitializers,
              collection: collectionName,
              dataSource: collection.dataSource,
              resource,
              association: resource,
              action: 'get',
              useSourceId: '{{ useSourceIdFromParentRecord }}',
              useParams: '{{ useParamsFromRecord }}',
              template: s,
              settings: 'blockSettings:singleDataDetails',
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
            createDetailsBlockSchema({
              actionInitializers,
              collection: collectionName,
              resource,
              association: resource,
              dataSource: collection.dataSource,
              action: 'get',
              useSourceId: '{{ useSourceIdFromParentRecord }}',
              useParams: '{{ useParamsFromRecord }}',
              settings: 'blockSettings:singleDataDetails',
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
  const { block } = useBlockRequestContext();
  const actionInitializers = block !== 'TableField' ? 'details:configureActions' : null;

  const createAssociationDetailsWithoutPagination = useCallback(
    ({ item }) => {
      const field = item.associationField;
      const collection = getCollection(field.target);

      insert(
        createDetailsBlockSchema({
          actionInitializers,
          collection: field.target,
          dataSource: collection.dataSource,
          association: `${field.collectionName}.${field.name}`,
          action: 'get',
          useSourceId: '{{ useSourceIdFromParentRecord }}',
          useParams: '{{ useParamsFromRecord }}',
          settings: 'blockSettings:singleDataDetails',
        }),
      );
    },
    [actionInitializers, getCollection, insert],
  );

  const templateWrap = useCallback(
    (templateSchema, { item }) => {
      const field = item.associationField;
      const collection = getCollection(field.target);

      if (item.template.componentName === 'ReadPrettyFormItem') {
        const blockSchema = createDetailsBlockSchema({
          actionInitializers,
          collection: field.target,
          dataSource: collection.dataSource,
          association: `${field.collectionName}.${field.name}`,
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
    [actionInitializers, getCollection],
  );

  return { createAssociationDetailsWithoutPagination, templateWrap };
}
