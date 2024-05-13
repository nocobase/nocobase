/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { FormOutlined } from '@ant-design/icons';
import {
  useCollection_deprecated,
  useSchemaTemplateManager,
  useRecordCollectionDataSourceItems,
  useBlockRequestContext,
  useSchemaInitializer,
  SchemaInitializerItem,
  useSchemaInitializerItem,
  useAssociationName,
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
        'x-use-component-props': 'useFormBlockProps',
        'x-read-pretty': true,
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
  const association = useAssociationName();
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
