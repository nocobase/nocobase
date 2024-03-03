import { FormOutlined } from '@ant-design/icons';
import React from 'react';
import { SchemaInitializerItem, useSchemaInitializer, useSchemaInitializerItem } from '../../../../application';
import { useBlockAssociationContext } from '../../../../block-provider';
import { useCollection_deprecated } from '../../../../collection-manager';
import { useSchemaTemplateManager } from '../../../../schema-templates';
import { createFormBlockSchema, useRecordCollectionDataSourceItems } from '../../../../schema-initializer/utils';

export const RecordFormBlockInitializer = () => {
  const itemConfig = useSchemaInitializerItem();
  const { onCreateBlockSchema, componentType, createBlockSchema, targetCollection, ...others } = itemConfig;
  const { insert } = useSchemaInitializer();
  const { getTemplateSchemaByMode } = useSchemaTemplateManager();
  const currentCollection = useCollection_deprecated();
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
              dataSource: collection.dataSource,
              action: 'get',
              useSourceId: '{{ useSourceIdFromParentRecord }}',
              useParams: '{{ useParamsFromRecord }}',
              actionInitializers: 'UpdateFormActionInitializers',
              template: s,
              settings: 'blockSettings:editForm',
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
              dataSource: collection.dataSource,
              action: 'get',
              useSourceId: '{{ useSourceIdFromParentRecord }}',
              useParams: '{{ useParamsFromRecord }}',
              actionInitializers: 'UpdateFormActionInitializers',
              settings: 'blockSettings:editForm',
            }),
          );
        }
      }}
      items={useRecordCollectionDataSourceItems('FormItem', null, collection?.name)}
    />
  );
};
