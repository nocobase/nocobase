/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DataTypes } from 'sequelize';
import { BaseColumnFieldOptions, Field, FieldContext } from './field';

export class StringField extends Field {
  constructor(options?: any, context?: FieldContext) {
    super(
      {
        set(value) {
          if (value && options.trim) {
            this.setDataValue(options.name, value.trim());
          } else {
            this.setDataValue(options.name, value);
          }
        },
        ...options,
      },
      context,
    );
  }

  get dataType() {
    if (this.options.length) {
      return DataTypes.STRING(this.options.length);
    }

    return DataTypes.STRING;
  }
}

export interface StringFieldOptions extends BaseColumnFieldOptions {
  type: 'string';
  length?: number;
  trim?: boolean;
}
