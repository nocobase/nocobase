import { DataTypes } from 'sequelize';
import { BaseColumnFieldOptions, Field } from './field';
import { str2moment } from '@nocobase/utils';
export class DateField extends Field {
  get dataType() {
    return DataTypes.DATE(3);
  }

  init(): void {
    if (this.options.defaultValue) {
      // @ts-ignore
      this.options.defaultValue = new this.database.sequelize.dialect.DataTypes.DATE()._stringify(
        this.options.defaultValue,
        {
          timezone: this.database.options.timezone,
        },
      );
    }
  }
}

export interface DateFieldOptions extends BaseColumnFieldOptions {
  type: 'date';
}
