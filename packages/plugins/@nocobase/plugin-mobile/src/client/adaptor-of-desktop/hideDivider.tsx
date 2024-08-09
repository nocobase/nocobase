/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Schema } from '@nocobase/utils';

// 隐藏 Grid 组件的左右 divider，因为移动端不需要在一行中并列展示两个区块
export function hideDivider(schema: Schema) {
  schema?.mapProperties((schema) => {
    if (schema['x-component'] === 'Grid') {
      schema['x-component-props'] = {
        ...schema['x-component-props'],
        showDivider: false,
      };
    }
  });

  return schema;
}
