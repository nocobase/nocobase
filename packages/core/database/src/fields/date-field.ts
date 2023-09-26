import Sequelize, { DataTypes } from 'sequelize';
import { BaseColumnFieldOptions, Field } from './field';

export function transformTimeFieldDefaultValue(options, context) {
  const defaultValues = ['{{$date.now}}', '{{ $date.now }}'];

  if (defaultValues.includes(options.defaultValue)) {
    if (context.database.inDialect('mysql')) {
      if (options.type === 'time') {
        // mysql not support default now value for time field
        options.defaultValue = null;
      } else {
        options.defaultValue = Sequelize.literal('CURRENT_TIMESTAMP(3)');
      }
    } else {
      options.defaultValue = Sequelize.literal('CURRENT_TIMESTAMP');
    }
  }
}

export class DateField extends Field {
  constructor(options: DateFieldOptions, context: any) {
    transformTimeFieldDefaultValue(options, context);
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
