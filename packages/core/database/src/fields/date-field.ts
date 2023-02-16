import { moment2str } from '@nocobase/utils';
import moment, { isDate, isMoment } from 'moment';
import { DataTypes } from 'sequelize';
import { BaseColumnFieldOptions, Field, ValueParser } from './field';

export class DateField extends Field {
  get dataType() {
    return DataTypes.DATE(3);
  }

  buildValueParser(ctx: any) {
    return new DateValueParser(this, ctx);
  }
}

export class DateValueParser extends ValueParser {
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

export interface DateFieldOptions extends BaseColumnFieldOptions {
  type: 'date';
}
