import { DataTypes } from 'sequelize';
import { BaseColumnFieldOptions, Field, ValueParser } from './field';

abstract class NumberField extends Field {
  buildValueParser(ctx: any) {
    return new NumberValueParser(this, ctx);
  }
}

function percent2float(value: string) {
  const index = value.indexOf('.');
  if (index === -1) {
    return parseFloat(value) / 100;
  }
  const repeat = value.length - index - 2;
  const v = parseInt('1' + '0'.repeat(repeat));
  return (parseFloat(value) * v) / (100 * v);
}

export class NumberValueParser extends ValueParser {
  async setValue(value: any) {
    if (value === null || value === undefined || typeof value === 'number') {
      this.value = value;
    }
    if (typeof value === 'string') {
      if (!value) {
        this.value = null;
      } else if (['n/a', '-'].includes(value.toLowerCase())) {
        this.value = null;
      } else if (value.endsWith('%')) {
        this.value = percent2float(value);
        console.log(value, this.value);
      } else {
        const val = +value;
        this.value = isNaN(val) ? null : val;
      }
    }
  }
}

export class IntegerField extends NumberField {
  get dataType() {
    return DataTypes.INTEGER;
  }
}

export interface IntegerFieldOptions extends BaseColumnFieldOptions {
  type: 'integer';
}

export class BigIntField extends NumberField {
  get dataType() {
    return DataTypes.BIGINT;
  }
}

export interface BigIntFieldOptions extends BaseColumnFieldOptions {
  type: 'bigInt';
}

export class FloatField extends NumberField {
  get dataType() {
    return DataTypes.FLOAT;
  }
}

export interface FloatFieldOptions extends BaseColumnFieldOptions {
  type: 'float';
}

export class DoubleField extends NumberField {
  get dataType() {
    return DataTypes.DOUBLE;
  }
}

export interface DoubleFieldOptions extends BaseColumnFieldOptions {
  type: 'double';
}

export class RealField extends NumberField {
  get dataType() {
    return DataTypes.REAL;
  }
}

export interface RealFieldOptions extends BaseColumnFieldOptions {
  type: 'real';
}

export class DecimalField extends NumberField {
  get dataType() {
    return DataTypes.DECIMAL;
  }
}

export interface DecimalFieldOptions extends BaseColumnFieldOptions {
  type: 'decimal';
}
