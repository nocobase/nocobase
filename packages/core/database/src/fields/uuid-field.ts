/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DataTypes, Model, SaveOptions, CreateOptions, BulkCreateOptions, InstanceUpdateOptions } from 'sequelize';
import { BaseColumnFieldOptions, Field } from './field';
import { v4 as uuidv4 } from 'uuid';

export class UuidField extends Field {
  get dataType() {
    return DataTypes.UUID;
  }

  init() {
    const { name, autoFill } = this.options as UUIDFieldOptions;

    this.listener = async (instances: Model | Model[], dbOptions?: SaveOptions | CreateOptions | BulkCreateOptions | InstanceUpdateOptions) => {
      const models = Array.isArray(instances) ? instances : [instances];
      for (const instance of models) {
        const value = instance.get(name);

        if (!value && autoFill !== false) {
          instance.set(name, uuidv4());
        }
      }
    };
  }

  bind() {
    super.bind();
    // https://sequelize.org/docs/v6/other-topics/hooks/
    this.on('beforeValidate', this.listener);
    this.on('beforeCreate', this.listener);
    this.on('beforeBulkCreate', this.listener);
  }

  unbind() {
    super.unbind();
    this.off('beforeValidate', this.listener);
    this.off('beforeCreate', this.listener);
    this.off('beforeBulkCreate', this.listener);
  }
}

export interface UUIDFieldOptions extends BaseColumnFieldOptions {
  type: 'uuid';
  autoFill?: boolean;
}
