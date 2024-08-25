/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { BaseColumnFieldOptions, Field } from './field';
import { DataTypes } from 'sequelize';
import moment from 'moment';

export class DatetimeNoTzField extends Field {
  get dataType() {
    if (this.database.inDialect('postgres')) {
      return DataTypes.STRING;
    }

    return DataTypes.DATE(3);
  }

  init() {
    const { name, defaultToCurrentTime, onUpdateToCurrentTime } = this.options;

    this.beforeSave = async (instance, options) => {
      const value = instance.get(name);

      if (!value && instance.isNewRecord && defaultToCurrentTime) {
        instance.set(name, new Date());
        return;
      }

      if (onUpdateToCurrentTime) {
        instance.set(name, new Date());
        return;
      }
    };
  }

  additionalSequelizeOptions(): {} {
    const { name } = this.options;
    const timezone = this.database.options.timezone || '+00:00';

    return {
      get() {
        return this.getDataValue(name);
      },

      set(val) {
        if (val && val instanceof Date) {
          // format to YYYY-MM-DD HH:mm:ss
          const momentVal = moment(val).utcOffset(timezone);
          val = momentVal.format('YYYY-MM-DD HH:mm:ss');
        }

        return this.setDataValue(name, val);
      },
    };
  }

  bind() {
    super.bind();
    this.on('beforeSave', this.beforeSave);
  }

  unbind() {
    super.unbind();
    this.off('beforeSave', this.beforeSave);
  }
}

export interface DatetimeNoTzFieldOptions extends BaseColumnFieldOptions {
  type: 'datetimeNoTz';
}
