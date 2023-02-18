import { moment2str } from '@nocobase/utils';
import { getJsDateFromExcel } from 'excel-date-to-js';
import moment, { isDate, isMoment } from 'moment';
import { BaseValueParser } from './base-value-parser';

export class DateValueParser extends BaseValueParser {
  async setValue(value: any) {
    if (isMoment(value)) {
      this.value = value;
    } else if (isDate(value)) {
      this.value = value;
    } else if (typeof value === 'string') {
      const props = this.getProps();
      const m = moment(value);
      if (m.isValid()) {
        this.value = moment2str(m, props);
      } else {
        this.errors.push('Invalid date');
      }
    } else if (typeof value === 'number') {
      try {
        this.value = getJsDateFromExcel(value).toISOString();
      } catch (error) {
        this.errors.push(`Invalid date - ${error.message}`);
      }
    }
  }

  getProps() {
    return this.field.options?.uiSchema?.['x-component-props'] || {};
  }
}
