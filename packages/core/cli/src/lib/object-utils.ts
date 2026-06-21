/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export function pickKeys<T extends Record<PropertyKey, unknown>, K extends PropertyKey>(
  object: T,
  keys: readonly K[],
): Partial<Record<Extract<K, keyof T>, T[Extract<K, keyof T>]>> {
  const picked = {} as Partial<Record<Extract<K, keyof T>, T[Extract<K, keyof T>]>>;

  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(object, key)) {
      const typedKey = key as Extract<K, keyof T>;
      picked[typedKey] = object[typedKey];
    }
  }

  return picked;
}

export function omitKeys<T extends Record<PropertyKey, unknown>, K extends PropertyKey>(
  object: T,
  keys: readonly K[],
): Omit<T, Extract<K, keyof T>> {
  const omittedKeys = new Set<PropertyKey>(keys);
  const result = {} as Omit<T, Extract<K, keyof T>>;

  for (const key of Object.keys(object) as Array<keyof T>) {
    if (!omittedKeys.has(key)) {
      const typedKey = key as Exclude<keyof T, Extract<K, keyof T>>;
      result[typedKey] = object[typedKey] as Omit<T, Extract<K, keyof T>>[typeof typedKey];
    }
  }

  return result;
}

export function upperFirst(value: string): string {
  if (!value) {
    return value;
  }

  return value[0].toUpperCase() + value.slice(1);
}

export function deepEqual(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) {
    return true;
  }

  if (left == null || right == null) {
    return false;
  }

  if (typeof left !== typeof right) {
    return false;
  }

  if (typeof left !== 'object') {
    return false;
  }

  if (Array.isArray(left) || Array.isArray(right)) {
    if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length) {
      return false;
    }

    for (let index = 0; index < left.length; index += 1) {
      if (!deepEqual(left[index], right[index])) {
        return false;
      }
    }

    return true;
  }

  const leftObject = left as Record<string, unknown>;
  const rightObject = right as Record<string, unknown>;
  const leftKeys = Object.keys(leftObject);
  const rightKeys = Object.keys(rightObject);

  if (leftKeys.length !== rightKeys.length) {
    return false;
  }

  for (const key of leftKeys) {
    if (!Object.prototype.hasOwnProperty.call(rightObject, key)) {
      return false;
    }

    if (!deepEqual(leftObject[key], rightObject[key])) {
      return false;
    }
  }

  return true;
}
