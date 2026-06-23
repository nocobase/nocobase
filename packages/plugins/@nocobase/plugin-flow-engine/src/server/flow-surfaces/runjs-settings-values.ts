/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import _ from 'lodash';
import { throwBadRequest } from './errors';

const MAX_VALUES_BYTES = 64 * 1024;
const MAX_TOP_LEVEL_KEYS = 200;
const MAX_DEPTH = 8;
const SAFE_TOP_LEVEL_KEY_RE = /^[A-Za-z0-9_-]+$/;
const DANGEROUS_KEYS = new Set(['__proto__', 'prototype', 'constructor']);
const ENVELOPE_KEYS_BY_TYPE: Record<string, string[]> = {
  dataSource: ['$type', 'name'],
  collection: ['$type', 'dataSource', 'name'],
  collectionField: ['$type', 'dataSource', 'collection', 'name'],
};

function assertSafeTopLevelKey(key: string, path: string) {
  if (!key || key.length > 80 || !SAFE_TOP_LEVEL_KEY_RE.test(key) || DANGEROUS_KEYS.has(key)) {
    throwBadRequest(`${path} key '${key}' is not allowed`);
  }
}

function assertNoDangerousKey(key: string, path: string) {
  if (DANGEROUS_KEYS.has(key)) {
    throwBadRequest(`${path}.${key} is not allowed`);
  }
}

function assertJsonSafety(value: unknown, path: string, depth = 0) {
  if (depth > MAX_DEPTH) {
    throwBadRequest(`${path} exceeds maximum depth ${MAX_DEPTH}`);
  }
  if (value === null || typeof value === 'string' || typeof value === 'boolean') {
    return;
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throwBadRequest(`${path} must be a finite number`);
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertJsonSafety(item, `${path}[${index}]`, depth + 1));
    return;
  }
  if (!_.isPlainObject(value)) {
    throwBadRequest(`${path} must be a JSON value`);
  }
  Object.entries(value as Record<string, unknown>).forEach(([key, child]) => {
    assertNoDangerousKey(key, path);
    assertJsonSafety(child, `${path}.${key}`, depth + 1);
  });
}

function assertTopLevelEnvelope(value: Record<string, unknown>, path: string) {
  if (!Object.prototype.hasOwnProperty.call(value, '$type')) {
    return;
  }
  const type = typeof value.$type === 'string' ? value.$type : '';
  const allowedKeys = ENVELOPE_KEYS_BY_TYPE[type];
  if (!allowedKeys) {
    throwBadRequest(`${path}.$type '${type || String(value.$type)}' is not supported`);
  }
  const keys = Object.keys(value);
  const extraKeys = keys.filter((key) => !allowedKeys.includes(key));
  const missingKeys = allowedKeys.filter((key) => !keys.includes(key));
  if (extraKeys.length || missingKeys.length) {
    throwBadRequest(
      `${path} ${type} envelope shape is invalid` +
        (missingKeys.length ? `; missing keys: ${missingKeys.join(', ')}` : '') +
        (extraKeys.length ? `; unsupported keys: ${extraKeys.join(', ')}` : ''),
    );
  }
  allowedKeys
    .filter((key) => key !== '$type')
    .forEach((key) => {
      if (typeof value[key] !== 'string' || !String(value[key]).trim()) {
        throwBadRequest(`${path}.${key} must be a non-empty string`);
      }
    });
}

export function normalizeRunJSSettingsConfigureValues(value: unknown, path: string): Record<string, unknown> {
  if (!_.isPlainObject(value)) {
    throwBadRequest(`${path} must be a plain object`);
  }
  const values = _.cloneDeep(value as Record<string, unknown>);
  const keys = Object.keys(values);
  if (keys.length > MAX_TOP_LEVEL_KEYS) {
    throwBadRequest(`${path} supports at most ${MAX_TOP_LEVEL_KEYS} top-level keys`);
  }
  let serialized = '';
  try {
    serialized = JSON.stringify(values);
  } catch {
    throwBadRequest(`${path} must be JSON serializable`);
  }
  if (serialized.length > MAX_VALUES_BYTES) {
    throwBadRequest(`${path} exceeds maximum size ${MAX_VALUES_BYTES} bytes`);
  }
  keys.forEach((key) => {
    assertSafeTopLevelKey(key, path);
    const itemPath = `${path}.${key}`;
    const item = values[key];
    assertJsonSafety(item, itemPath, 1);
    if (_.isPlainObject(item)) {
      assertTopLevelEnvelope(item as Record<string, unknown>, itemPath);
    }
  });
  return values;
}

export function normalizeRunJSSettingsUnsetKeys(value: unknown, path: string): string[] {
  if (typeof value === 'undefined') {
    return [];
  }
  if (!Array.isArray(value)) {
    throwBadRequest(`${path} must be an array`);
  }
  return value.map((key, index) => {
    if (typeof key !== 'string') {
      throwBadRequest(`${path}[${index}] must be a string`);
    }
    assertSafeTopLevelKey(key, `${path}[${index}]`);
    return key;
  });
}
