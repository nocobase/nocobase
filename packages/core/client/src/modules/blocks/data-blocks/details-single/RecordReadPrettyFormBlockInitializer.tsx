import { FormOutlined } from '@ant-design/icons';
import React from 'react';
import { SchemaInitializerItem, useSchemaInitializer, useSchemaInitializerItem } from '../../../../application';
import { useBlockAssociationContext, useBlockRequestContext } from '../../../../block-provider';
import { useCollection_deprecated } from '../../../../collection-manager';
import { useSchemaTemplateManager } from '../../../../schema-templates';
import {
  createReadPrettyFormBlockSchema,
  useRecordCollectionDataSourceItems,
} from '../../../../schema-initializer/utils';

export const RecordReadPrettyFormBlockInitializer = () => {
  const itemConfig = useSchemaInitializerItem();
  const {
    onCreateBlockSchema,
    componentType,
    createBlockSchema,
    icon = true,
    targetCollection,
    ...others
  } = itemConfig;
  const { insert } = useSchemaInitializer();
  const { getTemplateSchemaByMode } = useSchemaTemplateManager();
  const currentCollection = useCollection_deprecated();
  const collection = targetCollection || currentCollection;
  const association = useBlockAssociationContext();
  const { block } = useBlockRequestContext();
  const actionInitializers =
    block !== 'TableField' ? itemConfig.actionInitializers || 'ReadPrettyFormActionInitializers' : null;

  return (
    <SchemaInitializerItem
      icon={icon && <FormOutlined />}
      {...others}
      onClick={async ({ item }) => {
        if (item.template) {
          const s = await getTemplateSchemaByMode(item);
          if (item.template.componentName === 'ReadPrettyFormItem') {
            const blockSchema = createReadPrettyFormBlockSchema({
              actionInitializers,
              association,
              collection: collection.name,
              dataSource: collection.dataSource,
              action: 'get',
              useSourceId: '{{ useSourceIdFromParentRecord }}',
              useParams: '{{ useParamsFromRecord }}',
              template: s,
              settings: 'blockSettings:singleDataDetails',
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
              dataSource: collection.dataSource,
              action: 'get',
              useSourceId: '{{ useSourceIdFromParentRecord }}',
              useParams: '{{ useParamsFromRecord }}',
              settings: 'blockSettings:singleDataDetails',
            }),
          );
        }
      }}
      items={useRecordCollectionDataSourceItems('ReadPrettyFormItem', null, collection?.name)}
    />
  );
};
