/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import crypto from 'crypto';

export class AESCodec {
  constructor(private readonly algorithm: string) {}

  encrypt(key: Buffer, iv: Buffer, text: Buffer): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const cipher = crypto.createCipheriv(this.algorithm, key as unknown as Uint8Array, iv as unknown as Uint8Array);

      const chunks: Uint8Array[] = [];

      cipher.on('data', (chunk) => {
        chunks.push(chunk);
      });

      cipher.on('end', () => {
        resolve(Buffer.concat(chunks));
      });

      cipher.on('error', (err) => {
        reject(err);
      });

      cipher.write(text, 'binary');
      cipher.end();
    });
  }

  decrypt(key: Buffer, iv: Buffer, encrypted: Buffer): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const decipher = crypto.createDecipheriv(
        this.algorithm,
        key as unknown as Uint8Array,
        iv as unknown as Uint8Array,
      );

      const chunks: Uint8Array[] = [];

      decipher.on('data', (chunk) => {
        chunks.push(chunk);
      });

      decipher.on('end', () => {
        resolve(Buffer.concat(chunks));
      });

      decipher.on('error', (err) => {
        reject(err);
      });

      decipher.write(encrypted, 'binary');
      decipher.end();
    });
  }

  decryptSync(key: Buffer, iv: Buffer, encrypted: Buffer) {
    const decipher = crypto.createDecipheriv(this.algorithm, key as unknown as Uint8Array, iv as unknown as Uint8Array);
    const decrypted = decipher.update(encrypted as unknown as Uint8Array);
    return Buffer.concat([decrypted as unknown as Uint8Array, decipher.final() as unknown as Uint8Array]);
  }
}
