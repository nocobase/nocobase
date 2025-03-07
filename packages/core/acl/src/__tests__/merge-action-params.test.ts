/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { mergeAclActionParams } from '../utils';

describe('mergeAclActionParams', () => {
  describe('filter union: orMerge', () => {
    it('should return empty object when both filters are empty', () => {
      const actual = mergeAclActionParams(
        {
          filter: {},
        },
        { filter: {} },
      );
      expect(actual).toEqual({ filter: {} });
    });

    it('should return empty object when one filter is undefined', () => {
      const actual = mergeAclActionParams(
        {
          filter: { name: 'zhangsan' },
        },
        { filter: undefined },
      );
      expect(actual).toEqual({ filter: {} });
    });

    it('should merge two simple filters with $or', () => {
      const actual = mergeAclActionParams(
        {
          filter: { name: 'zhangsan' },
        },
        { filter: { age: 12 } },
      );
      expect(actual.filter.$or).toHaveLength(2);
      expect(actual.filter.$or).toContainEqual({ name: 'zhangsan' });
      expect(actual.filter.$or).toContainEqual({ age: 12 });
    });

    it('should merge filter with existing $or array', () => {
      const actual = mergeAclActionParams(
        {
          filter: { $or: [{ name: 'zhangsan' }] },
        },
        { filter: { age: 12 } },
      );
      expect(actual.filter.$or).toHaveLength(2);
      expect(actual.filter.$or).toContainEqual({ name: 'zhangsan' });
      expect(actual.filter.$or).toContainEqual({ age: 12 });
    });

    it('should merge two $or arrays', () => {
      const actual = mergeAclActionParams(
        {
          filter: { $or: [{ name: 'zhangsan' }] },
        },
        { filter: { $or: [{ age: 12 }] } },
      );
      expect(actual.filter.$or).toHaveLength(2);
      expect(actual.filter.$or).toContainEqual({ name: 'zhangsan' });
      expect(actual.filter.$or).toContainEqual({ age: 12 });
    });

    it('should handle complex filters with $and', () => {
      const actual = mergeAclActionParams(
        {
          filter: { $and: [{ name: 'zhangsan' }, { email: '123@qq.com' }] },
        },
        { filter: { age: 12 } },
      );
      expect(actual.filter.$or).toHaveLength(2);
      expect(actual.filter.$or).toContainEqual({ $and: [{ name: 'zhangsan' }, { email: '123@qq.com' }] });
      expect(actual.filter.$or).toContainEqual({ age: 12 });
    });
  });

  // fields/whitelist/appends 相同的行为
  describe('fields union', () => {
    it('should return {} when one of fields not exist', () => {
      const actual = mergeAclActionParams({}, { fields: [] });
      expect(actual).toEqual({});
    });

    it('should return { fields: [] } when fields is undefined or []', () => {
      const actual = mergeAclActionParams({ fields: undefined }, { fields: [] });
      expect(actual).toEqual({ fields: [] });
    });

    it('should return { fields: [name] } when one of fields is undefined', () => {
      const actual = mergeAclActionParams({ fields: undefined }, { fields: ['name'] });
      expect(actual).toEqual({ fields: ['name'] });
    });

    it('should handle fields union', () => {
      const actual = mergeAclActionParams(
        {
          fields: ['name', 'age'],
        },
        { fields: ['age', 'email'] },
      );
      expect(actual.fields).toEqual(expect.arrayContaining(['name', 'age', 'email']));
    });
  });

  describe('own cover', () => {
    it('should handle own property', () => {
      const actual = mergeAclActionParams(
        {
          own: true,
        },
        { own: false },
      );
      expect(actual.own).toBe(true);
    });
  });
});
