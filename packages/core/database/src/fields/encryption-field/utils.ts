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
import path from 'path';
import { customAlphabet } from 'nanoid';
import fs from 'fs-extra';

const nanoid = customAlphabet('0123456789', 21);

const algorithm = 'aes-256-cbc';

const defaultIvString = process.env.ENCRYPTION_FIELD_IV || 'Vc53-4G(rTi0vg@a'; // 如果没有设置 IV，使用默认值

const encryptionFieldPrimeKeyPath =
  process.env.ENCRYPTION_FIELD_KEY_PATH || path.resolve(process.cwd(), 'storage', 'encryption-field-keys');

export type KeyStoreEntry = {
  id: string;
  key: Buffer;
};

export class KeyStore {
  private static entry: KeyStoreEntry | null = null;

  static loadPrimeKey(): KeyStoreEntry {
    if (!KeyStore.entry) {
      KeyStore.entry = loadPrimeKey();
    }
    return KeyStore.entry;
  }
}

export function loadPrimeKey(targetKeyPath?: string): KeyStoreEntry {
  const keyPath = targetKeyPath || encryptionFieldPrimeKeyPath;
  const toEntry = (keyPath: string, base64Key: string) => ({
    id: path.basename(keyPath, '.dat'),
    key: Buffer.from(base64Key, 'base64'),
  });
  if (keyPath.endsWith('.dat')) {
    if (!fs.existsSync(keyPath)) {
      throw new EncryptionError('The environment variable `ENCRYPTION_FIELD_KEY_PATH` point to a non-existent file.');
    }
    const base64Key = fs.readFileSync(keyPath, 'utf8');
    return toEntry(keyPath, base64Key);
  } else {
    if (!fs.existsSync(keyPath)) {
      fs.mkdirSync(keyPath, { recursive: true });
    }
    const primeKeyPath = readFirstFile(keyPath);
    if (primeKeyPath) {
      const base64Key = fs.readFileSync(primeKeyPath, 'utf8');
      return toEntry(primeKeyPath, base64Key);
    }
    const id = nanoid();
    const key = crypto.randomBytes(32);
    fs.writeFileSync(path.resolve(keyPath, `${id}.dat`), key.toString('base64'));
    return { id, key };
  }
}

function readFirstFile(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isFile()) {
      return filePath;
    }
  }
  return null;
}

export async function generateFieldKey() {
  const fieldKey = crypto.randomBytes(32);
  return await encryptFieldKey(fieldKey);
}

export async function encryptFieldKey(fieldKey: Buffer, keyEntry?: KeyStoreEntry) {
  const { id, key } = keyEntry ?? KeyStore.loadPrimeKey();
  return {
    id,
    fieldKey,
    encrypted: await aesEncrypt(key, fieldKey.toString('base64')),
  };
}

export function encryptFieldKeySync(fieldKey: Buffer, keyEntry?: KeyStoreEntry) {
  const { id, key } = keyEntry ?? KeyStore.loadPrimeKey();
  return {
    id,
    fieldKey,
    encrypted: aesEncryptSync(key, fieldKey.toString('base64')),
  };
}

export async function decryptFieldKey(encrypted: string, keyEntry?: KeyStoreEntry) {
  const { key } = keyEntry ?? KeyStore.loadPrimeKey();
  return Buffer.from((await aesDecrypt(key, encrypted)) as string, 'base64');
}

export function decryptFieldKeySync(encrypted: string, keyEntry?: KeyStoreEntry) {
  const { key } = keyEntry ?? KeyStore.loadPrimeKey();
  return Buffer.from(aseDecryptSync(key, encrypted) as string, 'base64');
}

export function aesEncrypt(key: Buffer, text: string, ivString: string = defaultIvString) {
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

export function aesDecrypt(key: Buffer, encrypted: string, ivString: string = defaultIvString) {
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

export function aesEncryptSync(key: Buffer, text: string, ivString: string = defaultIvString) {
  checkValueAndIv('Encrypt', text, ivString);

  const iv = Buffer.from(ivString, 'utf8');
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

export function aseDecryptSync(key: Buffer, encrypted: string, ivString: string = defaultIvString) {
  checkValueAndIv('Decrypt', encrypted, ivString);

  const iv = Buffer.from(ivString, 'utf8');
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
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
