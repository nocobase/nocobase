import { moment2str } from '@nocobase/utils';
import moment, { isDate, isMoment } from 'moment';
import { BaseValueParser } from "./base-value-parser";

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
    }
  }

  getProps() {
    return this.field.options?.uiSchema?.['x-component-props'] || {};
  }
}
