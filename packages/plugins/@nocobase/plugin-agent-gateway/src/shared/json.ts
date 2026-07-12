/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export type JsonRecord = Record<string, unknown>;

export function isJsonRecord(value: unknown): value is JsonRecord {
  return Object.prototype.toString.call(value) === '[object Object]';
}

export function getJsonRecord(value: unknown): JsonRecord {
  return isJsonRecord(value) ? value : {};
}

export function getJsonArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

export function getJsonString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}
