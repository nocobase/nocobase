/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import crypto from 'crypto';
import { EncryptionError } from './errors/EncryptionError';
const algorithm = 'aes-256-cbc';

const keyString = process.env.ENCRYPTION_FIELD_KEY || '';
const defaultIvString = process.env.ENCRYPTION_FIELD_IV || 'Vc53-4G(rTi0vg@a'; // 如果没有设置 IV，使用默认值

// 将字符串转换为 Buffer 对象
const key = Buffer.from(keyString, 'utf8');

export function aesEncrypt(text: string, ivString: string = defaultIvString) {
  checkValueAndIv('Encrypt', text, ivString);

  return new Promise((resolve, reject) => {
    const iv = Buffer.from(ivString, 'utf8');
    const cipher = crypto.createCipheriv(algorithm, key, iv);

    let encrypted = '';

    cipher.setEncoding('hex');

    cipher.on('data', (chunk) => {
      encrypted += chunk;
    });

    cipher.on('end', () => {
      resolve(encrypted);
    });

    cipher.on('error', (err) => {
      reject(err);
    });

    cipher.write(text);
    cipher.end();
  });
}

export function aesDecrypt(encrypted: string, ivString: string = defaultIvString) {
  checkValueAndIv('Decrypt', encrypted, ivString);

  return new Promise((resolve, reject) => {
    const iv = Buffer.from(ivString, 'utf8');
    const decipher = crypto.createDecipheriv(algorithm, key, iv);

    let decrypted = '';

    decipher.setEncoding('utf8');

    decipher.on('data', (chunk) => {
      decrypted += chunk;
    });

    decipher.on('end', () => {
      resolve(decrypted);
    });

    decipher.on('error', (err) => {
      reject(err);
    });

    decipher.write(encrypted, 'hex');
    decipher.end();
  });
}

export function aesEncryptSync(text: string, ivString: string = defaultIvString) {
  checkValueAndIv('Encrypt', text, ivString);

  const iv = Buffer.from(ivString, 'utf8');
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

export function aseDecryptSync(encrypted: string, ivString: string = defaultIvString) {
  checkValueAndIv('Decrypt', encrypted, ivString);

  const iv = Buffer.from(ivString, 'utf8');
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

export function aesCheckKey() {
  if (!keyString) {
    throw new EncryptionError('The environment variable `ENCRYPTION_FIELD_KEY` is required, please set it');
  }
  if (typeof keyString !== 'string') {
    throw new EncryptionError('The environment variable `ENCRYPTION_FIELD_KEY` must be a string');
  }
  if (keyString.length !== 32) {
    throw new EncryptionError('The environment variable `ENCRYPTION_FIELD_KEY` must be a 32-character string');
  }
}

export function checkValueAndIv(type: 'Decrypt' | 'Encrypt', value: string, iv: string) {
  const msg = `${type} Failed: `;
  if (typeof value !== 'string') {
    throw new EncryptionError(msg + 'The value must be a string, but got ' + typeof value);
  }

  if (type === 'Decrypt') {
    if (value.length % 2 !== 0) {
      throw new EncryptionError(msg + `The encrypted value is invalid, not a hex string. The value is "${value}"`);
    }
  }

  if (typeof iv !== 'string') {
    throw new EncryptionError(msg + 'The `iv` must be a string, but got ' + typeof iv);
  }

  if (iv.length !== 16) {
    throw new EncryptionError(msg + 'The `iv` must be a 16-character string');
  }
}
