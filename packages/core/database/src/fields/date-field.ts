import Sequelize, { DataTypes } from 'sequelize';
import { BaseColumnFieldOptions, Field } from './field';

export function transformTimeFieldDefaultValue(options) {
  const defaultValues = ['{{$date.now}}', '{{ $date.now }}'];

  if (defaultValues.includes(options.defaultValue)) {
    options.defaultValue = Sequelize.literal('CURRENT_TIMESTAMP');
  }
}

export class DateField extends Field {
  constructor(options: DateFieldOptions, context: any) {
    transformTimeFieldDefaultValue(options);
    super(options, context);
  }

  get dataType() {
    return DataTypes.DATE(3);
  }

  get timezone() {
    return this.isGMT() ? '+00:00' : null;
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
    return props.gmt;
  }
}

export interface DateFieldOptions extends BaseColumnFieldOptions {
  type: 'date';
}
