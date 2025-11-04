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
import { decryptFieldKey, EncryptedField, Generator } from './utils';
import { BaseColumnFieldOptions, Field } from '../field';

export interface EncryptionFieldOptions extends BaseColumnFieldOptions {
  type: 'encryption';
  hidden?: boolean;
}

export class EncryptionField extends Field {
  get dataType() {
    return DataTypes.TEXT;
  }

  init() {
    const { name, iv: fieldIV, encryptedKey } = this.options;
    this.writeListener = async (model: Model, options) => {
      if (!model.changed(name as any)) {
        return;
      }
      const previousInstance = (await (model.constructor as any).findByPk(options.filterByTk)) ?? {};
      const previousValue = previousInstance[`_original_encrypted_value_${name}`];

      const value = model.get(name) as string;
      if (value !== undefined && value !== null) {
        try {
          const key = await decryptFieldKey(fieldIV, encryptedKey);

          let iv: Buffer;
          if (model.isNewRecord || !previousValue) {
            iv = Generator.iv();
          } else {
            const encryptedField = await EncryptedField.deserializer(key, previousValue);
            iv = encryptedField.iv;
          }

          const encryptedField = await EncryptedField.serializer({ key, iv, value });
          model.set(name, encryptedField.serializedField);
        } catch (error) {
          console.error(error);
          if (error instanceof EncryptionError) {
            throw error;
          } else {
            throw new EncryptionError('Encryption failed');
          }
        }
      } else {
        model.set(name, null);
      }
    };

    this.findListener = async (instances) => {
      instances = Array.isArray(instances) ? instances : [instances];
      await Promise.all(
        instances.map(async (instance) => {
          const value = instance.get?.(name);
          if (value !== undefined && value !== null) {
            try {
              const key = await decryptFieldKey(fieldIV, encryptedKey);
              const encryptedField = await EncryptedField.deserializer(key, value);
              instance.set(name, encryptedField.value);
              Object.defineProperty(instance, `_original_encrypted_value_${name}`, {
                value,
              });
            } catch (error) {
              console.error(error);
              if (error instanceof EncryptionError) {
                throw error;
              } else {
                throw new EncryptionError('Decryption failed');
              }
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
    this.on('beforeBulkCreate', this.writeListener);
  }

  unbind() {
    super.unbind();
    this.off('afterFind', this.findListener);
    this.off('beforeSave', this.writeListener);
    this.off('beforeBulkCreate', this.writeListener);
  }
}
