import React from 'react';
import { TableOutlined } from '@ant-design/icons';

import { useSchemaTemplateManager } from '../../schema-templates';
import { createListBlockSchema, useRecordCollectionDataSourceItems } from '../utils';
import {
  SchemaInitializerItem,
  useCollectionManagerV2,
  useSchemaInitializer,
  useSchemaInitializerItem,
} from '../../application';

export const RecordAssociationListBlockInitializer = () => {
  const itemConfig = useSchemaInitializerItem();
  const { onCreateBlockSchema, componentType, createBlockSchema, ...others } = itemConfig;
  const { insert } = useSchemaInitializer();
  const { getTemplateSchemaByMode } = useSchemaTemplateManager();
  const cm = useCollectionManagerV2();
  const field = itemConfig.field;
  const collection = cm.getCollection(field.target);
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
            createListBlockSchema({
              rowKey: collection.filterTargetKey,
              collection: field.target,
              resource,
              association: resource,
            }),
          );
        }
      }}
      items={useRecordCollectionDataSourceItems('List', itemConfig, field.target, resource)}
    />
  );
};
