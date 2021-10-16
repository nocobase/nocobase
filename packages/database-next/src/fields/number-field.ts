import { DataTypes } from 'sequelize';
import { Field } from './field';

export class IntegerField extends Field {
  get dataType() {
    return DataTypes.INTEGER;
  }
}

export class FloatField extends Field {
  get dataType() {
    return DataTypes.FLOAT;
  }
}

export class DoubleField extends Field {
  get dataType() {
    return DataTypes.DOUBLE;
  }
}

export class RealField extends Field {
  get dataType() {
    return DataTypes.REAL;
  }
}

export class DecimalField extends Field {
  get dataType() {
    return DataTypes.DECIMAL;
  }
}
