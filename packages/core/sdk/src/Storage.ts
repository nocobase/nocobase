/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export abstract class BaseStorage {
  storagePrefix: string;
  abstract clear(): void;
  abstract getItem(key: string): string | null;
  abstract removeItem(key: string): void;
  abstract setItem(key: string, value: string): void;

  toUpperCase(prefix = '', ...arr: string[]) {
    return prefix.toUpperCase() + arr.map((str) => str.toUpperCase()).join('_');
  }
}

export class MemoryStorage extends BaseStorage {
  items = new Map();

  clear() {
    this.items.clear();
  }

  getItem(key: string) {
    return this.items.get(key);
  }

  setItem(key: string, value: string) {
    return this.items.set(key, value);
  }

  removeItem(key: string) {
    return this.items.delete(key);
  }
}

export class LocalStorage extends BaseStorage {
  items: Storage;

  constructor(
    public storagePrefix: string,
    public baseStoragePrefix: string = '',
    public shareToken: boolean = false,
  ) {
    super();
    this.items = window.localStorage;
  }

  clear() {
    return this.items.clear();
  }

  getItem(key: string) {
    if (this.shareToken && key === 'token' && this.baseStoragePrefix) {
      return this.items.getItem(this.toUpperCase(this.baseStoragePrefix, key));
    }
    return this.items.getItem(this.toUpperCase(this.storagePrefix, key));
  }

  setItem(key: string, value: string) {
    if (this.shareToken && key === 'token' && this.baseStoragePrefix) {
      return this.items.setItem(this.toUpperCase(this.baseStoragePrefix, key), value);
    }
    return this.items.setItem(this.toUpperCase(this.storagePrefix, key), value);
  }

  removeItem(key: string) {
    if (this.shareToken && key === 'token' && this.baseStoragePrefix) {
      return this.items.removeItem(this.toUpperCase(this.baseStoragePrefix, key));
    }
    return this.items.removeItem(this.toUpperCase(this.storagePrefix, key));
  }
}

export class SessionStorage extends LocalStorage {
  constructor(
    public storagePrefix: string,
    public baseStoragePrefix: string = '',
    public shareToken: boolean = false,
  ) {
    super(storagePrefix, baseStoragePrefix);
    this.items = window.sessionStorage;
  }
}
