/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CollectionOptions, Model } from '@nocobase/database';

import options from '../../common/collections/workflows';

export default {
  ...options,
  fields: options.fields.map((field) =>
    field.name === 'enabled'
      ? {
          ...field,
          get(this: Model): boolean {
            let value: unknown = this.getDataValue('enabled');
            if (typeof value === 'boolean') {
              return value;
            }
            // KingBase may return boolean columns as "0" or "1".
            if (typeof value === 'string') {
              value = Number(value);
            }
            return typeof value === 'number' && value === 1;
          },
        }
      : field,
  ),
} as CollectionOptions;
