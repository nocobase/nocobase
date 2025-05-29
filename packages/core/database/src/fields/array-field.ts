/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DataTypes, Model, CreateOptions, SaveOptions } from 'sequelize';
import { BaseColumnFieldOptions, Field } from './field';

export class ArrayField extends Field {
  get dataType() {
    const { dataType, elementType = '' } = this.options as ArrayFieldOptions;
    if (this.database.sequelize.getDialect() === 'postgres') {
      if (dataType === 'array') {
        return new DataTypes.ARRAY(DataTypes[elementType.toUpperCase()]);
      }
      return DataTypes.JSONB;
    }

    return DataTypes.JSON;
  }

  sortValue = (instances: Model | Model[], options: SaveOptions | CreateOptions) => {
    const models = Array.isArray(instances) ? instances : [instances];
    for (const model of models) {
      let oldValue = model.get(this.options.name);

      if (oldValue) {
        if (typeof oldValue === 'string') {
          try {
            oldValue = JSON.parse(oldValue);
          } catch (e) {
            console.error(`Error parsing JSON for array field '${this.options.name}':`, e);
            continue; // Skip if parsing fails
          }
        }
        if (Array.isArray(oldValue)) {
          const newValue = oldValue.sort();
          model.set(this.options.name, newValue);
        } else {
          // console.warn(`Field '${this.options.name}' was expected to be an array but was: ${typeof oldValue}`);
        }
      }
    }
  };

  bind() {
    super.bind();
    this.on('beforeSave', this.sortValue);
    this.on('beforeBulkCreate', this.sortValue);
  }

  unbind() {
    super.unbind();
    this.off('beforeSave', this.sortValue);
    this.off('beforeBulkCreate', this.sortValue);
  }
}

export interface ArrayFieldOptions extends BaseColumnFieldOptions {
  type: 'array';
  dataType?: 'array' | 'json';
  elementType?: DataTypes.DataType; // Made optional as it might not always be provided if dataType is json
}
