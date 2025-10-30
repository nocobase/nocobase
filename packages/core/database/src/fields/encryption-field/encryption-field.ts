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
import { aesDecrypt, aesEncrypt, decryptFieldKey } from './utils';
import { BaseColumnFieldOptions, Field } from '../field';
import { uid } from '@nocobase/utils';
import crypto from 'crypto';

class EncryptedField {
  private static encoding: Record<string, BufferEncoding> = {
    iv: 'utf8',
    value: 'hex',
  };
  private _serializedValue: string | null;

  constructor(
    private _iv: string,
    private _value: unknown,
  ) {}

  get iv() {
    return this._iv;
  }

  get value() {
    return this._value as string;
  }

  get ivBuffer() {
    return Buffer.from(this._iv, EncryptedField.encoding.iv) as unknown as Uint8Array;
  }

  get valueBuffer() {
    return Buffer.from(this.value, EncryptedField.encoding.value) as unknown as Uint8Array;
  }

  get serializedValue() {
    if (this._serializedValue) {
      return this._serializedValue;
    }
    this._serializedValue = Buffer.concat([this.ivBuffer, this.valueBuffer]).toString(EncryptedField.encoding.value);
    return this._serializedValue;
  }

  static create(iv: string, encrypted: unknown) {
    return new EncryptedField(iv, encrypted);
  }

  static fromSerializedValue(serializedValue: string) {
    const buff = Buffer.from(serializedValue, EncryptedField.encoding.value);
    const iv = buff.subarray(0, 16);
    const encrypted = buff.subarray(16);
    return new EncryptedField(
      iv.toString(EncryptedField.encoding.iv),
      encrypted.toString(EncryptedField.encoding.value),
    );
  }
}

export interface EncryptionFieldOptions extends BaseColumnFieldOptions {
  type: 'encryption';
  hidden?: boolean;
}

export class EncryptionField extends Field {
  get dataType() {
    return DataTypes.STRING;
  }

  init() {
    const { name, encryptedKey } = this.options;
    this.writeListener = async (model: Model, options) => {
      if (!model.changed(name as any)) {
        return;
      }
      const previousInstance = (await (model.constructor as any).findByPk(options.filterByTk)) ?? {};
      const previousValue = previousInstance[`_original_encrypted_value_${name}`];

      const value = model.get(name) as string;
      if (value !== undefined && value !== null) {
        try {
          const fieldKey = await decryptFieldKey(encryptedKey);

          let ivString: string;
          if (model.isNewRecord || !previousValue) {
            ivString = uid(16); // crypto.randomBytes(16).toString('hex');
          } else {
            const encryptedField = EncryptedField.fromSerializedValue(previousValue);
            ivString = encryptedField.iv;
          }

          const encrypted = await aesEncrypt(fieldKey, value, ivString);
          const encryptedField = EncryptedField.create(ivString, encrypted);
          model.set(name, encryptedField.serializedValue);
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

    this.findListener = async (instances, options) => {
      instances = Array.isArray(instances) ? instances : [instances];
      await Promise.all(
        instances.map(async (instance) => {
          const value = instance.get?.(name);
          if (value !== undefined && value !== null) {
            try {
              const fieldKey = await decryptFieldKey(encryptedKey);
              const encryptedField = EncryptedField.fromSerializedValue(value);
              instance.set(name, await aesDecrypt(fieldKey, encryptedField.value, encryptedField.iv));
              Object.defineProperty(instance, `_original_encrypted_value_${name}`, {
                value,
              });
            } catch (error) {
              console.error(error);
              if (error instanceof EncryptionError) {
                throw error;
              } else {
                throw new EncryptionError(
                  'Decryption failed, the environment variable `ENCRYPTION_FIELD_KEY` may be incorrect',
                );
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
