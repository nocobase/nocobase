/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { UIOperationCodec } from '@nocobase/shared';

const base64UrlPattern = /^[A-Za-z0-9_-]*$/;
const utf8Encoder = new TextEncoder();
const utf8Decoder = new TextDecoder('utf-8', { fatal: true });

function bytesToBinaryString(bytes: Uint8Array): string {
  let result = '';
  for (const byte of bytes) {
    result += String.fromCharCode(byte);
  }
  return result;
}

function binaryStringToBytes(value: string): Uint8Array {
  const bytes = new Uint8Array(value.length);
  for (let index = 0; index < value.length; index += 1) {
    bytes[index] = value.charCodeAt(index);
  }
  return bytes;
}

function encodeBrowserUIOperation(value: string): string {
  return btoa(bytesToBinaryString(utf8Encoder.encode(value)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export const browserUIOperationCodec: UIOperationCodec = {
  encode: encodeBrowserUIOperation,
  decode(value) {
    if (!base64UrlPattern.test(value) || value.length % 4 === 1) {
      return undefined;
    }

    try {
      const paddedValue = `${value.replace(/-/g, '+').replace(/_/g, '/')}${'='.repeat((4 - (value.length % 4)) % 4)}`;
      const decoded = utf8Decoder.decode(binaryStringToBytes(atob(paddedValue)));
      return encodeBrowserUIOperation(decoded) === value ? decoded : undefined;
    } catch {
      return undefined;
    }
  },
};
