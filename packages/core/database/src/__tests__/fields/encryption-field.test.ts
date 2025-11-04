/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  AESCodec,
  createMockDatabase,
  decryptFieldKey,
  decryptFieldKeySync,
  EncryptedField,
  encryptFieldKey,
  EncryptionField,
  generateSignature,
  Generator,
  KeyStore,
  MockDatabase,
} from '@nocobase/database';
import path from 'path';
import os from 'os';
import { uid } from '@nocobase/utils';
import fs from 'fs-extra';
import { customAlphabet } from 'nanoid';
import crypto, { BinaryLike } from 'crypto';

const nanoid = customAlphabet('0123456789', 21);

const encrypt = (algorithm: string, key: Buffer, iv: Buffer, message: BinaryLike) => {
  const cipher = crypto.createCipheriv(algorithm, key as unknown as Uint8Array, iv as unknown as Uint8Array);
  return Buffer.concat([cipher.update(message) as unknown as Uint8Array, cipher.final() as unknown as Uint8Array]);
};

const decrypt = (algorithm: string, key: Buffer, iv: Buffer, encrypted: Buffer) => {
  const decipher = crypto.createDecipheriv(algorithm, key as unknown as Uint8Array, iv as unknown as Uint8Array);
  const decrypted = decipher.update(encrypted as unknown as Uint8Array);
  return Buffer.concat([decrypted as unknown as Uint8Array, decipher.final() as unknown as Uint8Array]);
};

describe('KeyStore test cases', () => {
  it('should load key file which specified by environment variable `ENCRYPTION_FIELD_KEY_PATH`', async () => {
    const primeKeyPath = path.resolve(os.tmpdir(), 'tests', 'load-prime-key', uid());
    const subfix = '.key';
    const encoding = 'base64';
    const id = nanoid();
    const key = Generator.key();
    if (!fs.existsSync(primeKeyPath)) {
      fs.mkdirSync(primeKeyPath, { recursive: true });
    }
    fs.writeFileSync(path.resolve(primeKeyPath, id + subfix), key.toString(encoding), { encoding: 'utf8' });

    process.env.ENCRYPTION_FIELD_KEY_PATH = path.resolve(primeKeyPath, id + subfix);

    KeyStore.reset();
    const { id: loadId, key: loadKey } = KeyStore.loadPrimeKey();

    expect(loadId).toBe(id);
    expect(loadKey.toString(encoding)).toBe(key.toString(encoding));
  });

  it('should load key file from path which specified by environment variable `ENCRYPTION_FIELD_KEY_PATH`', async () => {
    const primeKeyPath = path.resolve(os.tmpdir(), 'tests', 'load-prime-key', uid());
    const subfix = '.key';
    const encoding = 'base64';
    const id = nanoid();
    const key = Generator.key();
    if (!fs.existsSync(primeKeyPath)) {
      fs.mkdirSync(primeKeyPath, { recursive: true });
    }
    fs.writeFileSync(path.resolve(primeKeyPath, id + subfix), key.toString(encoding), { encoding: 'utf8' });

    process.env.ENCRYPTION_FIELD_KEY_PATH = primeKeyPath;

    KeyStore.reset();
    const { id: loadId, key: loadKey } = KeyStore.loadPrimeKey();

    expect(loadId).toBe(id);
    expect(loadKey.toString(encoding)).toBe(key.toString(encoding));
  });

  it('should error while specified path key does not exist', async () => {
    process.env.ENCRYPTION_FIELD_KEY_PATH = path.resolve(
      os.tmpdir(),
      'storage',
      'encryption-field-keys',
      'non-exist.key',
    );

    let err: Error;
    try {
      KeyStore.reset();
      KeyStore.loadPrimeKey();
    } catch (error) {
      err = error;
    }
    expect(err?.message).toBe('The environment variable `ENCRYPTION_FIELD_KEY_PATH` point to a non-existent file.');
  });
});

describe('AESCodec test cases', () => {
  const algorithm = 'aes-256-cbc';
  let codec: AESCodec;

  beforeAll(async () => {
    codec = new AESCodec(algorithm);
  });

  it('encrypt', async () => {
    const iv = Generator.iv();
    const key = Generator.key();
    const message = 'hello world';
    const encrypted = await codec.encrypt(key, iv, Buffer.from(message));

    const decrypted = decrypt(algorithm, key, iv, encrypted);
    expect(decrypted.toString()).toBe(message);
  });

  it('decrypt', async () => {
    const iv = Generator.iv();
    const key = Generator.key();
    const message = 'hello world';
    const encrypted = encrypt(algorithm, key, iv, message);

    const decryptedBuff = await codec.decrypt(key, iv, encrypted);
    expect(decryptedBuff.toString()).toBe(message);
  });

  it('decrypt sync', async () => {
    const iv = Generator.iv();
    const key = Generator.key();
    const message = 'hello world';
    const encrypted = encrypt(algorithm, key, iv, message);

    const decryptedBuff = codec.decryptSync(key, iv, encrypted);
    expect(decryptedBuff.toString()).toBe(message);
  });
});

describe('EncryptedField test cases', () => {
  const algorithm = 'aes-256-cbc';

  beforeEach(async () => {
    process.env.ENCRYPTION_FIELD_KEY_PATH = path.resolve(os.tmpdir(), 'storage', 'encryption-field-keys');
    KeyStore.reset();
  });

  it('serializer', async () => {
    const iv = Generator.iv();
    const key = Generator.key();
    const value = 'hello world';
    const encryptedField = await EncryptedField.serializer({
      key,
      iv,
      value,
    });
    const signature = generateSignature(key, String(value));
    const encrypted = encrypt(algorithm, key, iv, value);
    const serializedValue = Buffer.concat([iv as unknown as Uint8Array, encrypted as unknown as Uint8Array]).toString(
      EncryptedField.encoding,
    );

    expect(encryptedField.iv.toString('base64')).toBe(iv.toString('base64'));
    expect(encryptedField.value).toBe(value);
    expect(encryptedField.serializedField).toBe(signature + EncryptedField.delimiter + serializedValue);
  });

  it('deserializer', async () => {
    const iv = Generator.iv();
    const key = Generator.key();
    const value = 'hello world';

    const signature = generateSignature(key, String(value));
    const encrypted = encrypt(algorithm, key, iv, value);
    const serializedValue = Buffer.concat([iv as unknown as Uint8Array, encrypted as unknown as Uint8Array]).toString(
      EncryptedField.encoding,
    );
    const serializedField = signature + EncryptedField.delimiter + serializedValue;

    const encryptedField = await EncryptedField.deserializer(key, serializedField);

    expect(encryptedField.iv.toString('base64')).toBe(iv.toString('base64'));
    expect(encryptedField.value).toBe(value);
    expect(encryptedField.serializedField).toBe(serializedField);
  });
});

describe('encryptFieldKey & decryptFieldKey test cases', () => {
  it('encryptFieldKey & decryptFieldKey', async () => {
    const encoding = 'base64';
    const key = Generator.key();
    const iv = Generator.iv();
    const { id, encrypted } = await encryptFieldKey(key, iv);
    const options = {
      primeKeyId: id,
      iv: iv.toString(encoding),
      encryptedKey: encrypted.toString(encoding),
    };
    const fieldKey = await decryptFieldKey(options.iv, options.encryptedKey);
    expect(fieldKey.toString(encoding)).toBe(key.toString(encoding));

    const fieldKeySync = await decryptFieldKeySync(options.iv, options.encryptedKey);
    expect(fieldKeySync.toString(encoding)).toBe(key.toString(encoding));
  });
});

describe('encryption field', () => {
  let db: MockDatabase;

  beforeEach(async () => {
    process.env.ENCRYPTION_FIELD_KEY_PATH = path.resolve(os.tmpdir(), 'storage', 'encryption-field-keys');
    KeyStore.reset();
  });

  beforeEach(async () => {
    db = await createMockDatabase();
    await db.clean({ drop: true });
    db.registerFieldTypes({
      encryption: EncryptionField,
    });
  });

  afterEach(async () => {
    await db.close();
  });

  it('basic', async () => {
    const encoding = 'base64';
    const key = Generator.key();
    const iv = Generator.iv();
    const { id, encrypted } = await encryptFieldKey(key, iv);
    db.collection({
      name: 'tests',
      fields: [
        {
          type: 'encryption',
          name: 'name1',
          primeKeyId: id,
          iv: iv.toString(encoding),
          encryptedKey: encrypted.toString(encoding),
        },
      ],
    });
    await db.sync();
    const r = db.getRepository('tests');
    const model = await r.create({
      values: {
        name1: 'aaa',
      },
    });
    expect(model.get('name1')).not.toBe('aaa');
    const model2 = await r.findOne();
    expect(model2.get('name1')).toBe('aaa');
  });

  it('should throw error when value is object', async () => {
    const encoding = 'base64';
    const key = Generator.key();
    const iv = Generator.iv();
    const { id, encrypted } = await encryptFieldKey(key, iv);
    db.collection({
      name: 'tests',
      fields: [
        {
          type: 'encryption',
          name: 'name1',
          primeKeyId: id,
          iv: iv.toString(encoding),
          encryptedKey: encrypted.toString(encoding),
        },
      ],
    });
    await db.sync();
    const r = db.getRepository('tests');
    let err: Error;
    try {
      await r.create({
        values: {
          name1: { obj: 'aaa' },
        },
      });
    } catch (error) {
      err = error;
    }
    expect(err?.message).toBe('string violation: name1 cannot be an array or an object');
  });

  it('should throw error when value is number', async () => {
    const encoding = 'base64';
    const key = Generator.key();
    const iv = Generator.iv();
    const { id, encrypted } = await encryptFieldKey(key, iv);
    db.collection({
      name: 'tests',
      fields: [
        {
          type: 'encryption',
          name: 'name1',
          primeKeyId: id,
          iv: iv.toString(encoding),
          encryptedKey: encrypted.toString(encoding),
        },
      ],
    });
    await db.sync();
    const r = db.getRepository('tests');
    let err: Error;
    try {
      await r.create({
        values: {
          name1: 123,
        },
      });
    } catch (error) {
      err = error;
    }
    expect(err?.message).toBe('Encrypt Failed: The value must be a string, but got number');
  });

  it('should not throw error when value is `null` or `undefined` or empty string', async () => {
    const encoding = 'base64';
    const key = Generator.key();
    const iv = Generator.iv();
    const { id, encrypted } = await encryptFieldKey(key, iv);
    db.collection({
      name: 'tests',
      fields: [
        {
          type: 'encryption',
          name: 'name1',
          primeKeyId: id,
          iv: iv.toString(encoding),
          encryptedKey: encrypted.toString(encoding),
        },
      ],
    });
    await db.sync();
    const r = db.getRepository('tests');
    const fn = vitest.fn();
    try {
      await r.create({
        values: [
          {
            name1: null,
          },
          {
            name1: undefined,
          },
          {
            name1: '',
          },
        ],
      });
    } catch {
      fn();
    }
    expect(fn).toBeCalledTimes(0);
  });
});
