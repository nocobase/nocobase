import { TableOutlined } from '@ant-design/icons';
import React, { useCallback } from 'react';

import { useCollectionManager_deprecated } from '../../collection-manager';
import { SchemaInitializerItem, useSchemaInitializer, useSchemaInitializerItem } from '../../application';
import { useSchemaTemplateManager } from '../../schema-templates';
import { createGridCardBlockSchema, useRecordCollectionDataSourceItems } from '../utils';

/**
 * @deprecated
 */
export const RecordAssociationGridCardBlockInitializer = () => {
  const itemConfig = useSchemaInitializerItem();
  const { onCreateBlockSchema, componentType, createBlockSchema, ...others } = itemConfig;
  const { insert } = useSchemaInitializer();
  const { getTemplateSchemaByMode } = useSchemaTemplateManager();
  const { getCollection } = useCollectionManager_deprecated();
  const field = itemConfig.field;
  const collection = getCollection(field.target);
  const resource = `${field.collectionName}.${field.name}`;

  return (
    <SchemaInitializerItem
      icon={<TableOutlined />}
      {...others}
      onClick={async ({ item }) => {
        if (item.template) {
          const s = await getTemplateSchemaByMode(item);
          insert(s);
        } else {
          insert(
            createGridCardBlockSchema({
              rowKey: collection.filterTargetKey,
              collection: field.target,
              resource,
              dataSource: collection.dataSource,
              association: resource,
              settings: 'blockSettings:gridCard',
            }),
          );
        }
      }}
      items={useRecordCollectionDataSourceItems('GridCard', itemConfig, field.target, resource)}
    />
  );
};

export function useCreateAssociationGridCardBlock() {
  const { insert } = useSchemaInitializer();
  const { getCollection } = useCollectionManager_deprecated();

  const createAssociationGridCardBlock = useCallback(
    ({ item }) => {
      const field = item.associationField;
      const collection = getCollection(field.target);

      insert(
        createGridCardBlockSchema({
          rowKey: collection.filterTargetKey,
          collection: field.target,
          dataSource: collection.dataSource,
          association: `${field.collectionName}.${field.name}`,
          settings: 'blockSettings:gridCard',
        }),
      );
    },
    [getCollection, insert],
  );

  return { createAssociationGridCardBlock };
}
