/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import crypto from 'crypto';
const algorithm = 'aes-256-cbc';

const keyString = process.env.ENCRYPTION_FIELD_KEY;

// 将字符串转换为 Buffer 对象
const key = Buffer.from(keyString, 'utf8');

export function encrypt(text: string, ivString: string) {
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

export function decrypt(encrypted: string, ivString: string) {
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

export function encryptSync(text: string, ivString: string) {
  const iv = Buffer.from(ivString, 'utf8');
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

export function decryptSync(encrypted: string, ivString: string) {
  const iv = Buffer.from(ivString, 'utf8');
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

export function checkKey() {
  if (!keyString) {
    throw new Error('The environment variable `ENCRYPTION_FIELD_KEY` is required, please set it');
  }
  if (keyString.length !== 32) {
    throw new Error('The environment variable `ENCRYPTION_FIELD_KEY` must be a 32-character string');
  }
}
