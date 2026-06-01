/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import crypto from 'crypto';
import { DataTypes } from 'sequelize';
import { Model } from '../model';
import { BaseColumnFieldOptions, Field } from './field';

export interface PasswordFieldOptions extends BaseColumnFieldOptions {
  type: 'password';
  /**
   * @default 64
   */
  length?: number;
  /**
   * @default 8
   */
  randomBytesSize?: number;
}

type PasswordValue = string | number;

export class PasswordField extends Field {
  get dataType() {
    return DataTypes.STRING;
  }

  async verify(password: PasswordValue, hash: string) {
    const passwordString = password === null || password === undefined ? '' : String(password);
    hash = hash || '';
    const { length = 64, randomBytesSize = 8 } = this.options;
    return new Promise((resolve, reject) => {
      const salt = hash.substring(0, randomBytesSize * 2);
      const key = hash.substring(randomBytesSize * 2);
      crypto.scrypt(passwordString, salt, length / 2 - randomBytesSize, (err, derivedKey) => {
        if (err) reject(err);
        resolve(key == derivedKey.toString('hex'));
      });
    });
  }

  async hash(password: PasswordValue) {
    const passwordString = String(password);
    const { length = 64, randomBytesSize = 8 } = this.options;
    return new Promise((resolve, reject) => {
      const salt = crypto.randomBytes(randomBytesSize).toString('hex');
      crypto.scrypt(passwordString, salt, length / 2 - randomBytesSize, (err, derivedKey) => {
        if (err) reject(err);
        resolve(salt + derivedKey.toString('hex'));
      });
    });
  }

  init() {
    const { name } = this.options;
    const fieldName = name as string;
    this.listener = async (instances: Model[]) => {
      instances = Array.isArray(instances) ? instances : [instances];
      for (const instance of instances) {
        if (!instance.changed(fieldName)) {
          continue;
        }
        const value = instance.get(fieldName);
        if (value !== null && value !== undefined && value !== '') {
          const password = typeof value === 'number' ? value : String(value);
          const hash = await this.hash(password);
          instance.set(fieldName, hash);
        } else {
          instance.set(fieldName, instance.previous(fieldName));
        }
      }
    };
  }

  bind() {
    super.bind();
    this.on('beforeCreate', this.listener);
    this.on('beforeBulkCreate', this.listener);
    this.on('beforeUpdate', this.listener);
  }

  unbind() {
    super.unbind();
    this.off('beforeCreate', this.listener);
    this.off('beforeBulkCreate', this.listener);
    this.off('beforeUpdate', this.listener);
  }
}
