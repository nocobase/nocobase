/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CollectionOptions, Model } from '@nocobase/database';

import options from '../../common/collections/workflowVersionStats';

export default {
  ...options,
  fields: options.fields.map((field) =>
    field.name === 'executed'
      ? {
          ...field,
          get(this: Model): number | string {
            const value: number | string = this.getDataValue('executed');
            if (typeof value === 'string') {
              const number = Number(value);
              // Normalize string counts while preserving precision for large bigint values.
              if (Number.isSafeInteger(number)) {
                return number;
              }
            }
            return value;
          },
        }
      : field,
  ),
} as CollectionOptions;
