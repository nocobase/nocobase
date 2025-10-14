/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SchemaInitializerItemType, useSchemaInitializer, useCurrentSchema, useDesignable } from '@nocobase/client';
import { customRefreshActionSchema } from './schema';
import { ActionName } from './constants';
import { useT } from '../../../../locale';
import { ISchema, useField, useFieldSchema } from '@formily/react';

export const customRefreshActionInitializerItem: SchemaInitializerItemType = {
  type: 'switch',
  name: ActionName,
  useComponentProps() {
    const { exists, remove } = useCurrentSchema(customRefreshActionSchema['x-action'], 'x-action');
    const { insert } = useSchemaInitializer();
    const t = useT();
    return {
      checked: exists,
      title: t(ActionName),
      onClick() {
        // 如果已插入，则移除
        if (exists) {
          return remove();
        }
        // 新插入子节点
        insert(customRefreshActionSchema);
      },
    };
  },
};
