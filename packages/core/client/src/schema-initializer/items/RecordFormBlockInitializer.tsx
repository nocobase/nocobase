import React from 'react';
import { FormOutlined } from '@ant-design/icons';
import { useBlockAssociationContext } from '../../block-provider';
import { useCollection } from '../../collection-manager';
import { useSchemaTemplateManager } from '../../schema-templates';
import { createFormBlockSchema, useRecordCollectionDataSourceItems } from '../utils';
import { SchemaInitializerItem, useSchemaInitializerV2 } from '../../application';

export const RecordFormBlockInitializer = (props) => {
  const { onCreateBlockSchema, componentType, createBlockSchema, targetCollection, ...others } = props;
  const { insert } = useSchemaInitializerV2();
  const { getTemplateSchemaByMode } = useSchemaTemplateManager();
  const currentCollection = useCollection();
  const collection = targetCollection || currentCollection;
  const association = useBlockAssociationContext();
  return (
    <SchemaInitializerItem
      icon={<FormOutlined />}
      {...others}
      onClick={async ({ item }) => {
        if (item.template) {
          const s = await getTemplateSchemaByMode(item);
          if (item.template.componentName === 'FormItem') {
            const blockSchema = createFormBlockSchema({
              association,
              collection: collection.name,
              action: 'get',
              useSourceId: '{{ useSourceIdFromParentRecord }}',
              useParams: '{{ useParamsFromRecord }}',
              actionInitializers: 'UpdateFormActionInitializers',
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
              association,
              collection: collection.name,
              action: 'get',
              useSourceId: '{{ useSourceIdFromParentRecord }}',
              useParams: '{{ useParamsFromRecord }}',
              actionInitializers: 'UpdateFormActionInitializers',
            }),
          );
        }
      }}
      items={useRecordCollectionDataSourceItems('FormItem', null, collection?.name)}
    />
  );
};
