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

export class PasswordField extends Field {
  get dataType() {
    return DataTypes.STRING;
  }

  async verify(password: string, hash: string) {
    password = password || '';
    hash = hash || '';
    const { length = 64, randomBytesSize = 8 } = this.options;
    return new Promise((resolve, reject) => {
      const salt = hash.substring(0, randomBytesSize * 2);
      const key = hash.substring(randomBytesSize * 2);
      crypto.scrypt(password, salt, length / 2 - randomBytesSize, (err, derivedKey) => {
        if (err) reject(err);
        resolve(key == derivedKey.toString('hex'));
      });
    });
  }

  async hash(password: string) {
    const { length = 64, randomBytesSize = 8 } = this.options;
    return new Promise((resolve, reject) => {
      const salt = crypto.randomBytes(randomBytesSize).toString('hex');
      crypto.scrypt(password, salt, length / 2 - randomBytesSize, (err, derivedKey) => {
        if (err) reject(err);
        resolve(salt + derivedKey.toString('hex'));
      });
    });
  }

  init() {
    const { name } = this.options;
    this.listener = async (model: Model) => {
      if (!model.changed(name as any)) {
        return;
      }
      const value = model.get(name) as string;
      if (value) {
        const hash = await this.hash(value);
        model.set(name, hash);
      } else {
        model.set(name, model.previous(name));
      }
    };
  }

  bind() {
    super.bind();
    this.on('beforeCreate', this.listener);
    this.on('beforeUpdate', this.listener);
  }

  unbind() {
    super.unbind();
    this.off('beforeCreate', this.listener);
    this.off('beforeUpdate', this.listener);
  }
}
