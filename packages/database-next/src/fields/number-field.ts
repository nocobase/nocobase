import { DataTypes } from 'sequelize';
import { BaseFieldOptions, Field } from './field';

export class IntegerField extends Field {
  get dataType() {
    return DataTypes.INTEGER;
  }
}

export interface IntegerFieldOptions extends BaseFieldOptions {
  type: 'integer';
}

export class FloatField extends Field {
  get dataType() {
    return DataTypes.FLOAT;
  }
}

export interface FloatFieldOptions extends BaseFieldOptions {
  type: 'float';
}

export class DoubleField extends Field {
  get dataType() {
    return DataTypes.DOUBLE;
  }
}

export interface DoubleFieldOptions extends BaseFieldOptions {
  type: 'double';
}

export class RealField extends Field {
  get dataType() {
    return DataTypes.REAL;
  }
}

export interface RealFieldOptions extends BaseFieldOptions {
  type: 'real';
}

export class DecimalField extends Field {
  get dataType() {
    return DataTypes.DECIMAL;
  }
}

export interface DecimalFieldOptions extends BaseFieldOptions {
  type: 'decimal';
}
