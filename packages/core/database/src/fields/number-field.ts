import { DataTypes } from 'sequelize';
import { BaseColumnFieldOptions, Field } from './field';

export class IntegerField extends Field {
  get dataType() {
    return DataTypes.INTEGER;
  }
}

export interface IntegerFieldOptions extends BaseColumnFieldOptions {
  type: 'integer';
}

export class BigIntField extends Field {
  get dataType() {
    return DataTypes.BIGINT;
  }
}

export interface BigIntFieldOptions extends BaseColumnFieldOptions {
  type: 'bigInt';
}

export class FloatField extends Field {
  get dataType() {
    return DataTypes.FLOAT;
  }
}

export interface FloatFieldOptions extends BaseColumnFieldOptions {
  type: 'float';
}

export class DoubleField extends Field {
  get dataType() {
    return DataTypes.DOUBLE;
  }
}

export interface DoubleFieldOptions extends BaseColumnFieldOptions {
  type: 'double';
}

export class RealField extends Field {
  get dataType() {
    return DataTypes.REAL;
  }
}

export interface RealFieldOptions extends BaseColumnFieldOptions {
  type: 'real';
}

export class DecimalField extends Field {
  get dataType() {
    return DataTypes.DECIMAL;
  }
}

export interface DecimalFieldOptions extends BaseColumnFieldOptions {
  type: 'decimal';
}
