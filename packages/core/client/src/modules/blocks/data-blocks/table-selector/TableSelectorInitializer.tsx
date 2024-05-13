/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FormOutlined } from '@ant-design/icons';
import React from 'react';

import { useCollection_deprecated } from '../../../../collection-manager';
import { createTableSelectorUISchema } from './createTableSelectorUISchema';
import { SchemaInitializerItem, useSchemaInitializer, useSchemaInitializerItem } from '../../../../application';

export const TableSelectorInitializer = () => {
  const itemConfig = useSchemaInitializerItem();
  const { onCreateBlockSchema, componentType, createBlockSchema, ...others } = itemConfig;
  const { insert } = useSchemaInitializer();
  const collection = useCollection_deprecated();
  return (
    <SchemaInitializerItem
      icon={<FormOutlined />}
      {...others}
      onClick={async () => {
        insert(
          createTableSelectorUISchema({
            rowKey: collection.filterTargetKey,
            collectionName: collection.name,
            dataSource: collection.dataSource,
          }),
        );
      }}
    />
  );
};
