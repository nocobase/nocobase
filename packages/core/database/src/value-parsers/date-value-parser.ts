import { moment2str } from '@nocobase/utils';
import dayjs from 'dayjs';
import { getJsDateFromExcel } from 'excel-date-to-js';
import { BaseValueParser } from './base-value-parser';

function isNumeric(str: any) {
  if (typeof str === 'number') return true;
  if (typeof str != 'string') return false;
  return !isNaN(str as any) && !isNaN(parseFloat(str));
}

export class DateValueParser extends BaseValueParser {
  async setValue(value: any) {
    if (typeof value === 'string') {
      const match = /^(\d{4})[-/]?(\d{2})[-/]?(\d{2})$/.exec(value);
      if (match) {
        const m = dayjs(`${match[1]}-${match[2]}-${match[3]} 00:00:00.000`);
        this.value = m.toISOString();
        return;
      }
    }
    if (dayjs.isDayjs(value)) {
      this.value = value;
    } else if (isDate(value)) {
      this.value = value;
    } else if (isNumeric(value)) {
      try {
        this.value = getJsDateFromExcel(value).toISOString();
      } catch (error) {
        this.errors.push(`Invalid date - ${error.message}`);
      }
    } else if (typeof value === 'string') {
      const props = this.getProps();
      const m = dayjs(value);
      if (m.isValid()) {
        this.value = moment2str(m, props);
      } else {
        this.errors.push('Invalid date');
      }
    }
  }

  getProps() {
    return this.field.options?.uiSchema?.['x-component-props'] || {};
  }
}

function isDate(v) {
  return v instanceof Date;
}
