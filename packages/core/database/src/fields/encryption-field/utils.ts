/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import crypto, { BinaryToTextEncoding } from 'crypto';
import { EncryptionError } from './errors/EncryptionError';
import path from 'path';
import { customAlphabet } from 'nanoid';
import fs from 'fs-extra';
import { AESCodec } from './codec';

const nanoid = customAlphabet('0123456789', 21);

const algorithm = 'aes-256-cbc';

const encryptionFieldPrimeKeyPath =
  process.env.ENCRYPTION_FIELD_KEY_PATH || path.resolve(process.cwd(), 'storage', 'encryption-field-keys');

export const Generator = {
  iv: () => crypto.randomBytes(16),
  key: () => crypto.randomBytes(32),
};

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
  const subfix = '.key';
  const encoding = 'base64';
  const keyPath = targetKeyPath || encryptionFieldPrimeKeyPath;
  const toEntry = (keyPath: string, key: string) => ({
    id: path.basename(keyPath, subfix),
    key: Buffer.from(key, encoding),
  });

  if (keyPath.endsWith(subfix)) {
    if (!fs.existsSync(keyPath)) {
      throw new EncryptionError('The environment variable `ENCRYPTION_FIELD_KEY_PATH` point to a non-existent file.');
    }
    const fieldKey = fs.readFileSync(keyPath, 'utf8');
    return toEntry(keyPath, fieldKey);
  } else {
    if (!fs.existsSync(keyPath)) {
      fs.mkdirSync(keyPath, { recursive: true });
    }
    const primeKeyPath = readFirstFile(keyPath);
    if (primeKeyPath) {
      const fieldKey = fs.readFileSync(primeKeyPath, 'utf8');
      return toEntry(primeKeyPath, fieldKey);
    }
    const id = nanoid();
    const key = Generator.key();
    fs.writeFileSync(path.resolve(keyPath, id + subfix), key.toString(encoding), { encoding: 'utf8' });
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

export async function encryptFieldKey(fieldKey: Buffer, iv: Buffer, keyEntry?: KeyStoreEntry) {
  const codec = new AESCodec(algorithm);
  const { id, key } = keyEntry ?? KeyStore.loadPrimeKey();
  return {
    id,
    encrypted: await codec.encrypt(key, iv, fieldKey),
  };
}

export async function decryptFieldKey(iv: string, encrypted: string, keyEntry?: KeyStoreEntry) {
  const codec = new AESCodec(algorithm);
  const { key } = keyEntry ?? KeyStore.loadPrimeKey();
  return await codec.decrypt(key, Buffer.from(iv, 'base64'), Buffer.from(encrypted, 'base64'));
}

export function decryptFieldKeySync(iv: string, encrypted: string, keyEntry?: KeyStoreEntry) {
  const codec = new AESCodec(algorithm);
  const { key } = keyEntry ?? KeyStore.loadPrimeKey();
  return codec.decryptSync(key, Buffer.from(iv, 'base64'), Buffer.from(encrypted, 'base64'));
}

export function generateSignature(key: Buffer, message: string, encoding: BinaryToTextEncoding = 'base64'): string {
  const hmac = crypto.createHmac('sha256', key as unknown as Uint8Array);
  hmac.update(message);
  return hmac.digest(encoding);
}

export class EncryptedField {
  static codec: AESCodec = new AESCodec('aes-256-cbc');
  static encoding: BufferEncoding = 'base64';
  static delimiter = '.';

  constructor(
    private readonly _iv: Buffer,
    private readonly _value: unknown,
    private readonly _serializedField: string,
  ) {}

  get iv() {
    return this._iv;
  }

  get value() {
    return this._value;
  }

  get serializedField() {
    return this._serializedField;
  }

  static async serializer({ key, iv, value }: { key: Buffer; iv: Buffer; value: string }): Promise<EncryptedField> {
    const encrypted = await EncryptedField.codec.encrypt(key, iv, Buffer.from(value, 'utf8'));
    const signature = generateSignature(key, String(value));
    const ivBuffer = iv as unknown as Uint8Array;
    const encryptedBuffer = encrypted as unknown as Uint8Array;
    const serializedValue = Buffer.concat([ivBuffer, encryptedBuffer]).toString(EncryptedField.encoding);
    return new EncryptedField(iv, value, signature + EncryptedField.delimiter + serializedValue);
  }

  static async deserializer(key: Buffer, serializedField: string): Promise<EncryptedField> {
    const [_signature, serializedValue] = serializedField.split(EncryptedField.delimiter);
    const buff = Buffer.from(serializedValue, EncryptedField.encoding);
    const iv = buff.subarray(0, 16);
    const encrypted = buff.subarray(16);
    const value = await EncryptedField.codec.decrypt(key, iv, encrypted);
    return new EncryptedField(iv, value.toString('utf8'), serializedField);
  }
}
