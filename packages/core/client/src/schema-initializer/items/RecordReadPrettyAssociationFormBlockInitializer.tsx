import React from 'react';
import { FormOutlined } from '@ant-design/icons';

import { useBlockRequestContext } from '../../block-provider';
import { useSchemaTemplateManager } from '../../schema-templates';
import { createReadPrettyFormBlockSchema, useRecordCollectionDataSourceItems } from '../utils';
import { SchemaInitializerItem, useSchemaInitializer, useSchemaInitializerItem } from '../../application';
import { useCollectionManager } from '../../collection-manager';

export const RecordReadPrettyAssociationFormBlockInitializer = () => {
  const itemConfig = useSchemaInitializerItem();
  const { onCreateBlockSchema, componentType, createBlockSchema, ...others } = itemConfig;
  const { insert } = useSchemaInitializer();
  const { getCollection } = useCollectionManager();
  const { getTemplateSchemaByMode } = useSchemaTemplateManager();

  const field = itemConfig.field;
  const collectionName = field.target;
  const collection = getCollection(collectionName);

  const resource = `${field.collectionName}.${field.name}`;
  const { block } = useBlockRequestContext();
  const actionInitializers = block !== 'TableField' ? 'ReadPrettyFormActionInitializers' : null;

  return (
    <SchemaInitializerItem
      icon={<FormOutlined />}
      {...others}
      onClick={async ({ item }) => {
        if (item.template) {
          const s = await getTemplateSchemaByMode(item);
          if (item.template.componentName === 'ReadPrettyFormItem') {
            const blockSchema = createReadPrettyFormBlockSchema({
              actionInitializers,
              collection: collectionName,
              namespace: collection.namespace,
              resource,
              association: resource,
              action: 'get',
              useSourceId: '{{ useSourceIdFromParentRecord }}',
              useParams: '{{ useParamsFromRecord }}',
              template: s,
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
            createReadPrettyFormBlockSchema({
              actionInitializers,
              collection: collectionName,
              resource,
              association: resource,
              namespace: collection.namespace,
              action: 'get',
              useSourceId: '{{ useSourceIdFromParentRecord }}',
              useParams: '{{ useParamsFromRecord }}',
            }),
          );
        }
      }}
      items={useRecordCollectionDataSourceItems('ReadPrettyFormItem', itemConfig, collection, resource)}
    />
  );
};
