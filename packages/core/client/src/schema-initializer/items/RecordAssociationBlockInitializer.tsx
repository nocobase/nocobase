import { TableOutlined } from '@ant-design/icons';
import React from 'react';

import { useCollectionManager } from '../../collection-manager';
import { useSchemaTemplateManager } from '../../schema-templates';
import { SchemaInitializer } from '../SchemaInitializer';
import { createTableBlockSchema, useRecordCollectionDataSourceItems } from '../utils';

export const RecordAssociationBlockInitializer = (props) => {
  const { item, onCreateBlockSchema, componentType, createBlockSchema, insert, ...others } = props;
  const { getTemplateSchemaByMode } = useSchemaTemplateManager();
  const { getCollection } = useCollectionManager();
  const field = item.field;
  const collection = getCollection(field.target);
  const resource = `${field.collectionName}.${field.name}`;
  return (
    <SchemaInitializer.Item
      icon={<TableOutlined />}
      {...others}
      onClick={async ({ item }) => {
        if (item.template) {
          const s = await getTemplateSchemaByMode(item);
          try {
            s['x-decorator-props'].createdByAssoc = true;
          } catch (err) {
            console.error(err);
          }
          insert(s);
        } else {
          insert(
            createTableBlockSchema({
              rowKey: collection.filterTargetKey,
              collection: field.target,
              resource,
              association: resource,
              // 是否是通过 RecordBlockInitializers 中的 Relationship blocks 中的选项创建的区块
              createdByAssoc: true,
            }),
          );
        }
      }}
      items={useRecordCollectionDataSourceItems('Table', item, field.target, resource)}
    />
  );
};
