import React from 'react';
import { FormOutlined } from '@ant-design/icons';

import { useCollectionManager } from '../../collection-manager';
import { useSchemaTemplateManager } from '../../schema-templates';
import { createDetailsBlockSchema, useRecordCollectionDataSourceItems } from '../utils';
import { SchemaInitializerItem, useSchemaInitializerV2 } from '../../application';

export const RecordAssociationDetailsBlockInitializer = (props) => {
  const { item, onCreateBlockSchema, componentType, createBlockSchema, ...others } = props;
  const { insert } = useSchemaInitializerV2();
  const { getTemplateSchemaByMode } = useSchemaTemplateManager();
  const { getCollection } = useCollectionManager();
  const field = item.field;
  const collection = getCollection(field.target);
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
      items={useRecordCollectionDataSourceItems('Details', item, field.target, resource)}
    />
  );
};
