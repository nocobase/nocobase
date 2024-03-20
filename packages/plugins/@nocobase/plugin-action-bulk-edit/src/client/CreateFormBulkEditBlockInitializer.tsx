import { FormOutlined } from '@ant-design/icons';
import {
  SchemaInitializerItem,
  useBlockAssociationContext,
  useCollection_deprecated,
  useRecordCollectionDataSourceItems,
  useSchemaInitializer,
  useSchemaInitializerItem,
  useSchemaTemplateManager,
} from '@nocobase/client';
import { createCreateFormBlockUISchema } from 'packages/core/client/src/modules/blocks/data-blocks/form/createCreateFormBlockUISchema';
import React from 'react';
import { createBulkEditBlockUISchema } from './createBulkEditBlockUISchema';

export const CreateFormBulkEditBlockInitializer = () => {
  const itemConfig = useSchemaInitializerItem();
  const { onCreateBlockSchema, componentType, createBlockSchema, ...others } = itemConfig;
  const { insert } = useSchemaInitializer();
  const { getTemplateSchemaByMode } = useSchemaTemplateManager();
  const association = useBlockAssociationContext();
  const collection = useCollection_deprecated();
  return (
    <SchemaInitializerItem
      icon={<FormOutlined />}
      {...others}
      onClick={async ({ item }) => {
        if (item.template) {
          const s = await getTemplateSchemaByMode(item);
          if (item.template.componentName === 'FormItem') {
            const blockSchema = createCreateFormBlockUISchema({
              association,
              collectionName: collection.name,
              dataSource: collection.dataSource,
              templateSchema: s,
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
            createBulkEditBlockUISchema({
              association,
              collectionName: collection.name,
              dataSource: collection.dataSource,
            }),
          );
        }
      }}
      items={useRecordCollectionDataSourceItems('FormItem')}
    />
  );
};
