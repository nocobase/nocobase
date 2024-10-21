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
import { createDetailsUISchema } from './createDetailsUISchema';

export const RecordReadPrettyFormBlockInitializer = () => {
  const itemConfig = useSchemaInitializerItem();
  const { icon = true, targetCollection, ...others } = itemConfig;
  const currentCollection = useCollection_deprecated();
  const collection = targetCollection || currentCollection;
  const { createSingleDetailsSchema } = useCreateSingleDetailsSchema();

  return (
    <SchemaInitializerItem
      icon={icon && <FormOutlined />}
      {...others}
      onClick={(options) => createSingleDetailsSchema(options)}
      items={useRecordCollectionDataSourceItems('ReadPrettyFormItem', null, collection?.name)}
    />
  );
};

export function useCreateSingleDetailsSchema() {
  const { insert } = useSchemaInitializer();
  const { getTemplateSchemaByMode } = useSchemaTemplateManager();
  const association = useAssociationName();
  const cm = useCollectionManager();
  const { componentNamePrefix } = useBlockTemplateContext();

  const templateWrap = useCallback(
    (templateSchema, options) => {
      const { item } = options;
      if (item.template.componentName === `${componentNamePrefix}ReadPrettyFormItem`) {
        const collectionName = item.collectionName || item.name;
        const collection = cm.getCollection(collectionName);
        const blockSchema = createDetailsUISchema(
          association
            ? {
                association,
                // see: https://applink.feishu.cn/client/message/link/open?token=AmP9n9dkwcABZrr3nBdAwAI%3D
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

  const createSingleDetailsSchema = useCallback(
    async ({ item }) => {
      if (item.template) {
        const template = await getTemplateSchemaByMode(item);
        insert(templateWrap(template, { item }));
      } else {
        const collectionName = item.collectionName || item.name;
        const collection = cm.getCollection(collectionName);
        insert(
          createDetailsUISchema(
            association
              ? {
                  association,
                  // see: https://applink.feishu.cn/client/message/link/open?token=AmP9n9dkwcABZrr3nBdAwAI%3D
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
      }
    },
    [association, cm, getTemplateSchemaByMode, insert, templateWrap],
  );

  return { createSingleDetailsSchema, templateWrap };
}
