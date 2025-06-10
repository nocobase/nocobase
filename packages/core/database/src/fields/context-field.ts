/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import lodash from 'lodash';
import { DataTypes } from 'sequelize';
import { Model } from '../model';
import { BaseColumnFieldOptions, Field } from './field';

export class ContextField extends Field {
  get dataType() {
    const type: string = this.options.dataType || 'string';
    return DataTypes[type.toUpperCase()] || DataTypes.STRING;
  }

  listener = async (instances: Model[], options) => {
    instances = Array.isArray(instances) ? instances : [instances];
    const { name, dataIndex } = this.options;
    const { context } = options;
    for (const instance of instances) {
      instance.set(name, lodash.get(context, dataIndex));
      instance.changed(name, true);
    }
  };

  bind() {
    super.bind();
    const { createOnly } = this.options;
    this.on('beforeCreate', this.listener);
    this.on('beforeBulkCreate', this.listener);
    if (!createOnly) {
      this.on('beforeUpdate', this.listener);
    }
  }

  unbind() {
    super.unbind();
    const { createOnly } = this.options;
    this.off('beforeCreate', this.listener);
    this.off('beforeBulkCreate', this.listener);
    if (!createOnly) {
      this.off('beforeUpdate', this.listener);
    }
  }
}

export interface ContextFieldOptions extends BaseColumnFieldOptions {
  type: 'context';
  dataIndex: string;
  dataType?: string;
  createOnly?: boolean;
}
