import { DataTypes } from 'sequelize';
import { BaseColumnFieldOptions, Field } from './field';

abstract class NumberField extends Field {}

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
