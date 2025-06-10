/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DataTypes } from 'sequelize';
import { BaseColumnFieldOptions, Field } from './field';

export class TextField extends Field {
  get dataType() {
    if (this.database.inDialect('mysql', 'mariadb') && this.options.length) {
      return DataTypes.TEXT(this.options.length);
    }
    return DataTypes.TEXT;
  }

  init() {
    if (this.database.inDialect('mysql', 'mariadb')) {
      this.options.defaultValue = null;
    }
  }

  additionalSequelizeOptions() {
    const { name, trim, unique } = this.options;

    return {
      set(value) {
        if (unique && value === '') {
          value = null;
        }
        if (value == null) {
          this.setDataValue(name, null);
          return;
        }
        if (typeof value !== 'string') {
          value = value.toString();
        }
        this.setDataValue(name, trim ? value.trim() : value);
      },
    };
  }
}

export interface TextFieldOptions extends BaseColumnFieldOptions {
  type: 'text';
  length?: 'tiny' | 'medium' | 'long';
  trim?: boolean;
}
