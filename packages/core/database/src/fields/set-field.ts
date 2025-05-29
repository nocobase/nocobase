/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ArrayField, ArrayFieldOptions } from './array-field';
import { Model, SaveOptions, CreateOptions } from 'sequelize';

export interface SetFieldOptions extends Omit<ArrayFieldOptions, 'type'> {
  type: 'set';
}

export class SetField extends ArrayField {
  beforeSave = (instances: Model | Model[], dbOptions?: SaveOptions | CreateOptions) => {
    const models = Array.isArray(instances) ? instances : [instances];
    for (const model of models) {
      const oldValue = model.get(this.options.name) as any[]; // Assuming it's an array
      if (oldValue) {
        // Ensure oldValue is an array before trying to spread it or create a Set
        if (Array.isArray(oldValue)) {
          model.set(this.options.name, [...new Set(oldValue)]);
        } else {
          // Handle cases where oldValue is not an array, e.g. log a warning or set a default
          // console.warn(`Field '${this.options.name}' was expected to be an array for SetField but was: ${typeof oldValue}`);
          // model.set(this.options.name, []); // Example: set to empty array
        }
      }
    }
  };

  bind() {
    super.bind();
    this.on('beforeSave', this.beforeSave);
    this.on('beforeBulkCreate', this.beforeSave);
  }

  unbind() {
    super.unbind();
    this.off('beforeSave', this.beforeSave);
    this.off('beforeBulkCreate', this.beforeSave);
  }
}
