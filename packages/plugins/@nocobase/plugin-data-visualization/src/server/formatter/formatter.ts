/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Sequelize } from 'sequelize';

export type Col = {
  col: string;
};
export type Literal = object;

export class Formatter {
  constructor(protected readonly sequelize: Sequelize) {}

  convertFormat(format: string): string {
    return format;
  }

  getTimezoneByOffset(timezoneOffset?: string): string | null {
    return timezoneOffset || null;
  }

  formatDate(field: Col, format: string, timezoneOffset?: string): any {
    return this.sequelize.fn('date_format', field, this.convertFormat(format));
  }

  formatUnixTimeStamp(
    field: string,
    format: string,
    accuracy: 'second' | 'millisecond' = 'second',
    timezoneOffset?: string,
  ): any {
    return this.sequelize.fn('from_unixtime', this.sequelize.col(field), this.convertFormat(format));
  }
}
