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
import { aesDecrypt, aesEncrypt, decryptFieldKey, generateSignature } from './utils';
import { BaseColumnFieldOptions, Field } from '../field';
import { uid } from '@nocobase/utils';

class EncryptedField {
  static encoding: Record<string, BufferEncoding> = {
    iv: 'utf8',
    value: 'hex',
  };

  constructor(
    private readonly _iv: string,
    private readonly _value: unknown,
    private readonly _serializedField: string,
  ) {}

  get iv() {
    return this._iv;
  }

  get value() {
    return this._value;
  }

  get serializedField() {
    return this._serializedField;
  }

  static async serializer({ key, iv, value }: { key: Buffer; iv: string; value: unknown }): Promise<EncryptedField> {
    const encrypted = await aesEncrypt(key, value as string, iv);
    const signature = generateSignature(key, value as string);
    const ivBuffer = Buffer.from(iv, EncryptedField.encoding.iv) as unknown as Uint8Array;
    const encryptedBuffer = Buffer.from(encrypted, EncryptedField.encoding.value) as unknown as Uint8Array;
    const serializedValue = Buffer.concat([ivBuffer, encryptedBuffer]).toString(EncryptedField.encoding.value);
    return new EncryptedField(iv, value, `${signature}.${serializedValue}`);
  }

  static async deserializer(key: Buffer, serializedField: string): Promise<EncryptedField> {
    const [_signature, serializedValue] = serializedField.split('.');
    const buff = Buffer.from(serializedValue, EncryptedField.encoding.value);
    const iv = buff.subarray(0, 16).toString(EncryptedField.encoding.iv);
    const encrypted = buff.subarray(16).toString(EncryptedField.encoding.value);
    const value = await aesDecrypt(key, encrypted, iv);
    return new EncryptedField(iv, value, serializedField);
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
          const key = await decryptFieldKey(encryptedKey);

          let iv: string;
          if (model.isNewRecord || !previousValue) {
            iv = uid(16);
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

    this.findListener = async (instances, options) => {
      instances = Array.isArray(instances) ? instances : [instances];
      await Promise.all(
        instances.map(async (instance) => {
          const value = instance.get?.(name);
          if (value !== undefined && value !== null) {
            try {
              const key = await decryptFieldKey(encryptedKey);
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
