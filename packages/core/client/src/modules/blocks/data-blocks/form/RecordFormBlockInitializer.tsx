/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FormOutlined } from '@ant-design/icons';
import React, { useCallback } from 'react';
import { SchemaInitializerItem, useSchemaInitializer, useSchemaInitializerItem } from '../../../../application';
import { useCollection_deprecated } from '../../../../collection-manager';
import { useAssociationName, useCollectionManager } from '../../../../data-source';
import { useRecordCollectionDataSourceItems } from '../../../../schema-initializer/utils';
import { useBlockTemplateContext, useSchemaTemplateManager } from '../../../../schema-templates';
import { createEditFormBlockUISchema } from './createEditFormBlockUISchema';

/**
 * @deprecated
 */
export const RecordFormBlockInitializer = () => {
  const itemConfig = useSchemaInitializerItem();
  const { targetCollection, ...others } = itemConfig;
  const { insert } = useSchemaInitializer();
  const { getTemplateSchemaByMode } = useSchemaTemplateManager();
  const currentCollection = useCollection_deprecated();
  const collection = targetCollection || currentCollection;

  const { createEditFormBlock, templateWrap } = useCreateEditFormBlock();

  return (
    <SchemaInitializerItem
      icon={<FormOutlined />}
      {...others}
      onClick={async ({ item }) => {
        if (item.template) {
          const template = await getTemplateSchemaByMode(item);
          insert(templateWrap(template, { item }));
        } else {
          createEditFormBlock({ item });
        }
      }}
      items={useRecordCollectionDataSourceItems('FormItem', null, collection?.name)}
    />
  );
};

export function useCreateEditFormBlock() {
  const { insert } = useSchemaInitializer();
  const association = useAssociationName();
  const cm = useCollectionManager();
  const { componentNamePrefix } = useBlockTemplateContext();

  const createEditFormBlock = useCallback(
    ({ item }) => {
      const collectionName = item.collectionName || item.name;
      const collection = cm.getCollection(collectionName);
      insert(
        createEditFormBlockUISchema(
          association
            ? {
                association,
                collectionName: collection.isInherited() ? collectionName : undefined,
                dataSource: item.dataSource,
                isCurrent: true,
              }
            : {
                collectionName,
                dataSource: item.dataSource,
              },
        ),
      );
    },
    [association, cm, insert],
  );

  const templateWrap = useCallback(
    (templateSchema, { item }) => {
      if (item.template.componentName === `${componentNamePrefix}FormItem`) {
        const collectionName = item.collectionName || item.name;
        const collection = cm.getCollection(collectionName);
        const blockSchema = createEditFormBlockUISchema(
          association
            ? {
                association,
                collectionName: collection.isInherited() ? collectionName : undefined,
                dataSource: item.dataSource,
                templateSchema: templateSchema,
                isCurrent: true,
              }
            : {
                collectionName,
                dataSource: item.dataSource,
                templateSchema: templateSchema,
              },
        );
        if (item.mode === 'reference') {
          blockSchema['x-template-key'] = item.template.key;
        }
        return blockSchema;
      } else {
        return templateSchema;
      }
    },
    [association, cm, componentNamePrefix],
  );

  return { createEditFormBlock, templateWrap };
}
