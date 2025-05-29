/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DataTypes, Model, SaveOptions, CreateOptions,BulkCreateOptions, InstanceUpdateOptions } from 'sequelize';
import { BaseColumnFieldOptions, Field } from './field';
import { customAlphabet, nanoid } from 'nanoid';

const DEFAULT_SIZE = 12;
export class NanoidField extends Field {
  get dataType() {
    return DataTypes.STRING;
  }

  init() {
    const { name, size, customAlphabet: customAlphabetOptions, autoFill } = this.options as NanoidFieldOptions;

    this.listener = async (instances: Model | Model[], dbOptions?: SaveOptions | CreateOptions | BulkCreateOptions | InstanceUpdateOptions) => {
      const models = Array.isArray(instances) ? instances : [instances];
      for (const instance of models) {
        const value = instance.get(name);

        if (!value && autoFill !== false) {
          const nanoIdFunc = customAlphabetOptions ? customAlphabet(customAlphabetOptions) : nanoid;
          instance.set(name, nanoIdFunc(size || DEFAULT_SIZE));
        }
      }
    };
  }

  bind() {
    super.bind();
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

export interface NanoidFieldOptions extends BaseColumnFieldOptions {
  type: 'nanoid';
  size?: number;
  customAlphabet?: string;
  autoFill?: boolean;
}
