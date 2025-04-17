/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { BaseColumnFieldOptions, DataTypes, Field, FieldContext } from '@nocobase/database';
import { isMssql, isMysql, isPg, joinComma, toValue } from '../helpers';
import _ from 'lodash';

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
          } else if (isMssql(context)) {
            const [lat, lng] = value;
            const coordStr = `${lng} ${lat}`;
            value = this.database?.sequelize.literal(`geography::STPolyFromText('POLYGON((${coordStr}))', 4326)`);
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
    }
    if (isMssql(this.context)) {
      return DataTypes.STRING;
    }
    return DataTypes.JSON;
  }

  get rawDataType() {
    return DataTypes.GEOGRAPHY;
  }

  setter(value, options) {
    if (isMssql(this.context) && _.isObjectLike(value)) {
      return JSON.stringify(value);
    }
    return value;
  }
}

export interface PolygonFieldOptions extends BaseColumnFieldOptions {
  type: 'polygon';
}
