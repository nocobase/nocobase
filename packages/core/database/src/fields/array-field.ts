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

  sortValue = (model) => {
    let oldValue = model.get(this.options.name);

    if (oldValue) {
      if (typeof oldValue === 'string') {
        oldValue = JSON.parse(oldValue);
      }
      const newValue = oldValue.sort();
      model.set(this.options.name, newValue);
    }
  };

  bind() {
    super.bind();
    this.on('beforeSave', this.sortValue);
  }

  unbind() {
    super.unbind();
    this.off('beforeSave', this.sortValue);
  }
}

export interface ArrayFieldOptions extends BaseColumnFieldOptions {
  type: 'array';
  dataType?: 'array' | 'json';
  elementType: DataTypes.DataType;
}
