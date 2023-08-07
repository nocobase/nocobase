import { BaseColumnFieldOptions, DataTypes, Field, FieldContext } from '@nocobase/database';
import { isMysql, isPg, joinComma, toValue } from '../helpers';

class Polygon extends DataTypes.ABSTRACT {
  key = 'Polygon';
}

export class PolygonField extends Field {
  constructor(options?: any, context?: FieldContext) {
    const { name } = options;
    super(
      {
        get() {
          const value = this.getDataValue(name);
          if (isPg(context)) {
            return toValue(value);
          } else if (isMysql(context)) {
            return value?.coordinates[0].slice(0, -1) || null;
          } else {
            return value;
          }
        },
        set(value) {
          if (!value?.length) value = null;
          else if (isPg(context)) {
            value = joinComma(value.map((item: any) => joinComma(item)));
          } else if (isMysql(context)) {
            value = {
              type: 'Polygon',
              coordinates: [value.concat([value[0]])],
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
      return Polygon;
    } else if (isMysql(this.context)) {
      return DataTypes.GEOMETRY('POLYGON');
    } else {
      return DataTypes.JSON;
    }
  }
}

export interface PolygonFieldOptions extends BaseColumnFieldOptions {
  type: 'polygon';
}
