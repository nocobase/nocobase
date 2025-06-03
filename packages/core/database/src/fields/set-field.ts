/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ArrayField, ArrayFieldOptions } from './array-field';

export interface SetFieldOptions extends Omit<ArrayFieldOptions, 'type'> {
  type: 'set';
}

export class SetField extends ArrayField {
  beforeSave = (instances) => {
    instances = Array.isArray(instances) ? instances : [instances];
    for (const instance of instances) {
      const oldValue = instance.get(this.options.name);
      if (oldValue) {
        instance.set(this.options.name, [...new Set(oldValue)]);
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
