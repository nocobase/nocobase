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

class DatetimeNoTzTypeMySQL extends DataTypes.ABSTRACT {
  key = 'DATETIME';
}

class DatetimeNoTzTypePostgres extends DataTypes.ABSTRACT {
  key = 'TIMESTAMP';
}

export class DatetimeNoTzField extends Field {
  get dataType() {
    if (this.database.inDialect('postgres')) {
      return DatetimeNoTzTypePostgres;
    }

    if (this.database.isMySQLCompatibleDialect()) {
      return DatetimeNoTzTypeMySQL;
    }

    return DataTypes.DATE;
  }

  beforeSave = async (instances, options) => {
    instances = Array.isArray(instances) ? instances : [instances];
    const { name, defaultToCurrentTime, onUpdateToCurrentTime } = this.options;
    for (const instance of instances) {
      const value = instance.get(name);

      if (!value && instance.isNewRecord && defaultToCurrentTime) {
        instance.set(name, new Date());
        continue;
      }

      if (onUpdateToCurrentTime) {
        instance.set(name, new Date());
        continue;
      }
    }
  };

  additionalSequelizeOptions(): {} {
    const { name } = this.options;

    // @ts-ignore
    const timezone = this.database.options.rawTimezone || '+00:00';

    const isPg = this.database.inDialect('postgres');
    const isMySQLCompatibleDialect = this.database.isMySQLCompatibleDialect();

    return {
      get() {
        const val = this.getDataValue(name);

        if (val instanceof Date) {
          const momentVal = moment(val);
          return momentVal.format('YYYY-MM-DD HH:mm:ss');
        }

        return val;
      },

      set(val) {
        if (val == null) {
          return this.setDataValue(name, null);
        }

        const dateOffset = new Date().getTimezoneOffset();
        const momentVal = moment(val);
        if ((typeof val === 'string' && isIso8601(val)) || val instanceof Date) {
          momentVal.utcOffset(timezone);
          momentVal.utcOffset(-dateOffset, true);
        }

        if (isMySQLCompatibleDialect) {
          momentVal.millisecond(0);
        }

        const date = momentVal.toDate();

        return this.setDataValue(name, date);
      },
    };
  }

  bind() {
    super.bind();
    this.on('beforeSave', this.beforeSave);
    this.on('beforeBulkCreate', this.beforeSave);
  }

  unbind() {
    super.unbind();
    this.off('beforeSave', this.beforeSave);
    this.off('beforeBulkCreate', this.beforeSave);
  }
}

export interface DatetimeNoTzFieldOptions extends BaseColumnFieldOptions {
  type: 'datetimeNoTz';
}

function isIso8601(str) {
  const iso8601StrictRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
  return iso8601StrictRegex.test(str);
}
