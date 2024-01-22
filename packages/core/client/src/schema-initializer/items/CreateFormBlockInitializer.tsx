import { FormOutlined } from '@ant-design/icons';
import React from 'react';

import {
  SchemaInitializerItem,
  useDataBlockPropsV2,
  useSchemaInitializer,
  useSchemaInitializerItem,
} from '../../application';
import { useCollection } from '../../collection-manager';
import { useSchemaTemplateManager } from '../../schema-templates';
import { createFormBlockSchema, useRecordCollectionDataSourceItems } from '../utils';

// TODO: `SchemaInitializerItem` items
export const CreateFormBlockInitializer = () => {
  const itemConfig = useSchemaInitializerItem();
  const { onCreateBlockSchema, componentType, createBlockSchema, ...others } = itemConfig;
  const { getTemplateSchemaByMode } = useSchemaTemplateManager();
  const { insert } = useSchemaInitializer();
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
              dataSource: collection.dataSource,
              collection: collection.name,
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
              actionInitializers: 'CreateFormActionInitializers',
              association,
              dataSource: collection.dataSource,
              collection: collection.name,
            }),
          );
        }
      }}
      items={useRecordCollectionDataSourceItems('FormItem')}
    />
  );
};
