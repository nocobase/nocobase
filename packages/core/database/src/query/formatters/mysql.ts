/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { QueryFormatter, Col } from '../formatter';

export class MySQLQueryFormatter extends QueryFormatter {
  convertFormat(format: string) {
    return format
      .replace(/YYYY/g, '%Y')
      .replace(/MM/g, '%m')
      .replace(/DD/g, '%d')
      .replace(/hh/g, '%H')
      .replace(/mm/g, '%i')
      .replace(/ss/g, '%S');
  }

  formatDate(field: Col, format: string, timezone?: string, _preserveLocalTime?: boolean) {
    const fmt = this.convertFormat(format);
    const resolvedTimezone = this.getTimezoneByOffset(timezone);
    if (resolvedTimezone) {
      return this.sequelize.fn(
        'date_format',
        this.sequelize.fn('convert_tz', field, process.env.TZ || 'UTC', resolvedTimezone),
        fmt,
      );
    }
    return this.sequelize.fn('date_format', field, fmt);
  }

  formatUnixTimestamp(field: string, format: string, accuracy: 'second' | 'millisecond' = 'second', timezone?: string) {
    const fmt = this.convertFormat(format);
    const quoted = this.sequelize.getQueryInterface().quoteIdentifiers(field);
    const resolvedTimezone = this.getTimezoneByOffset(timezone);
    const timestamp =
      accuracy === 'millisecond'
        ? this.sequelize.fn('from_unixtime', this.sequelize.literal(`ROUND(${quoted} / 1000)`))
        : this.sequelize.fn('from_unixtime', this.sequelize.col(field));

    if (resolvedTimezone) {
      return this.sequelize.fn(
        'date_format',
        this.sequelize.fn('convert_tz', timestamp, process.env.TZ || 'UTC', resolvedTimezone),
        fmt,
      );
    }

    return accuracy === 'millisecond'
      ? this.sequelize.fn('from_unixtime', this.sequelize.literal(`ROUND(${quoted} / 1000)`), fmt)
      : this.sequelize.fn('from_unixtime', this.sequelize.col(field), fmt);
  }
}
