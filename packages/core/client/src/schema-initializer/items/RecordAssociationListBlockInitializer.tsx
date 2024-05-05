/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { TableOutlined } from '@ant-design/icons';
import React, { useCallback } from 'react';

import { SchemaInitializerItem, useSchemaInitializer, useSchemaInitializerItem } from '../../application';
import { useCollectionManager_deprecated } from '../../collection-manager';
import { createListBlockUISchema } from '../../modules/blocks/data-blocks/list/createListBlockUISchema';
import { useSchemaTemplateManager } from '../../schema-templates';
import { useRecordCollectionDataSourceItems } from '../utils';

export const RecordAssociationListBlockInitializer = () => {
  const itemConfig = useSchemaInitializerItem();
  const { onCreateBlockSchema, componentType, createBlockSchema, ...others } = itemConfig;
  const { insert } = useSchemaInitializer();
  const { getTemplateSchemaByMode } = useSchemaTemplateManager();
  const { getCollection } = useCollectionManager_deprecated();
  const field = itemConfig.field;
  const collection = getCollection(field.target);
  const resource = `${field.collectionName}.${field.name}`;

  return (
    <SchemaInitializerItem
      icon={<TableOutlined />}
      {...others}
      onClick={async ({ item }) => {
        if (item.template) {
          const s = await getTemplateSchemaByMode(item);
          insert(s);
        } else {
          insert(
            createListBlockUISchema({
              rowKey: collection.filterTargetKey,
              dataSource: collection.dataSource,
              association: resource,
            }),
          );
        }
      }}
      items={useRecordCollectionDataSourceItems('List', itemConfig, field.target, resource)}
    />
  );
};

export function useCreateAssociationListBlock() {
  const { insert } = useSchemaInitializer();
  const { getCollection } = useCollectionManager_deprecated();

  const createAssociationListBlock = useCallback(
    ({ item }) => {
      const field = item.associationField;
      const collection = getCollection(field.target);

      insert(
        createListBlockUISchema({
          rowKey: collection.filterTargetKey,
          dataSource: collection.dataSource,
          association: `${field.collectionName}.${field.name}`,
        }),
      );
    },
    [getCollection, insert],
  );

  return { createAssociationListBlock };
}
