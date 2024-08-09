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

    const resolveTimeZone = (context) => {
      const serverTimeZone = this.database.options.timezone;
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

    this.beforeValidate = async (instance, options) => {
      const value = instance.get(name);

      if (!value && instance.isNewRecord && defaultToCurrentTime) {
        instance.set(name, new Date());
        return;
      }

      if (onUpdateToCurrentTime) {
        instance.set(name, new Date());
        return;
      }

      const dateTimezone = resolveTimeZone(options?.context);

      if (typeof value === 'string') {
        // string to date with timezone
        instance.set(name, new Date(`${value} ${dateTimezone}`));
      }
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

    this.on('beforeValidate', this.beforeValidate);
  }

  unbind() {
    super.unbind();
    this.off('beforeValidate', this.beforeValidate);
  }

  additionalSequelizeOptions(): {} {
    const { name } = this.options;
    return {
      set(value) {
        console.log(`set ${name}`, value);
        this.setDataValue(name, value);
      },
    };
  }
}

export interface DateFieldOptions extends BaseColumnFieldOptions {
  type: 'date';
}
