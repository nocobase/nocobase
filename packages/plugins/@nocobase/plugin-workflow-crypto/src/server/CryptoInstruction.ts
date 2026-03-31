/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import crypto from 'crypto';
import { Processor, Instruction, JOB_STATUS, FlowNodeModel } from '@nocobase/plugin-workflow';

const ALGORITHMS = ['aes-256-cbc', 'aes-256-gcm', 'aes-128-cbc', 'aes-128-gcm'] as const;
type Algorithm = (typeof ALGORITHMS)[number];

interface CryptoConfig {
  operation: 'encrypt' | 'decrypt';
  algorithm: Algorithm;
  key: string;
  input: string;
  inputEncoding: 'base64' | 'hex';
  autoParseJson: boolean;
}

function deriveKey(key: string, length: number): Buffer {
  const hash = crypto.createHash('sha256').update(key).digest();
  return hash.subarray(0, length);
}

function getKeyLength(algorithm: Algorithm): number {
  return algorithm.includes('256') ? 32 : 16;
}

function isGcm(algorithm: Algorithm): boolean {
  return algorithm.includes('gcm');
}

function encrypt(input: string, algorithm: Algorithm, keyStr: string, encoding: 'base64' | 'hex'): string {
  const keyLen = getKeyLength(algorithm);
  const key = deriveKey(keyStr, keyLen);
  const iv = crypto.randomBytes(isGcm(algorithm) ? 12 : 16);

  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(input, 'utf8');
  encrypted = Buffer.concat([encrypted, cipher.final()]);

  if (isGcm(algorithm)) {
    const authTag = (cipher as crypto.CipherGCM).getAuthTag();
    return [iv.toString(encoding), authTag.toString(encoding), encrypted.toString(encoding)].join(':');
  }

  return [iv.toString(encoding), encrypted.toString(encoding)].join(':');
}

function decrypt(input: string, algorithm: Algorithm, keyStr: string, encoding: 'base64' | 'hex'): string {
  const keyLen = getKeyLength(algorithm);
  const key = deriveKey(keyStr, keyLen);
  const parts = input.split(':');

  if (isGcm(algorithm)) {
    if (parts.length < 3) {
      throw new Error('Invalid GCM ciphertext format, expected iv:authTag:ciphertext');
    }
    const iv = Buffer.from(parts[0], encoding);
    const authTag = Buffer.from(parts[1], encoding);
    const ciphertext = Buffer.from(parts.slice(2).join(':'), encoding);

    const decipher = crypto.createDecipheriv(algorithm, key, iv) as crypto.DecipherGCM;
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(ciphertext);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString('utf8');
  }

  if (parts.length < 2) {
    throw new Error('Invalid ciphertext format, expected iv:ciphertext');
  }
  const iv = Buffer.from(parts[0], encoding);
  const ciphertext = Buffer.from(parts.slice(1).join(':'), encoding);

  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(ciphertext);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString('utf8');
}

export default class CryptoInstruction extends Instruction {
  async run(node: FlowNodeModel, prevJob, processor: Processor) {
    const {
      operation = 'decrypt',
      algorithm = 'aes-256-cbc',
      key = '',
      inputEncoding = 'base64',
      autoParseJson = true,
    } = node.config as CryptoConfig;

    const resolvedKey = processor.getParsedValue(key, node.id);
    const resolvedInput = processor.getParsedValue(node.config.input, node.id);

    if (!resolvedKey) {
      return { result: { error: 'Key is required' }, status: JOB_STATUS.ERROR };
    }

    if (!resolvedInput) {
      return { result: { error: 'Input is required' }, status: JOB_STATUS.ERROR };
    }

    try {
      let result: any;

      if (operation === 'encrypt') {
        const plaintext = typeof resolvedInput === 'string' ? resolvedInput : JSON.stringify(resolvedInput);
        result = encrypt(plaintext, algorithm, resolvedKey, inputEncoding);
      } else {
        const decrypted = decrypt(String(resolvedInput), algorithm, resolvedKey, inputEncoding);
        if (autoParseJson) {
          try {
            result = JSON.parse(decrypted);
          } catch {
            result = decrypted;
          }
        } else {
          result = decrypted;
        }
      }

      return { result, status: JOB_STATUS.RESOLVED };
    } catch (err) {
      return { result: { error: err.message }, status: JOB_STATUS.ERROR };
    }
  }
}
