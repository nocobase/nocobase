import moment from 'moment';
import { DataTypes } from 'sequelize';
import { BaseColumnFieldOptions, Field } from './field';
export class DateField extends Field {
  get dataType() {
    return DataTypes.DATE(3);
  }

  init(): void {
    if (this.options.defaultValue && this.database.inDialect('mysql')) {
      this.options.defaultValue = moment(this.options.defaultValue).format('YYYY-MM-DD HH:mm:ss.SSS');
    }
  }
}

export interface DateFieldOptions extends BaseColumnFieldOptions {
  type: 'date';
}
