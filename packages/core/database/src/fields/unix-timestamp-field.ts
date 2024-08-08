/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DataTypes } from 'sequelize';
import { DateField } from './date-field';
import { BaseColumnFieldOptions } from './field';

export class UnixTimestampField extends DateField {
  get dataType() {
    return DataTypes.BIGINT;
  }

  additionalSequelizeOptions(): {} {
    const { name } = this.options;

    return {
      get() {
        const value = this.getDataValue(name);
        if (value === null || value === undefined) {
          return value;
        }

        // unix timestamp to date
        return new Date(value * 1000);
      },
      set(value) {
        if (value === null || value === undefined) {
          this.setDataValue(name, value);
        } else {
          // date to unix timestamp
          this.setDataValue(name, Math.floor(new Date(value).getTime() / 1000));
        }
      },
    };
  }
}

export interface UnixTimestampFieldOptions extends BaseColumnFieldOptions {
  type: 'unix-timestamp';
}
