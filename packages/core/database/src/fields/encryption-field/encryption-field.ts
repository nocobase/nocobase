/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DataTypes, Model } from 'sequelize';
import { EncryptionError } from './errors/EncryptionError';
import { aesCheckKey, aesDecrypt, aesEncrypt } from './utils';
import { BaseColumnFieldOptions, Field } from '../field';

export interface EncryptionFieldOptions extends BaseColumnFieldOptions {
  type: 'encryption';
  hidden?: boolean;
}

export class EncryptionField extends Field {
  get dataType() {
    return DataTypes.STRING;
  }

  init() {
    aesCheckKey();
    const { name, iv } = this.options;
    this.writeListener = async (model: Model) => {
      aesCheckKey();
      if (!model.changed(name as any)) {
        return;
      }
      const value = model.get(name) as string;
      if (value) {
        try {
          const encrypted = await aesEncrypt(value, iv);
          model.set(name, encrypted);
        } catch (error) {
          console.error(error);
          throw new EncryptionError('Encryption failed');
        }
      } else {
        model.set(name, null);
      }
    };

    this.findListener = async (instances, options) => {
      aesCheckKey();
      instances = Array.isArray(instances) ? instances : [instances];
      await Promise.all(
        instances.map(async (instance) => {
          if (instance.get?.(name)) {
            try {
              instance.set(name, await aesDecrypt(instance.get(name), iv));
            } catch (error) {
              console.error(error);
              throw new EncryptionError(
                'Decryption failed, the environment variable `ENCRYPTION_FIELD_KEY` may be incorrect',
              );
            }
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
    this.on('beforeSave', this.writeListener);
  }

  unbind() {
    super.unbind();
    this.off('afterFind', this.findListener);
    this.off('beforeSave', this.writeListener);
  }
}
