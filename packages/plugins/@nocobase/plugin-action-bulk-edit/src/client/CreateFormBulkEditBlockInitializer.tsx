import { FormOutlined } from '@ant-design/icons';
import {
  SchemaInitializerItem,
  createFormBlockSchema,
  useCollection,
  useDataBlockPropsV2,
  useRecordCollectionDataSourceItems,
  useSchemaInitializer,
  useSchemaInitializerItem,
  useSchemaTemplateManager,
} from '@nocobase/client';
import React from 'react';

export const CreateFormBulkEditBlockInitializer = () => {
  const itemConfig = useSchemaInitializerItem();
  const { onCreateBlockSchema, componentType, createBlockSchema, ...others } = itemConfig;
  const { insert } = useSchemaInitializer();
  const { getTemplateSchemaByMode } = useSchemaTemplateManager();
  const { association } = useDataBlockPropsV2();
  const collection = useCollection();
  return (
    <SchemaInitializerItem
      icon={<FormOutlined />}
      {...others}
      onClick={async ({ item }) => {
        if (item.template) {
          const s = await getTemplateSchemaByMode(item);
          if (item.template.componentName === 'FormItem') {
            const blockSchema = createFormBlockSchema({
              actionInitializers: 'CreateFormActionInitializers',
              association,
              collection: collection.name,
              dataSource: collection.dataSource,
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
              formItemInitializers: 'BulkEditFormItemInitializers',
              actionInitializers: 'BulkEditFormActionInitializers',
              association,
              collection: collection.name,
              dataSource: collection.dataSource,
            }),
          );
        }
      }}
      items={useRecordCollectionDataSourceItems('FormItem')}
    />
  );
};
