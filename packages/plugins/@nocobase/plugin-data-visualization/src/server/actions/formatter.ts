/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import { Sequelize } from 'sequelize';

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
  field: string,
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
        return sequelize.fn('strftime', format, sequelize.col(field), getOffsetMinutesFromTimezone(timezone));
      }
      return sequelize.fn('strftime', format, sequelize.col(field));
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
          sequelize.fn('convert_tz', sequelize.col(field), process.env.DB_TIMEZONE || '+00:00', timezone),
          format,
        );
      }
      return sequelize.fn('date_format', sequelize.col(field), format);
    case 'postgres':
      format = format.replace(/hh/g, 'HH24').replace(/mm/g, 'MI').replace(/ss/g, 'SS');
      if (timezone) {
        const fieldWithTZ = sequelize.literal(
          `(${sequelize
            .getQueryInterface()
            .quoteIdentifiers(field)} AT TIME ZONE CURRENT_SETTING('TIMEZONE') AT TIME ZONE '${timezone}')`,
        );
        return sequelize.fn('to_char', fieldWithTZ, format);
      }
      return sequelize.fn('to_char', sequelize.col(field), format);
    default:
      return sequelize.col(field);
  }
};

/* istanbul ignore next -- @preserve */
export const formatFn = (sequelize: Sequelize, dialect: string, field: string, format: string) => {
  switch (dialect) {
    case 'sqlite':
    case 'postgres':
      return sequelize.fn('format', format, sequelize.col(field));
    default:
      return field;
  }
};

export const formatter = (sequelize: Sequelize, type: string, field: string, format: string, timezone?: string) => {
  const dialect = sequelize.getDialect();
  switch (type) {
    case 'date':
    case 'datetime':
    case 'time':
      return dateFormatFn(sequelize, dialect, field, format, timezone);
    default:
      return formatFn(sequelize, dialect, field, format);
  }
};
