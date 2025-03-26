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

export class StringField extends Field {
  get dataType() {
    if (this.options.length) {
      return DataTypes.STRING(this.options.length);
    }

    return DataTypes.STRING;
  }

  preprocess = (instance) => {
    const { name } = this.options;
    if (this.options.trim && instance[name]) {
      instance.set(name, instance[name].trim());
    }
  };

  bind() {
    super.bind();
    this.on('beforeSave', this.preprocess);
  }

  unbind() {
    super.unbind();
    this.off('beforeSave', this.preprocess);
  }
}

export interface StringFieldOptions extends BaseColumnFieldOptions {
  type: 'string';
  length?: number;
  trim?: boolean;
}
