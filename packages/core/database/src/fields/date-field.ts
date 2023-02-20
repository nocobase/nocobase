import { DataTypes } from 'sequelize';
import { BaseColumnFieldOptions, Field } from './field';
import { str2moment } from '@nocobase/utils';
export class DateField extends Field {
  get dataType() {
    return DataTypes.DATE(3);
  }

  init(): void {
    if (this.options.defaultValue && this.database.inDialect('mysql')) {
      this.options.defaultValue = str2moment(this.options.defaultValue, { gmt: true }).format('YYYY-MM-DD HH:mm:ss');
    }
  }
}

export interface DateFieldOptions extends BaseColumnFieldOptions {
  type: 'date';
}
