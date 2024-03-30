import { FormOutlined } from '@ant-design/icons';
import React from 'react';

import { SchemaInitializerItem, useSchemaInitializer, useSchemaInitializerItem } from '../../../../application';
import { useBlockAssociationContext } from '../../../../block-provider';
import { useCollection_deprecated } from '../../../../collection-manager';
import { useRecordCollectionDataSourceItems } from '../../../../schema-initializer/utils';
import { useSchemaTemplateManager } from '../../../../schema-templates';
import { createCreateFormBlockUISchema } from './createCreateFormBlockUISchema';

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
            const blockSchema = createCreateFormBlockUISchema(
              association
                ? {
                    association,
                    dataSource: collection.dataSource,
                    templateSchema: s,
                  }
                : {
                    collectionName: collection.name,
                    dataSource: collection.dataSource,
                    templateSchema: s,
                  },
            );
            if (item.mode === 'reference') {
              blockSchema['x-template-key'] = item.template.key;
            }
            insert(blockSchema);
          } else {
            insert(s);
          }
        } else {
          insert(
            createCreateFormBlockUISchema(
              association
                ? {
                    association,
                    dataSource: collection.dataSource,
                  }
                : {
                    collectionName: collection.name,
                    dataSource: collection.dataSource,
                  },
            ),
          );
        }
      }}
      items={useRecordCollectionDataSourceItems('FormItem')}
    />
  );
};
