/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { QueryFormatter, Col } from '../formatter';

export class PostgresQueryFormatter extends QueryFormatter {
  convertFormat(format: string) {
    return format.replace(/hh/g, 'HH24').replace(/mm/g, 'MI').replace(/ss/g, 'SS');
  }

  formatDate(field: Col, format: string, timezone?: string) {
    const fmt = this.convertFormat(format);
    const resolvedTimezone = this.getTimezoneByOffset(timezone);
    if (resolvedTimezone) {
      const quoted = this.sequelize.getQueryInterface().quoteIdentifiers((field as any).col);
      return this.sequelize.fn(
        'to_char',
        this.sequelize.literal(`(${quoted} AT TIME ZONE '${resolvedTimezone}')`),
        fmt,
      );
    }
    return this.sequelize.fn('to_char', field, fmt);
  }

  formatUnixTimestamp(field: string, format: string, accuracy: 'second' | 'millisecond' = 'second', timezone?: string) {
    const quoted = this.sequelize.getQueryInterface().quoteIdentifiers(field);
    const timestamp = accuracy === 'millisecond' ? `to_timestamp(ROUND(${quoted} / 1000))` : `to_timestamp(${quoted})`;
    const resolvedTimezone = this.getTimezoneByOffset(timezone);
    const literal = resolvedTimezone ? `${timestamp} AT TIME ZONE '${resolvedTimezone}'` : timestamp;
    return this.sequelize.fn('to_char', this.sequelize.literal(literal), this.convertFormat(format));
  }
}
