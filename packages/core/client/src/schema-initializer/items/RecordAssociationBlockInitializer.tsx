import React from 'react';
import { TableOutlined } from '@ant-design/icons';

import { useCollectionManager } from '../../collection-manager';
import { useSchemaTemplateManager } from '../../schema-templates';
import { createTableBlockSchema, useRecordCollectionDataSourceItems } from '../utils';
import { SchemaInitializerItem, useSchemaInitializerV2 } from '../../application';

export const RecordAssociationBlockInitializer = (props) => {
  const { item, onCreateBlockSchema, componentType, createBlockSchema, ...others } = props;
  const { insert } = useSchemaInitializerV2();
  const { getTemplateSchemaByMode } = useSchemaTemplateManager();
  const { getCollection } = useCollectionManager();
  const field = item.field;
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
              resource,
              association: resource,
            }),
          );
        }
      }}
      items={useRecordCollectionDataSourceItems('Table', item, field.target, resource)}
    />
  );
};
