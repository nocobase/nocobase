/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ArrayField } from './array-field';
import { BaseColumnFieldOptions } from './field';

export interface SetFieldOptions extends BaseColumnFieldOptions {
  type: 'set';
}

export class SetField extends ArrayField {
  beforeSave = (model) => {
    const oldValue = model.get(this.options.name);
    if (oldValue) {
      model.set(this.options.name, [...new Set(oldValue)]);
    }
  };

  bind() {
    super.bind();
    this.on('beforeSave', this.beforeSave);
  }

  unbind() {
    super.unbind();
    this.off('beforeSave', this.beforeSave);
  }
}
