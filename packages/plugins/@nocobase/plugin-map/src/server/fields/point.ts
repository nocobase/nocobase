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

class Point extends DataTypes.ABSTRACT {
  key = 'Point';
}

export class PointField extends Field {
  constructor(options?: any, context?: FieldContext) {
    const { name } = options;
    super(
      {
        get() {
          const value = this.getDataValue(name);
          if (isPg(context)) {
            if (typeof value === 'string') {
              return toValue(value);
            }
            return value ? [value.x, value.y] : null;
          } else if (isMysql(context)) {
            return value?.coordinates || null;
          } else {
            return value;
          }
        },
        set(value) {
          if (!value?.length) value = null;
          else if (isPg(context)) {
            value = joinComma(value);
          } else if (isMssql(context)) {
            const [lat, lng] = value;
            value = this.database?.sequelize.literal(`geography::Point(${lat}, ${lng}, 4326)`);
          } else if (isMysql(context)) {
            value = {
              type: 'Point',
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
      return Point;
    }
    if (isMssql(this.context)) {
      return DataTypes.STRING;
    }
    if (isMysql(this.context)) {
      return DataTypes.GEOMETRY('POINT');
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

export interface PointFieldOptions extends BaseColumnFieldOptions {
  type: 'point';
}
