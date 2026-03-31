/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockDatabase, Database } from '@nocobase/database';
import { InputInterface } from '../../interfaces/input-interface';

describe('input interface', () => {
  let db: Database;

  beforeEach(async () => {
    db = await createMockDatabase();
    await db.clean({ drop: true });
  });

  afterEach(async () => {
    await db.close();
  });

  describe('validate', () => {
    it('should validate string values', () => {
      const inputInterface = new InputInterface({});
      expect(inputInterface.validate('test string')).toBe(true);
      expect(inputInterface.validate('')).toBe(true);
    });

    it('should validate number values', () => {
      const inputInterface = new InputInterface({});
      expect(inputInterface.validate(123)).toBe(true);
      expect(inputInterface.validate(0)).toBe(true);
      expect(inputInterface.validate(-10.5)).toBe(true);
    });

    it('should reject non-string and non-number values', () => {
      const inputInterface = new InputInterface({});
      expect(inputInterface.validate(null)).toBe(false);
      expect(inputInterface.validate(undefined)).toBe(false);
      expect(inputInterface.validate({})).toBe(false);
      expect(inputInterface.validate([])).toBe(false);
      expect(inputInterface.validate(true)).toBe(false);
    });
  });

  describe('toValue', () => {
    it('should convert valid values to string', () => {
      const inputInterface = new InputInterface({});
      expect(inputInterface.toValue('test')).toBe('test');
      expect(inputInterface.toValue(123)).toBe('123');
      expect(inputInterface.toValue(-10.5)).toBe('-10.5');
    });

    it('should handle null and undefined values by returning null', () => {
      const inputInterface = new InputInterface({});
      expect(inputInterface.toValue(null)).toBeNull();
      expect(inputInterface.toValue(undefined)).toBeUndefined();
    });

    it('should throw error for object values', () => {
      const inputInterface = new InputInterface({});
      expect(() => inputInterface.toValue({})).toThrow('Invalid value, expected string');
      expect(() => inputInterface.toValue([])).toThrow('Invalid value, expected string');
    });
  });
});
