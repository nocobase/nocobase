/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { BaseStorage, LocalStorage, MemoryStorage, SessionStorage } from '../Storage';

describe('Storage', () => {
  describe('BaseStorage', () => {
    test('toUpperCase should convert strings to uppercase and join with underscore', () => {
      class TestStorage extends BaseStorage {
        clear() {}
        getItem() {
          return null;
        }
        removeItem() {}
        setItem() {}
      }

      const storage = new TestStorage();
      expect(storage.toUpperCase('prefix_', 'key')).toBe('PREFIX_KEY');
      expect(storage.toUpperCase('app_', 'token', 'auth')).toBe('APP_TOKEN_AUTH');
      expect(storage.toUpperCase('test_')).toBe('TEST_');
    });
  });

  describe('MemoryStorage', () => {
    let storage: MemoryStorage;

    beforeEach(() => {
      storage = new MemoryStorage();
    });

    test('should set and get item', () => {
      storage.setItem('key1', 'value1');
      expect(storage.getItem('key1')).toBe('value1');
    });

    test('should return null for non-existent item', () => {
      expect(storage.getItem('non-existent')).toBeUndefined();
    });

    test('should remove item', () => {
      storage.setItem('key1', 'value1');
      storage.removeItem('key1');
      expect(storage.getItem('key1')).toBeUndefined();
    });

    test('should clear all items', () => {
      storage.setItem('key1', 'value1');
      storage.setItem('key2', 'value2');
      storage.clear();
      expect(storage.getItem('key1')).toBeUndefined();
      expect(storage.getItem('key2')).toBeUndefined();
    });

    test('should overwrite existing item', () => {
      storage.setItem('key1', 'value1');
      storage.setItem('key1', 'value2');
      expect(storage.getItem('key1')).toBe('value2');
    });
  });

  describe('LocalStorage', () => {
    let storage: LocalStorage;
    let mockLocalStorage: { [key: string]: string };

    beforeEach(() => {
      mockLocalStorage = {};
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: vitest.fn((key: string) => mockLocalStorage[key] || null),
          setItem: vitest.fn((key: string, value: string) => {
            mockLocalStorage[key] = value;
          }),
          removeItem: vitest.fn((key: string) => {
            delete mockLocalStorage[key];
          }),
          clear: vitest.fn(() => {
            mockLocalStorage = {};
          }),
        },
        writable: true,
      });
      storage = new LocalStorage('testPrefix_');
    });

    afterEach(() => {
      vitest.restoreAllMocks();
    });

    test('should set and get item with prefix', () => {
      storage.setItem('key1', 'value1');
      expect(storage.getItem('key1')).toBe('value1');
      expect(window.localStorage.setItem).toHaveBeenCalledWith('TESTPREFIX_KEY1', 'value1');
      expect(window.localStorage.getItem).toHaveBeenCalledWith('TESTPREFIX_KEY1');
    });

    test('should return null for non-existent item', () => {
      expect(storage.getItem('non-existent')).toBeNull();
    });

    test('should remove item with prefix', () => {
      storage.setItem('key1', 'value1');
      storage.removeItem('key1');
      expect(window.localStorage.removeItem).toHaveBeenCalledWith('TESTPREFIX_KEY1');
      expect(storage.getItem('key1')).toBeNull();
    });

    test('should clear all items', () => {
      storage.setItem('key1', 'value1');
      storage.setItem('key2', 'value2');
      storage.clear();
      expect(window.localStorage.clear).toHaveBeenCalled();
    });

    test('should handle multiple prefixes correctly', () => {
      const storage2 = new LocalStorage('anotherPrefix_');
      storage.setItem('key1', 'value1');
      storage2.setItem('key1', 'value2');
      expect(storage.getItem('key1')).toBe('value1');
      expect(storage2.getItem('key1')).toBe('value2');
    });

    test('should convert prefix and key to uppercase', () => {
      const storage2 = new LocalStorage('myApp_');
      storage2.setItem('userToken', 'token123');
      expect(window.localStorage.setItem).toHaveBeenCalledWith('MYAPP_USERTOKEN', 'token123');
    });
  });

  describe('SessionStorage', () => {
    let storage: SessionStorage;
    let mockSessionStorage: { [key: string]: string };

    beforeEach(() => {
      mockSessionStorage = {};
      Object.defineProperty(window, 'sessionStorage', {
        value: {
          getItem: vitest.fn((key: string) => mockSessionStorage[key] || null),
          setItem: vitest.fn((key: string, value: string) => {
            mockSessionStorage[key] = value;
          }),
          removeItem: vitest.fn((key: string) => {
            delete mockSessionStorage[key];
          }),
          clear: vitest.fn(() => {
            mockSessionStorage = {};
          }),
        },
        writable: true,
      });
      storage = new SessionStorage('testPrefix_');
    });

    afterEach(() => {
      vitest.restoreAllMocks();
    });

    test('should set and get item with prefix', () => {
      storage.setItem('key1', 'value1');
      expect(storage.getItem('key1')).toBe('value1');
      expect(window.sessionStorage.setItem).toHaveBeenCalledWith('TESTPREFIX_KEY1', 'value1');
      expect(window.sessionStorage.getItem).toHaveBeenCalledWith('TESTPREFIX_KEY1');
    });

    test('should return null for non-existent item', () => {
      expect(storage.getItem('non-existent')).toBeNull();
    });

    test('should remove item with prefix', () => {
      storage.setItem('key1', 'value1');
      storage.removeItem('key1');
      expect(window.sessionStorage.removeItem).toHaveBeenCalledWith('TESTPREFIX_KEY1');
      expect(storage.getItem('key1')).toBeNull();
    });

    test('should clear all items', () => {
      storage.setItem('key1', 'value1');
      storage.setItem('key2', 'value2');
      storage.clear();
      expect(window.sessionStorage.clear).toHaveBeenCalled();
    });

    test('should handle multiple prefixes correctly', () => {
      const storage2 = new SessionStorage('anotherPrefix_');
      storage.setItem('key1', 'value1');
      storage2.setItem('key1', 'value2');
      expect(storage.getItem('key1')).toBe('value1');
      expect(storage2.getItem('key1')).toBe('value2');
    });

    test('should convert prefix and key to uppercase', () => {
      const storage2 = new SessionStorage('myApp_');
      storage2.setItem('userToken', 'token123');
      expect(window.sessionStorage.setItem).toHaveBeenCalledWith('MYAPP_USERTOKEN', 'token123');
    });
  });
});
