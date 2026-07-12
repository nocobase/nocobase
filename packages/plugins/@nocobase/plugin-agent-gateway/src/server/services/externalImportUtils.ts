/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createHash } from 'crypto';

import { JsonRecord } from '../actions/utils';

function isRecord(value: unknown): value is JsonRecord {
  return Object.prototype.toString.call(value) === '[object Object]';
}

export function sanitizeExternalImportKeyPart(value: string, maxLength = 96) {
  return value
    .trim()
    .replace(/[^A-Za-z0-9_.:/-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, maxLength);
}

export function hashExternalImportValue(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

function getCanonicalValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => getCanonicalValue(entry));
  }
  if (isRecord(value)) {
    return Object.keys(value)
      .sort()
      .reduce<JsonRecord>((result, key) => {
        const entry = value[key];
        if (entry !== undefined) {
          result[key] = getCanonicalValue(entry);
        }
        return result;
      }, {});
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  return value;
}

export function getCanonicalExternalImportJson(value: unknown) {
  return JSON.stringify(getCanonicalValue(value));
}
