import React from 'react';
import { FormOutlined } from '@ant-design/icons';
import { useBlockAssociationContext, useBlockRequestContext } from '../../block-provider';
import { useCollection } from '../../collection-manager';
import { useSchemaTemplateManager } from '../../schema-templates';
import { SchemaInitializer } from '../SchemaInitializer';
import { createReadPrettyFormBlockSchema, useRecordCollectionDataSourceItems } from '../utils';

export const RecordReadPrettyFormBlockInitializer = (props) => {
  const { onCreateBlockSchema, componentType, createBlockSchema, insert, ...others } = props;

  const { getTemplateSchemaByMode } = useSchemaTemplateManager();
  const collection = useCollection();
  const association = useBlockAssociationContext();
  const { block } = useBlockRequestContext();
  const actionInitializers =
    block !== 'TableField' ? props.actionInitializers || 'ReadPrettyFormActionInitializers' : null;

  return (
    <SchemaInitializer.Item
      icon={<FormOutlined />}
      {...others}
      key={'123'}
      onClick={async ({ item }) => {
        if (item.template) {
          const s = await getTemplateSchemaByMode(item);
          if (item.template.componentName === 'ReadPrettyFormItem') {
            const blockSchema = createReadPrettyFormBlockSchema({
              actionInitializers,
              association,
              collection: collection.name,
              action: 'get',
              useSourceId: '{{ useSourceIdFromParentRecord }}',
              useParams: '{{ useParamsFromRecord }}',
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
            createReadPrettyFormBlockSchema({
              actionInitializers,
              association,
              collection: collection.name,
              action: 'get',
              useSourceId: '{{ useSourceIdFromParentRecord }}',
              useParams: '{{ useParamsFromRecord }}',
            }),
          );
        }
      }}
      items={useRecordCollectionDataSourceItems('ReadPrettyFormItem')}
    />
  );
};
