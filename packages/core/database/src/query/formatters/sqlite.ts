/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { QueryFormatter, Col } from '../formatter';

export class SQLiteQueryFormatter extends QueryFormatter {
  convertFormat(format: string) {
    return format
      .replace(/YYYY/g, '%Y')
      .replace(/MM/g, '%m')
      .replace(/DD/g, '%d')
      .replace(/hh/g, '%H')
      .replace(/mm/g, '%M')
      .replace(/ss/g, '%S');
  }

  formatDate(field: Col, format: string, timezone?: string) {
    const fmt = this.convertFormat(format);
    if (timezone && /^[+-]\d{1,2}:\d{2}$/.test(timezone)) {
      return this.sequelize.fn('strftime', fmt, field, this.getOffsetExpression(timezone));
    }
    return this.sequelize.fn('strftime', fmt, field);
  }

  formatUnixTimestamp(field: string, format: string, accuracy: 'second' | 'millisecond' = 'second', timezone?: string) {
    const quoted = this.sequelize.getQueryInterface().quoteIdentifiers(field);
    const base =
      accuracy === 'millisecond' ? this.sequelize.literal(`ROUND(${quoted} / 1000)`) : this.sequelize.col(field);
    const args: any[] = [base, 'unixepoch'];
    if (timezone && /^[+-]\d{1,2}:\d{2}$/.test(timezone)) {
      args.push(this.getOffsetExpression(timezone));
    }
    return this.sequelize.fn('strftime', this.convertFormat(format), this.sequelize.fn('DATETIME', ...args));
  }
}
