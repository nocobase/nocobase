import { DataTypes } from 'sequelize';
import { BaseColumnFieldOptions, Field, ValueParser } from './field';

export class BooleanField extends Field {
  get dataType() {
    return DataTypes.BOOLEAN;
  }

  buildValueParser(ctx: any) {
    return new BooleanValueParser(this, ctx);
  }
}

export class BooleanValueParser extends ValueParser {
  async setValue(value: any) {
    // Boolean
    if (typeof value === 'boolean') {
      this.value = value;
    }
    // Number
    else if (typeof value === 'number' && [0, 1].includes(value)) {
      this.value = value === 1;
    }
    // String
    else if (typeof value === 'string') {
      if (!value) {
        this.value = null;
      }
      if (['1', 'y', 'yes', 'true', '是'].includes(value.toLowerCase())) {
        this.value = true;
      } else if (['0', 'n', 'no', 'false', '否'].includes(value.toLowerCase())) {
        this.value = false;
      } else {
        this.errors.push(`${JSON.stringify(this.value)} value invalid`);
      }
    } else {
      this.errors.push(`${JSON.stringify(this.value)} value invalid`);
    }
  }
}

export interface BooleanFieldOptions extends BaseColumnFieldOptions {
  type: 'boolean';
}
