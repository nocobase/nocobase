/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Model } from '@nocobase/database';

export function toJSON(data: any): any {
  if (Array.isArray(data)) {
    return data.map(toJSON);
  }
  if (!(data instanceof Model) || !data) {
    return data;
  }
  const result = data.get();
  Object.keys((<typeof Model>data.constructor).associations).forEach((key) => {
    if (result[key] != null && typeof result[key] === 'object') {
      result[key] = toJSON(result[key]);
    }
  });
  return result;
}

export class ObjectCache<T = any> {
  private cache: { [key: string | number]: T } = {};

  get(key: string | number): T {
    return this.cache[key];
  }

  set(key: string | number, value: T): void {
    this.cache[key] = value;
  }

  delete(key: string | number): void {
    delete this.cache[key];
  }

  clear(): void {
    this.cache = {};
  }

  keys(): (string | number)[] {
    return Object.keys(this.cache);
  }

  values(): T[] {
    return Object.values(this.cache);
  }
}
