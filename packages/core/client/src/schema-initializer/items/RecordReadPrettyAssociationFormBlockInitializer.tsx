import { FormOutlined } from '@ant-design/icons';
import React from 'react';

import { useBlockRequestContext } from '../../block-provider';
import { useRecord } from '../../record-provider';
import { useSchemaTemplateManager } from '../../schema-templates';
import { SchemaInitializer } from '../SchemaInitializer';
import { createReadPrettyFormBlockSchema, useRecordCollectionDataSourceItems } from '../utils';

export const RecordReadPrettyAssociationFormBlockInitializer = (props) => {
  const { item, onCreateBlockSchema, componentType, createBlockSchema, insert, ...others } = props;
  const { getTemplateSchemaByMode } = useSchemaTemplateManager();
  const record = useRecord();

  const field = item.field;
  const collection = field.target;
  const resource = `${field.collectionName}.${field.name}`;
  const { block } = useBlockRequestContext();
  const actionInitializers = block !== 'TableField' ? 'ReadPrettyFormActionInitializers' : null;
  const assocFieldRecord = record
    ? record[field.name] || { [field.targetKey || 'id']: record[field.foreignKey] }
    : null;

  return (
    <SchemaInitializer.Item
      icon={<FormOutlined />}
      {...others}
      onClick={async ({ item }) => {
        if (item.template) {
          const s = await getTemplateSchemaByMode(item);
          if (item.template.componentName === 'ReadPrettyFormItem') {
            const blockSchema = createReadPrettyFormBlockSchema({
              actionInitializers,
              collection,
              resource,
              association: resource,
              action: 'get',
              useSourceId: '{{ useSourceIdFromParentRecord }}',
              useParams: '{{ useParamsFromRecord }}',
              template: s,
              assocFieldRecord,
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
              collection,
              resource,
              association: resource,
              action: 'get',
              useSourceId: '{{ useSourceIdFromParentRecord }}',
              useParams: '{{ useParamsFromRecord }}',
              assocFieldRecord,
            }),
          );
        }
      }}
      items={useRecordCollectionDataSourceItems('ReadPrettyFormItem', item, collection, resource)}
    />
  );
};
