import React from 'react';
import { FormOutlined } from '@ant-design/icons';

import { useSchemaTemplateManager } from '../../schema-templates';
import { createDetailsBlockSchema, useRecordCollectionDataSourceItems } from '../utils';
import {
  SchemaInitializerItem,
  useCollectionManagerV2,
  useSchemaInitializer,
  useSchemaInitializerItem,
} from '../../application';

export const RecordAssociationDetailsBlockInitializer = () => {
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
      icon={<FormOutlined />}
      {...others}
      onClick={async ({ item }) => {
        if (item.template) {
          const s = await getTemplateSchemaByMode(item);
          insert(s);
        } else {
          insert(
            createDetailsBlockSchema({
              collection: field.target,
              resource,
              association: resource,
              rowKey: collection.filterTargetKey || 'id',
            }),
          );
        }
      }}
      items={useRecordCollectionDataSourceItems('Details', itemConfig, field.target, resource)}
    />
  );
};
