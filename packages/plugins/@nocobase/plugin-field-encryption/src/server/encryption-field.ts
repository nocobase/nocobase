/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { BaseColumnFieldOptions, Field, Model } from '@nocobase/database';
import { DataTypes } from 'sequelize';
import { decrypt, encrypt, checkKey } from './utils';

export interface EncryptionFieldOptions extends BaseColumnFieldOptions {
  type: 'encryption';
}

export class EncryptionField extends Field {
  get dataType() {
    return DataTypes.STRING;
  }

  init() {
    const { name, iv } = this.options;
    this.writeListener = async (model: Model) => {
      checkKey();
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

    this.findListener = async (instances, options) => {
      instances = Array.isArray(instances) ? instances : [instances];
      await Promise.all(
        instances.map(async (instance) => {
          if (instance.get?.(name)) {
            instance.set(name, await decrypt(instance.get(name), iv));
          }
          return instance;
        }),
      );
    };
  }

  bind() {
    super.bind();
    // @ts-ignore
    this.on('afterFind', this.findListener);
    this.on('beforeCreate', this.writeListener);
    this.on('beforeUpdate', this.writeListener);
  }

  unbind() {
    super.unbind();
    this.off('afterFind', this.findListener);
    this.off('beforeCreate', this.writeListener);
    this.off('beforeUpdate', this.writeListener);
  }
}
