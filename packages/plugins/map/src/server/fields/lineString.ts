import { BaseColumnFieldOptions, Field, FieldContext } from '@nocobase/database';
import { DataTypes } from 'sequelize';
import { joinComma, toValue } from '../helpers';

class LineString extends DataTypes.ABSTRACT {
  key = 'Path';
}

export class LineStringField extends Field {
  constructor(options?: any, context?: FieldContext) {
    const { name } = options
    super(
      {
        get() {
          return toValue(this.getDataValue(name))
        },
        set(value) {
          this.setDataValue(name, joinComma(value.map(joinComma)))
        },
        ...options,
      },
      context,
    );
  }

  get dataType() {
    return LineString;
  }

}

export interface LineStringOptions extends BaseColumnFieldOptions {
  type: 'lineString';
}
