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
          } else if (isMssql(context)) {
            const [lat, lng] = value;
            const coordStr = `${lng} ${lat}`;
            value = this.database?.sequelize.literal(`geography::STLineFromText('LINESTRING(${coordStr})', 4326)`);
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
    if (isMssql(this.context)) {
      return DataTypes.STRING;
    }
    if (isMysql(this.context)) {
      return DataTypes.GEOMETRY('LINESTRING');
    } else {
      return DataTypes.JSON;
    }
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

export interface LineStringOptions extends BaseColumnFieldOptions {
  type: 'lineString';
}
