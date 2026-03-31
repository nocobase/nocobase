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
import moment from 'moment';

const datetimeRegex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;

function isValidDatetime(str) {
  return datetimeRegex.test(str);
}

export class DateField extends Field {
  get dataType(): any {
    return DataTypes.DATE(3);
  }

  get timezone() {
    return this.isGMT() ? '+00:00' : null;
  }

  getProps() {
    return this.options?.uiSchema?.['x-component-props'] || {};
  }

  isDateOnly() {
    const props = this.getProps();
    return !props.showTime;
  }

  isGMT() {
    const props = this.getProps();
    return props.gmt;
  }

  init() {
    const { name, defaultToCurrentTime, onUpdateToCurrentTime, timezone } = this.options;

    this.resolveTimeZone = (context) => {
      // @ts-ignore
      const serverTimeZone = this.database.options.rawTimezone;
      if (timezone === 'server') {
        return serverTimeZone;
      }

      if (timezone === 'client') {
        return context?.timezone || serverTimeZone;
      }

      if (timezone) {
        return timezone;
      }

      return serverTimeZone;
    };

    this.beforeSave = async (instances, options) => {
      instances = Array.isArray(instances) ? instances : [instances];
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

    if (this.options.defaultValue && this.database.isMySQLCompatibleDialect()) {
      if (typeof this.options.defaultValue === 'string' && isIso8601(this.options.defaultValue)) {
        this.options.defaultValue = moment(this.options.defaultValue)
          .utcOffset(this.resolveTimeZone())
          .format('YYYY-MM-DD HH:mm:ss');
      }
    }
  }

  setter(value, options) {
    if (value === null) {
      return value;
    }
    if (value instanceof Date) {
      return value;
    }

    if (typeof value === 'string' && isValidDatetime(value)) {
      const dateTimezone = this.resolveTimeZone(options?.context);
      const dateString = `${value} ${dateTimezone}`;
      return new Date(dateString);
    }

    return value;
  }

  additionalSequelizeOptions() {
    const { name } = this.options;
    // @ts-ignore
    const serverTimeZone = this.database.options.rawTimezone;

    return {
      get() {
        const value = this.getDataValue(name);

        if (value === null || value === undefined) {
          return value;
        }

        if (typeof value === 'string' && isValidDatetime(value)) {
          const dateString = `${value} ${serverTimeZone}`;
          return new Date(dateString);
        }

        return new Date(value);
      },
    };
  }

  bind() {
    super.bind();

    if (this.options.interface === 'createdAt') {
      const { model } = this.context.collection;
      // @ts-ignore
      model._timestampAttributes.createdAt = this.name;
      // @ts-ignore
      model.refreshAttributes();
    }

    if (this.options.interface === 'updatedAt') {
      const { model } = this.context.collection;
      // @ts-ignore
      model._timestampAttributes.updatedAt = this.name;
      // @ts-ignore
      model.refreshAttributes();
    }

    this.on('beforeSave', this.beforeSave);
    this.on('beforeBulkCreate', this.beforeSave);
  }

  unbind() {
    super.unbind();
    this.off('beforeSave', this.beforeSave);
    this.off('beforeBulkCreate', this.beforeSave);
  }
}

export interface DateFieldOptions extends BaseColumnFieldOptions {
  type: 'date';
}

function isIso8601(str) {
  const iso8601StrictRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
  return iso8601StrictRegex.test(str);
}
