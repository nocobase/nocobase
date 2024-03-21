import React from 'react';
import { FormOutlined } from '@ant-design/icons';
import {
  useBlockAssociationContext,
  useCollection_deprecated,
  useSchemaTemplateManager,
  useRecordCollectionDataSourceItems,
  useBlockRequestContext,
  useSchemaInitializer,
  SchemaInitializerItem,
  useSchemaInitializerItem,
} from '@nocobase/client';
import { ISchema } from '@formily/react';
import { uid } from '@formily/shared';

export const createSnapshotBlockSchema = (options) => {
  const {
    formItemInitializers = 'details:configureFields',
    actionInitializers = 'details:configureActions',
    collection,
    association,
    resource,
    template,
    ...others
  } = options;
  const resourceName = resource || association || collection;
  const schema: ISchema = {
    type: 'void',
    'x-acl-action': `${resourceName}:get`,
    'x-decorator': 'SnapshotBlockProvider',
    'x-decorator-props': {
      resource: resourceName,
      collection,
      association,
      readPretty: true,
      action: 'get',
      useParams: '{{ useParamsFromRecord }}',
      ...others,
    },
    'x-designer': 'FormV2.ReadPrettyDesigner',
    'x-component': 'CardItem',
    properties: {
      [uid()]: {
        type: 'void',
        'x-component': 'FormV2',
        'x-read-pretty': true,
        'x-component-props': {
          useProps: '{{ useFormBlockProps }}',
        },
        properties: {
          grid: template || {
            type: 'void',
            'x-component': 'Grid',
            'x-initializer': formItemInitializers,
            properties: {},
          },
        },
      },
    },
  };
  return schema;
};

export const SnapshotBlockInitializersDetailItem = () => {
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
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const collection = targetCollection || useCollection_deprecated();
  const association = useBlockAssociationContext();
  const { block } = useBlockRequestContext();
  const actionInitializers =
    block !== 'TableField' ? itemConfig.actionInitializers || 'details:configureActions' : null;

  return (
    <SchemaInitializerItem
      icon={icon && <FormOutlined />}
      {...others}
      key={'snapshotDetail'}
      onClick={async ({ item }) => {
        if (item.template) {
          const s = await getTemplateSchemaByMode(item);
          if (item.template.componentName === 'ReadPrettyFormItem') {
            const blockSchema = createSnapshotBlockSchema({
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
            createSnapshotBlockSchema({
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
