/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { BaseColumnFieldOptions, Field, FieldContext, Model } from '@nocobase/database';
import { DataTypes } from 'sequelize';
import { encrypt, decrypt } from './utils';

export interface EncryptionFieldOptions extends BaseColumnFieldOptions {
  type: 'encryption';
}

export class EncryptionField extends Field {
  get dataType() {
    return DataTypes.STRING;
  }

  constructor(options?: any, context?: FieldContext) {
    const { name } = options;
    super(
      {
        get() {
          const value = this.getDataValue(name);
          if (!value) return null;
          return decrypt(value);
        },
        set(value) {
          if (!value?.length) value = null;
          else {
            value = encrypt(value);
          }
          this.setDataValue(name, value);
        },
        ...options,
      },
      context,
    );
  }
}
