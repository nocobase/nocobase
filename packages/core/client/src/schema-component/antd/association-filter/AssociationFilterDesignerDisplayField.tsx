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

import { useCurrentSchema } from '../../../schema-initializer/utils';
import { SchemaInitializerSwitch, useSchemaInitializer, useSchemaInitializerItem } from '../../../application';

export const AssociationFilterDesignerDisplayField = () => {
  const itemConfig = useSchemaInitializerItem();
  const { schema } = itemConfig;
  const { exists, remove } = useCurrentSchema(schema.name, 'name', itemConfig.find, itemConfig.remove);
  const { insert } = useSchemaInitializer();
  return (
    <SchemaInitializerSwitch
      checked={exists}
      title={itemConfig.title}
      onClick={() => {
        if (exists) {
          return remove();
        }
        const s = merge(schema || {}, itemConfig.schema || {});
        itemConfig?.schemaInitialize?.(s);
        insert(s);
      }}
    />
  );
};
