/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { merge } from '@formily/shared';
import React from 'react';

import { ISchema, SchemaInitializerItem, useSchemaInitializer, useSchemaInitializerItem } from '../../application';

interface ActionInitializerItemProps {
  /**
   * 被创建的操作按钮的 schema
   */
  schema?: ISchema;
}

export const ActionInitializerItem = (props: ActionInitializerItemProps) => {
  const itemConfig = useSchemaInitializerItem();
  const { insert } = useSchemaInitializer();

  return (
    <SchemaInitializerItem
      title={itemConfig.title}
      onClick={() => {
        const s = merge(props.schema || {}, itemConfig.schema || {});
        itemConfig?.schemaInitialize?.(s);
        insert(s);
      }}
    />
  );
};
