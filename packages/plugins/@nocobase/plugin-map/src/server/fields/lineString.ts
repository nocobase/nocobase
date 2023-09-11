import { BaseColumnFieldOptions, DataTypes, Field, FieldContext } from '@nocobase/database';
import { isMysql, isPg, joinComma, toValue } from '../helpers';

class LineString extends DataTypes.ABSTRACT {
  key = 'Path';
}

export class LineStringField extends Field {
  constructor(options?: any, context?: FieldContext) {
    const { name } = options;
    super(
      {
        get() {
          const value = this.getDataValue(name);
          if (isPg(context)) {
            return toValue(value);
          } else if (isMysql(context)) {
            return value?.coordinates || null;
          } else {
            return value;
          }
        },
        set(value) {
          if (!value?.length) value = null;
          else if (isPg(context)) {
            value = joinComma(value.map(joinComma));
          } else if (isMysql(context)) {
            value = {
              type: 'LineString',
              coordinates: value,
            };
          }
          this.setDataValue(name, value);
        },
        ...options,
      },
      context,
    );
  }

  get dataType() {
    if (isPg(this.context)) {
      return LineString;
    }
    if (isMysql(this.context)) {
      return DataTypes.GEOMETRY('LINESTRING');
    } else {
      return DataTypes.JSON;
    }
  }
}

export interface LineStringOptions extends BaseColumnFieldOptions {
  type: 'lineString';
}
