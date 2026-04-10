import moment from 'moment-timezone';
import { Sequelize } from 'sequelize';

export type Col = ReturnType<typeof Sequelize.col>;
export type Literal = ReturnType<typeof Sequelize.literal>;
export type Fn = ReturnType<typeof Sequelize.fn>;

export abstract class QueryFormatter {
  sequelize: Sequelize;

  constructor(sequelize: Sequelize) {
    this.sequelize = sequelize;
  }

  abstract formatDate(field: Col, format: string, timezone?: string): Fn | Col;

  abstract formatUnixTimestamp(
    field: string,
    format: string,
    accuracy?: 'second' | 'millisecond',
    timezone?: string,
  ): Fn | Literal | Col;

  convertFormat(format: string) {
    return format;
  }

  protected getTimezoneByOffset(offset?: string) {
    if (!offset) {
      return;
    }
    if (moment.tz.zone(offset)) {
      return offset;
    }
    if (!/^[+-]\d{1,2}:\d{2}$/.test(offset)) {
      return;
    }
    const offsetMinutes = moment.duration(offset).asMinutes();
    return moment.tz.names().find((timezone) => {
      return moment.tz(timezone).utcOffset() === offsetMinutes;
    });
  }

  protected getOffsetExpression(timezone: string) {
    const sign = timezone.charAt(0);
    const value = timezone.slice(1);
    const [hours, minutes] = value.split(':').map(Number);
    return `${sign}${hours * 60 + minutes} minutes`;
  }

  format(options: { type: string; field: string; format: string; timezone?: string; fieldOptions?: any }) {
    const { type, field, format, timezone, fieldOptions } = options;
    const col = this.sequelize.col(field);
    switch (type) {
      case 'date':
      case 'datetime':
      case 'datetimeTz':
        return this.formatDate(col, format, timezone);
      case 'datetimeNoTz':
      case 'dateOnly':
      case 'time':
        return this.formatDate(col, format);
      case 'unixTimestamp': {
        const accuracy = fieldOptions?.uiSchema?.['x-component-props']?.accuracy || fieldOptions?.accuracy || 'second';
        return this.formatUnixTimestamp(field, format, accuracy, timezone);
      }
      default:
        return col;
    }
  }
}
