/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { BaseColumnFieldOptions, Field, FieldContext, Model } from '@nocobase/database';
import { DataTypes } from 'sequelize';
import { encrypt, decrypt } from './utils';

export interface EncryptionFieldOptions extends BaseColumnFieldOptions {
  type: 'encryption';
}

export class EncryptionField extends Field {
  get dataType() {
    return DataTypes.STRING;
  }

  // constructor(options?: any, context?: FieldContext) {
  // const { name, iv } = options;
  // super(
  //   {
  //     get() {
  //       const value = this.getDataValue(name);
  //       if (!value) return null;
  //       return decrypt(value, iv);
  //     },
  //     set(value) {
  //       if (!value?.length) value = null;
  //       else {
  //         value = encrypt(value, iv);
  //       }
  //       this.setDataValue(name, value);
  //     },
  //     ...options,
  //   },
  //   context,
  // );
  // }

  init() {
    const { name, iv } = this.options;
    this.writeListener = async (model: Model) => {
      if (!model.changed(name as any)) {
        return;
      }
      const value = model.get(name) as string;
      if (value) {
        const encrypted = await encrypt(value, iv);
        model.set(name, encrypted);
      } else {
        model.set(name, null);
      }
    };

    this.getListener = async (model: Model) => {
      const encrypted = model.get(name) as string;
      if (encrypted) {
        const str = await decrypt(encrypted, iv);
        model.set(name, str);
      } else {
        model.set(name, null);
      }
    };
  }

  bind() {
    super.bind();
    // @ts-ignore
    this.on('afterFind', this.getListener);
    this.on('beforeCreate', this.writeListener);
    this.on('beforeUpdate', this.writeListener);
  }

  unbind() {
    super.unbind();
    this.off('afterFind', this.getListener);
    this.off('beforeCreate', this.writeListener);
    this.off('beforeUpdate', this.writeListener);
  }
}
