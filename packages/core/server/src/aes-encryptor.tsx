/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import crypto from 'crypto';
import fs from 'fs-extra';
import path from 'path';
import Application from './application';

export class AesEncryptor {
  private key: Buffer;

  constructor(key: Buffer) {
    if (key.length !== 32) {
      throw new Error('Key must be 32 bytes for AES-256 encryption.');
    }
    this.key = key;
  }

  async encrypt(text: string): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-cbc', this.key as any, iv as any);

        const encrypted = Buffer.concat([cipher.update(Buffer.from(text, 'utf8') as any), cipher.final()] as any[]);

        resolve(iv.toString('hex') + encrypted.toString('hex'));
      } catch (error) {
        reject(error);
      }
    });
  }

  async decrypt(encryptedText: string): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const iv = Buffer.from(encryptedText.slice(0, 32), 'hex'); // 提取前 16 字节作为 IV
        const encrypted = Buffer.from(encryptedText.slice(32), 'hex'); // 提取密文

        const decipher = crypto.createDecipheriv('aes-256-cbc', this.key as any, iv as any);

        const decrypted = Buffer.concat([decipher.update(encrypted as any), decipher.final()] as any);

        resolve(decrypted.toString('utf8'));
      } catch (error) {
        reject(error);
      }
    });
  }

  static async getOrGenerateKey(keyFilePath: string): Promise<Buffer> {
    try {
      const key = await fs.readFile(keyFilePath);
      if (key.length !== 32) {
        throw new Error('Invalid key length in file.');
      }
      return key;
    } catch (error) {
      if (error.code === 'ENOENT') {
        const key = crypto.randomBytes(32);
        await fs.mkdir(path.dirname(keyFilePath), { recursive: true });
        await fs.writeFile(keyFilePath, key as any);
        return key;
      } else {
        throw new Error(`Failed to load key: ${error.message}`);
      }
    }
  }

  static async getKeyPath(appName: string) {
    const appKeyPath = path.resolve(process.cwd(), 'storage', 'apps', appName, 'aes_key.dat');
    const appKeyExists = await fs.exists(appKeyPath);
    if (appKeyExists) {
      return appKeyPath;
    }
    const envKeyPath = path.resolve(process.cwd(), 'storage', 'environment-variables', appName, 'aes_key.dat');
    const envKeyExists = await fs.exists(envKeyPath);
    if (envKeyExists) {
      return envKeyPath;
    }
    return appKeyPath;
  }

  static async create(app: Application) {
    let key: any = process.env.APP_AES_SECRET_KEY;
    if (!key) {
      const keyPath = await this.getKeyPath(app.name);
      key = await AesEncryptor.getOrGenerateKey(keyPath);
    }
    return new AesEncryptor(key);
  }
}

export default AesEncryptor;
