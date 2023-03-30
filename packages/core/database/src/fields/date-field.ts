import { DataTypes } from 'sequelize';
import { BaseColumnFieldOptions, Field } from './field';

export class DateField extends Field {
  get dataType() {
    return DataTypes.DATE(3);
  }

  getProps() {
    return this.options?.uiSchema?.['x-component-props'] || {};
  }

  isDateOnly() {
    const props = this.getProps();
    return !props.showTime;
  }

  isGMT() {
    const props = this.getProps();
    return props.gmt || !props.showTime;
  }
}

export interface DateFieldOptions extends BaseColumnFieldOptions {
  type: 'date';
}
