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
import { SchemaInitializerItem, useSchemaInitializer, useSchemaInitializerItem } from '../../application';

// Block
export const BlockInitializer = (props) => {
  const { item, schema, ...others } = props;
  const { insert } = useSchemaInitializer();
  return (
    <SchemaInitializerItem
      {...others}
      onClick={() => {
        const s = merge(schema || {}, item.schema || {});
        item?.schemaInitialize?.(s);
        insert(s);
        props.onClick?.(s);
      }}
    />
  );
};

export const BlockItemInitializer = () => {
  const itemConfig = useSchemaInitializerItem();
  const { schema, ...others } = itemConfig;
  return <BlockInitializer {...others} item={itemConfig} />;
};
