import { FormOutlined } from '@ant-design/icons';
import React from 'react';

import { SchemaInitializerItem, useSchemaInitializer, useSchemaInitializerItem } from '../../../../application';
import { useBlockAssociationContext } from '../../../../block-provider';
import { useCollection_deprecated } from '../../../../collection-manager';
import { useSchemaTemplateManager } from '../../../../schema-templates';
import { createFormBlockSchema, useRecordCollectionDataSourceItems } from '../../../../schema-initializer/utils';

// TODO: `SchemaInitializerItem` items
export const CreateFormBlockInitializer = () => {
  const itemConfig = useSchemaInitializerItem();
  const { onCreateBlockSchema, componentType, createBlockSchema, ...others } = itemConfig;
  const { getTemplateSchemaByMode } = useSchemaTemplateManager();
  const { insert } = useSchemaInitializer();
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
            const blockSchema = createFormBlockSchema({
              actionInitializers: 'CreateFormActionInitializers',
              association,
              dataSource: collection.dataSource,
              collection: collection.name,
              template: s,
              settings: 'blockSettings:createForm',
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
              settings: 'blockSettings:createForm',
            }),
          );
        }
      }}
      items={useRecordCollectionDataSourceItems('FormItem')}
    />
  );
};
