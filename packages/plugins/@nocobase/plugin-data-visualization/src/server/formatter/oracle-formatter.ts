/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Col, Formatter } from './formatter';

export class OracleFormatter extends Formatter {
  convertFormat(format: string) {
    return format.replace(/hh/g, 'HH24').replace(/mm/g, 'MI').replace(/ss/g, 'SS');
  }
  formatDate(field: Col, format: string, timezoneOffset?: string) {
    format = this.convertFormat(format);
    const timezone = this.getTimezoneByOffset(timezoneOffset);
    if (timezone) {
      const col = this.sequelize.getQueryInterface().quoteIdentifiers((field as Col).col);
      const fieldWithTZ = this.sequelize.literal(`(${col} AT TIME ZONE '${timezone}')`);
      return this.sequelize.fn('to_char', fieldWithTZ, format);
    }
    return this.sequelize.fn('to_char', field, format);
  }

  formatUnixTimeStamp(
    field: string,
    format: string,
    accuracy: 'second' | 'millisecond' = 'second',
    timezoneOffset?: string,
  ) {
    format = this.convertFormat(format);
    const col = this.sequelize.getQueryInterface().quoteIdentifiers(field);
    const timezone = this.getTimezoneByOffset(timezoneOffset);
    if (timezone) {
      if (accuracy === 'millisecond') {
        return this.sequelize.fn(
          'to_char',
          this.sequelize.literal(`to_timestamp(ROUND(${col} / 1000)) AT TIME ZONE '${timezone}'`),
          format,
        );
      }
      return this.sequelize.fn(
        'to_char',
        this.sequelize.literal(`to_timestamp(${col}) AT TIME ZONE '${timezone}'`),
        format,
      );
    }
    if (accuracy === 'millisecond') {
      return this.sequelize.fn('to_char', this.sequelize.literal(`to_timestamp(ROUND(${col} / 1000)`), format);
    }
    return this.sequelize.fn('to_char', this.sequelize.literal(`to_timestamp(${col})`), format);
  }
}
