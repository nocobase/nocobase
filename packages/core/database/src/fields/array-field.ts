/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DataTypes } from 'sequelize';
import { BaseColumnFieldOptions, Field } from './field';

export class ArrayField extends Field {
  get dataType() {
    const { dataType, elementType = '' } = this.options;
    if (this.database.sequelize.getDialect() === 'postgres') {
      if (dataType === 'array') {
        return new DataTypes.ARRAY(DataTypes[elementType.toUpperCase()]);
      }
      return DataTypes.JSONB;
    }

    return DataTypes.JSON;
  }

  sortValue = (instances) => {
    instances = Array.isArray(instances) ? instances : [instances];
    for (const instance of instances) {
      let oldValue = instance.get(this.options.name);

      if (oldValue) {
        if (typeof oldValue === 'string') {
          oldValue = JSON.parse(oldValue);
        }
        const newValue = oldValue.sort();
        instance.set(this.options.name, newValue);
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
  elementType: DataTypes.DataType;
}
