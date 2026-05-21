/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Sequelize } from 'sequelize';
import moment from 'moment-timezone';

export type Col = ReturnType<typeof Sequelize.col>;
export type Literal = ReturnType<typeof Sequelize.literal>;
export type Fn = ReturnType<typeof Sequelize.fn>;

export abstract class Formatter {
  sequelize: Sequelize;
  rawTimezone?: string;

  constructor(sequelize: Sequelize, rawTimezone?: string) {
    this.sequelize = sequelize;
    this.rawTimezone = rawTimezone;
  }

  abstract formatDate(field: Col, format: string, timezone?: string, preserveLocalTime?: boolean): Fn | Col;

  abstract formatUnixTimeStamp(
    field: string,
    format: string,
    accuracy?: 'second' | 'millisecond',
    timezone?: string,
  ): any;

  protected getTimezoneByOffset(offset?: string) {
    if (!offset) {
      return;
    }
    if (moment.tz.zone(offset)) {
      return offset;
    }
    if (/^[+-]\d{1,2}:\d{2}$/.test(offset)) {
      return offset;
    }
    return;
  }

  convertFormat(format: string): any {
    return format;
  }

  format(options: { type: string; field: string; format: string; options?: any; timezone?: string }): any {
    const { type, field, format, timezone, options: fieldOptions } = options;
    const col = this.sequelize.col(field);
    switch (type) {
      case 'date':
      case 'datetime':
      case 'datetimeTz':
        return this.formatDate(col, format, timezone);
      case 'datetimeNoTz':
        return this.formatDate(col, format, undefined, true);
      case 'dateOnly':
      case 'time':
        return this.formatDate(col, format);
      case 'unixTimestamp': {
        const accuracy = fieldOptions?.uiSchema?.['x-component-props']?.accuracy || fieldOptions?.accuracy || 'second';
        return this.formatUnixTimeStamp(field, format, accuracy, timezone);
      }
      default:
        return this.sequelize.col(field);
    }
  }
}
