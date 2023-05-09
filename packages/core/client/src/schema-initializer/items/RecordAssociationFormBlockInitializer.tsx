import { FormOutlined } from '@ant-design/icons';
import React from 'react';

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
              // 是否是通过 RecordBlockInitializers 中的 Relationship blocks 中的选项创建的区块
              createdByAssoc: true,
            });
            if (item.mode === 'reference') {
              blockSchema['x-template-key'] = item.template.key;
            }
            insert(blockSchema);
          } else {
            try {
              s['x-decorator-props'].createdByAssoc = true;
            } catch (err) {
              console.error(err);
            }
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
              // 是否是通过 RecordBlockInitializers 中的 Relationship blocks 中的选项创建的区块
              createdByAssoc: true,
            }),
          );
        }
      }}
      items={useRecordCollectionDataSourceItems('FormItem', item, collection, resource)}
    />
  );
};
