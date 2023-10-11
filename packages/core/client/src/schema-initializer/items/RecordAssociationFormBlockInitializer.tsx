import React from 'react';
import { FormOutlined } from '@ant-design/icons';

import { useSchemaTemplateManager } from '../../schema-templates';
import { SchemaInitializer } from '../SchemaInitializer';
import { createFormBlockSchema, useRecordCollectionDataSourceItems } from '../utils';

export const RecordAssociationFormBlockInitializer = (props) => {
  const { item, onCreateBlockSchema, componentType, createBlockSchema, insert, ...others } = props;
  const { getTemplateSchemaByMode } = useSchemaTemplateManager();
  const field = item.field;
  const collection = field.target;
  const resource = `${field.collectionName}.${field.name}`;
  return (
    <SchemaInitializer.Item
      icon={<FormOutlined />}
      {...others}
      onClick={async ({ item }) => {
        const action = ['hasOne', 'belongsTo'].includes(field.type) ? 'get' : null;
        const actionInitializers = ['hasOne', 'belongsTo'].includes(field.type)
          ? 'UpdateFormActionInitializers'
          : 'CreateFormActionInitializers';

        if (item.template) {
          const s = await getTemplateSchemaByMode(item);
          if (item.template.componentName === 'FormItem') {
            const blockSchema = createFormBlockSchema({
              collection,
              resource,
              association: resource,
              action,
              useSourceId: '{{ useSourceIdFromParentRecord }}',
              useParams: '{{ useParamsFromRecord }}',
              actionInitializers,
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
            createFormBlockSchema({
              collection,
              resource,
              association: resource,
              action,
              useSourceId: '{{ useSourceIdFromParentRecord }}',
              useParams: '{{ useParamsFromRecord }}',
              actionInitializers,
            }),
          );
        }
      }}
      items={useRecordCollectionDataSourceItems('FormItem', item, collection, resource)}
    />
  );
};
