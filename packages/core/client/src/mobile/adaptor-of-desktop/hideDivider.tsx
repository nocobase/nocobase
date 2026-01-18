/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Schema } from '@nocobase/utils';

export function hideDivider(schema: Schema) {
  schema?.mapProperties((innerSchema) => {
    if (innerSchema['x-component'] === 'Grid') {
      innerSchema['x-component-props'] = {
        ...innerSchema['x-component-props'],
        showDivider: false,
      };
    }
  });

  return schema;
}
