/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FormOutlined } from '@ant-design/icons';
import {
  SchemaInitializerItem,
  useCollection_deprecated,
  useSchemaInitializer,
  useSchemaInitializerItem,
  useAssociationName,
} from '@nocobase/client';
import React from 'react';
import { createBulkEditBlockUISchema } from './createBulkEditBlockUISchema';

export const CreateFormBulkEditBlockInitializer = () => {
  const itemConfig = useSchemaInitializerItem();
  const { onCreateBlockSchema, componentType, createBlockSchema, ...others } = itemConfig;
  const { insert } = useSchemaInitializer();
  const association = useAssociationName();
  const collection = useCollection_deprecated();
  return (
    <SchemaInitializerItem
      icon={<FormOutlined />}
      {...others}
      onClick={() => {
        insert(
          createBulkEditBlockUISchema({
            association,
            collectionName: collection.name,
            dataSource: collection.dataSource,
          }),
        );
      }}
    />
  );
};
