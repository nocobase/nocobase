import { DataTypes } from 'sequelize';
import { SchemaField } from './schema-field';

export class IntegerField extends SchemaField {
  get dataType() {
    return DataTypes.INTEGER;
  }
}

export class FloatField extends SchemaField {
  get dataType() {
    return DataTypes.FLOAT;
  }
}

export class DoubleField extends SchemaField {
  get dataType() {
    return DataTypes.DOUBLE;
  }
}

export class RealField extends SchemaField {
  get dataType() {
    return DataTypes.REAL;
  }
}

export class DecimalField extends SchemaField {
  get dataType() {
    return DataTypes.DECIMAL;
  }
}
