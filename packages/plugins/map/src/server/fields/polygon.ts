import { BaseColumnFieldOptions, Field, FieldContext } from '@nocobase/database';
import { DataTypes } from 'sequelize';
import { joinComma, toValue } from '../helpers';

class Polygon extends DataTypes.ABSTRACT {
  key = 'Polygon'
}

export class PolygonField extends Field {
  constructor(options?: any, context?: FieldContext) {
    const { name } = options
    super(
      {
        get() {
          return toValue(this.getDataValue(name))
        },
        set(value) {
          this.setDataValue(name, joinComma(value.map((item: any) => joinComma(item))))
        },
        ...options,
      },
      context,
    );
  }

  get dataType() {
    return Polygon;
  }

}

export interface PolygonFieldOptions extends BaseColumnFieldOptions {
  type: 'polygon';
}
