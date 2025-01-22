/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Col, Formatter } from './formatter';
import moment from 'moment-timezone';

export class MySQLFormatter extends Formatter {
  convertFormat(format: string) {
    return format
      .replace(/YYYY/g, '%Y')
      .replace(/MM/g, '%m')
      .replace(/DD/g, '%d')
      .replace(/hh/g, '%H')
      .replace(/mm/g, '%i')
      .replace(/ss/g, '%S');
  }

  formatDate(field: Col, format: string, timezoneOffset?: string) {
    const tz = moment.tz(process.env.TZ || 'UTC').format('Z');
    format = this.convertFormat(format);
    if (timezoneOffset && tz !== timezoneOffset) {
      return this.sequelize.fn('date_format', this.sequelize.fn('convert_tz', field, tz, timezoneOffset), format);
    }
    return this.sequelize.fn('date_format', field, format);
  }

  formatUnixTimeStamp(
    field: string,
    format: string,
    accuracy: 'second' | 'millisecond' = 'second',
    timezoneOffset?: string,
  ) {
    const col = this.sequelize.getQueryInterface().quoteIdentifiers(field);
    const timezone = this.getTimezoneByOffset(timezoneOffset);
    format = this.convertFormat(format);
    if (timezone) {
      if (accuracy === 'millisecond') {
        return this.sequelize.fn(
          'date_format',
          this.sequelize.fn(
            'convert_tz',
            this.sequelize.fn('from_unixtime', this.sequelize.literal(`ROUND(${col} / 1000)`)),
            process.env.TZ || 'UTC',
            timezone,
          ),
          format,
        );
      }
      return this.sequelize.fn(
        'date_format',
        this.sequelize.fn(
          'convert_tz',
          this.sequelize.fn('from_unixtime', this.sequelize.col(field)),
          process.env.TZ || 'UTC',
          timezone,
        ),
        format,
      );
    }
    if (accuracy === 'millisecond') {
      return this.sequelize.fn('from_unixtime', this.sequelize.literal(`ROUND(${col} / 1000)`), format);
    }
    return this.sequelize.fn('from_unixtime', this.sequelize.col(field), format);
  }
}
