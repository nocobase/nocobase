/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { BaseColumnFieldOptions, DataTypes, Field, FieldContext } from '@nocobase/database';
import { isMssql, isPg, toValue } from '../helpers';
import _ from 'lodash';

class Circle extends DataTypes.ABSTRACT {
  key = 'Circle';
}

export class CircleField extends Field {
  constructor(options?: any, context?: FieldContext) {
    const { name } = options;
    super(
      {
        get() {
          const value = this.getDataValue(name);
          if (isPg(context)) {
            if (typeof value === 'string') {
              return toValue(`(${value})`);
            }
            return value ? [value.x, value.y, value.radius] : null;
          } else {
            return value;
          }
        },
        set(value) {
          if (!value?.length) value = null;
          else if (isPg(context)) {
            value = value.join(',');
          } else if (isMssql(context)) {
            const [lat, lng] = value;
            value = this.database?.sequelize.literal(`geography::Point(${lat}, ${lng}, 4326)`);
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
      return Circle;
    } else if (isMssql(this.context)) {
      return DataTypes.STRING;
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

export interface CircleFieldOptions extends BaseColumnFieldOptions {
  type: 'circle';
}
