/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export const GLOBAL_CONTEXT_KEYS = ['now', 'timestamp', 'env'] as const;

export const HTTP_REQUEST_CONTEXT_KEYS = ['user', 'roleName', 'locale', 'ip', 'headers', 'query', 'params'] as const;

export const SERVER_CONTEXT_PROTOTYPE_KEYS = [
  '__proto__',
  'prototype',
  'constructor',
  'then',
  '__defineGetter__',
  '__defineSetter__',
  '__lookupGetter__',
  '__lookupSetter__',
  'hasOwnProperty',
  'isPrototypeOf',
  'propertyIsEnumerable',
  'toLocaleString',
  'toString',
  'valueOf',
] as const;

export const SERVER_CONTEXT_INTERNAL_KEYS = [
  '_props',
  '_cache',
  '_delegates',
  '_proxy',
  '_getOwn',
  'defineProperty',
  'delegate',
  'clearDelegates',
  'getSandboxKeys',
  'getSandboxValue',
  'createProxy',
] as const;

export const PROTECTED_SERVER_CONTEXT_KEYS = [
  ...GLOBAL_CONTEXT_KEYS,
  ...HTTP_REQUEST_CONTEXT_KEYS,
  ...SERVER_CONTEXT_PROTOTYPE_KEYS,
  ...SERVER_CONTEXT_INTERNAL_KEYS,
] as const;

const protectedServerContextKeys: ReadonlySet<string> = new Set(PROTECTED_SERVER_CONTEXT_KEYS);

export function isProtectedServerContextKey(key: string) {
  return protectedServerContextKeys.has(key);
}
