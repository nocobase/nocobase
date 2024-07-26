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

// 示例用户配置的 Key 和 IV 字符串
const keyString = '12345678901234567890123456789012'; // 32 字符，适用于 AES-256
const ivString = '1234567890123456'; // 16 字符，适用于 AES-256-CBC

// 将字符串转换为 Buffer 对象
const key = Buffer.from(keyString, 'utf8');
const iv = Buffer.from(ivString, 'utf8');

export function encrypt(text: string) {
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

export function decrypt(encrypted: string) {
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
