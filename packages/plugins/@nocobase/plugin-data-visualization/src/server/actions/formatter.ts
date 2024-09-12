/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import { Sequelize } from 'sequelize';

type Col = ReturnType<typeof Sequelize.col>;
type Literal = ReturnType<typeof Sequelize.literal>;
type Fn = ReturnType<typeof Sequelize.fn>;

const getOffsetMinutesFromTimezone = (timezone: string) => {
  const sign = timezone.charAt(0);
  timezone = timezone.slice(1);
  const [hours, minutes] = timezone.split(':');
  const hoursNum = Number(hours);
  const minutesNum = Number(minutes);
  const offset = hoursNum * 60 + minutesNum;
  return `${sign}${offset} minutes`;
};

export const dateFormatFn = (
  sequelize: Sequelize,
  dialect: string,
  field: Col | Literal | Fn | string,
  format: string,
  timezone?: string,
) => {
  switch (dialect) {
    case 'sqlite':
      format = format
        .replace(/YYYY/g, '%Y')
        .replace(/MM/g, '%m')
        .replace(/DD/g, '%d')
        .replace(/hh/g, '%H')
        .replace(/mm/g, '%M')
        .replace(/ss/g, '%S');
      if (timezone) {
        return sequelize.fn('strftime', format, field, getOffsetMinutesFromTimezone(timezone));
      }
      return sequelize.fn('strftime', format, field);
    case 'mysql':
    case 'mariadb':
      format = format
        .replace(/YYYY/g, '%Y')
        .replace(/MM/g, '%m')
        .replace(/DD/g, '%d')
        .replace(/hh/g, '%H')
        .replace(/mm/g, '%i')
        .replace(/ss/g, '%S');
      if (timezone) {
        return sequelize.fn(
          'date_format',
          sequelize.fn('convert_tz', field, process.env.TZ || '+00:00', timezone),
          format,
        );
      }
      return sequelize.fn('date_format', field, format);
    case 'postgres':
      format = format.replace(/hh/g, 'HH24').replace(/mm/g, 'MI').replace(/ss/g, 'SS');
      if (timezone) {
        if (typeof field === 'string') {
          field = sequelize.getQueryInterface().quoteIdentifiers(field);
        }
        const fieldWithTZ = sequelize.literal(
          `(${field} AT TIME ZONE CURRENT_SETTING('TIMEZONE') AT TIME ZONE '${timezone}')`,
        );
        return sequelize.fn('to_char', fieldWithTZ, format);
      }
      return sequelize.fn('to_char', field, format);
    default:
      return field;
  }
};

/* istanbul ignore next -- @preserve */
export const formatFn = (sequelize: Sequelize, dialect: string, field: Col | Literal, format: string) => {
  switch (dialect) {
    case 'sqlite':
    case 'postgres':
      return sequelize.fn('format', format, field);
    default:
      return field;
  }
};

const toTimeStampFn = (sequelize: Sequelize, dialect: string, field: string, options: any) => {
  const accuracy = options.uiSchema?.['x-component-props']?.accuracy || options.accuracy || 'second';
  const col = sequelize.getQueryInterface().quoteIdentifiers(field);
  switch (dialect) {
    case 'sqlite':
      if (accuracy === 'millisecond') {
        return sequelize.literal(`DATETIME(ROUND(${col} / 1000), 'unixepoch')`);
      }
      return sequelize.literal(`DATETIME(${col}, 'unixepoch')`);
    case 'mysql':
    case 'mariadb':
      if (accuracy === 'millisecond') {
        return sequelize.fn('from_unixtime', sequelize.literal(`ROUND(${col} / 1000)`));
      }
      return sequelize.fn('from_unixtime', sequelize.col(field));
    case 'postgres':
      if (accuracy === 'millisecond') {
        return sequelize.fn('to_timestamp', sequelize.literal(`ROUND(${col} / 1000)`));
      }
      return sequelize.fn('to_timestamp', sequelize.col(field));
    default:
      return sequelize.col(field);
  }
};

export const formatter = (options: {
  sequelize: Sequelize;
  type: string;
  field: string;
  format: string;
  options?: any;
  timezone?: string;
}) => {
  const { sequelize, type, field: fieldName, format, timezone, options: fieldOptions } = options;
  const field = sequelize.col(fieldName);
  const dialect = sequelize.getDialect();
  const f = toTimeStampFn(sequelize, dialect, fieldName, fieldOptions);
  switch (type) {
    case 'date':
    case 'datetime':
    case 'datetimeTz':
      return dateFormatFn(sequelize, dialect, field, format, timezone);
    case 'datetimeNoTz':
    case 'dateOnly':
    case 'time':
      return dateFormatFn(sequelize, dialect, field, format);
    case 'unixTimestamp':
      return dateFormatFn(sequelize, dialect, f, format, timezone);
    default:
      return formatFn(sequelize, dialect, field, format);
  }
};
