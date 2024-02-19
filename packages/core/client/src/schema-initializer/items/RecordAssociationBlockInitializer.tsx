import React from 'react';
import { TableOutlined } from '@ant-design/icons';

import { useCollectionManager_deprecated } from '../../collection-manager';
import { useSchemaTemplateManager } from '../../schema-templates';
import { createTableBlockSchema, useRecordCollectionDataSourceItems } from '../utils';
import { SchemaInitializerItem, useSchemaInitializer, useSchemaInitializerItem } from '../../application';

export const RecordAssociationBlockInitializer = () => {
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
            createTableBlockSchema({
              rowKey: collection.filterTargetKey,
              collection: field.target,
              dataSource: collection.dataSource,
              resource,
              association: resource,
            }),
          );
        }
      }}
      items={useRecordCollectionDataSourceItems('Table', itemConfig, field.target, resource)}
    />
  );
};
