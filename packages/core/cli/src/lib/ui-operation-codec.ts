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
const utf8Decoder = new TextDecoder('utf-8', { fatal: true });

function encodeNodeUIOperation(value: string): string {
  return Buffer.from(value, 'utf8').toString('base64url');
}

export const nodeUIOperationCodec: UIOperationCodec = {
  encode: encodeNodeUIOperation,
  decode(value) {
    if (!base64UrlPattern.test(value) || value.length % 4 === 1) {
      return undefined;
    }

    try {
      const bytes = Buffer.from(value, 'base64url');
      const decoded = utf8Decoder.decode(bytes);
      return encodeNodeUIOperation(decoded) === value ? decoded : undefined;
    } catch {
      return undefined;
    }
  },
};
