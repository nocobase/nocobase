/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import AesEncryptor from '../aes-encryptor';

describe('AesEncryptor', () => {
  it('encrypts and decrypts', async () => {
    const key = Buffer.alloc(32, 7);
    const encryptor = new AesEncryptor(key);
    const cipher = await encryptor.encrypt('hello-world');
    const plain = await encryptor.decrypt(cipher);
    expect(plain).toBe('hello-world');
  });
});
