/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { removeCircularReferences } from '../useLazyLoadDisplayAssociationFieldsOfForm';

describe('removeCircularReferences', () => {
  describe('Primitive values', () => {
    it('should return null as is', () => {
      expect(removeCircularReferences(null)).toBe(null);
    });

    it('should return undefined as is', () => {
      expect(removeCircularReferences(undefined)).toBe(undefined);
    });

    it('should return numbers as is', () => {
      expect(removeCircularReferences(42)).toBe(42);
      expect(removeCircularReferences(0)).toBe(0);
      expect(removeCircularReferences(-1)).toBe(-1);
    });

    it('should return strings as is', () => {
      expect(removeCircularReferences('hello')).toBe('hello');
      expect(removeCircularReferences('')).toBe('');
    });

    it('should return booleans as is', () => {
      expect(removeCircularReferences(true)).toBe(true);
      expect(removeCircularReferences(false)).toBe(false);
    });
  });

  describe('Simple objects and arrays', () => {
    it('should clone simple object', () => {
      const input = { name: 'John', age: 30 };
      const output = removeCircularReferences(input);

      expect(output).toEqual({ name: 'John', age: 30 });
      expect(output).not.toBe(input); // Should be a new object
    });

    it('should clone simple array', () => {
      const input = [1, 2, 3];
      const output = removeCircularReferences(input);

      expect(output).toEqual([1, 2, 3]);
      expect(output).not.toBe(input); // Should be a new array
    });

    it('should handle nested objects', () => {
      const input = {
        user: {
          name: 'John',
          address: {
            city: 'New York',
            zip: '10001',
          },
        },
      };
      const output = removeCircularReferences(input);

      expect(output).toEqual(input);
      expect(output).not.toBe(input);
      expect(output.user).not.toBe(input.user);
    });

    it('should handle nested arrays', () => {
      const input = [
        [1, 2],
        [3, 4],
        [5, 6],
      ];
      const output = removeCircularReferences(input);

      expect(output).toEqual(input);
      expect(output).not.toBe(input);
      expect(output[0]).not.toBe(input[0]);
    });

    it('should handle mixed nested structures', () => {
      const input = {
        users: [
          { name: 'Alice', scores: [90, 85, 88] },
          { name: 'Bob', scores: [75, 80, 82] },
        ],
        metadata: {
          total: 2,
          tags: ['student', 'active'],
        },
      };
      const output = removeCircularReferences(input);

      expect(output).toEqual(input);
    });
  });

  describe('Shared references (not circular)', () => {
    it('should preserve shared object in multiple properties', () => {
      const shared = { id: 1, name: 'shared' };
      const input = { a: shared, b: shared };
      const output = removeCircularReferences(input);

      expect(output).toEqual({
        a: { id: 1, name: 'shared' },
        b: { id: 1, name: 'shared' },
      });
      expect(output.a).toBe(output.b); // Should reference the same cleaned object
    });

    it('should preserve shared object in array', () => {
      const shared = { id: 1, name: 'shared' };
      const input = [shared, shared, shared];
      const output = removeCircularReferences(input);

      expect(output).toEqual([
        { id: 1, name: 'shared' },
        { id: 1, name: 'shared' },
        { id: 1, name: 'shared' },
      ]);
      expect(output[0]).toBe(output[1]);
      expect(output[1]).toBe(output[2]);
    });

    it('should preserve shared object in nested structures', () => {
      const role = { id: 1, name: 'Admin' };
      const input = {
        users: [
          { name: 'Alice', role: role },
          { name: 'Bob', role: role },
        ],
        defaultRole: role,
      };
      const output = removeCircularReferences(input);

      expect(output).toEqual({
        users: [
          { name: 'Alice', role: { id: 1, name: 'Admin' } },
          { name: 'Bob', role: { id: 1, name: 'Admin' } },
        ],
        defaultRole: { id: 1, name: 'Admin' },
      });
      expect(output.users[0].role).toBe(output.users[1].role);
      expect(output.users[0].role).toBe(output.defaultRole);
    });

    it('should preserve shared array in multiple properties', () => {
      const sharedArray = [1, 2, 3];
      const input = { a: sharedArray, b: sharedArray };
      const output = removeCircularReferences(input);

      expect(output).toEqual({
        a: [1, 2, 3],
        b: [1, 2, 3],
      });
      expect(output.a).toBe(output.b);
    });
  });

  describe('Circular references', () => {
    it('should remove self-referencing property', () => {
      const circular: any = { name: 'circular' };
      circular.self = circular;
      const output = removeCircularReferences(circular);

      expect(output).toEqual({ name: 'circular' });
      expect(output.self).toBeUndefined();
    });

    it('should remove circular reference in nested object', () => {
      const parent: any = { name: 'parent' };
      const child: any = { name: 'child', parent: parent };
      parent.child = child;
      const output = removeCircularReferences(parent);

      expect(output).toEqual({
        name: 'parent',
        child: { name: 'child' },
      });
      expect(output.child.parent).toBeUndefined();
    });

    it('should remove circular reference in array', () => {
      const circular: any = { name: 'item' };
      const arr = [circular];
      circular.items = arr;
      const output = removeCircularReferences(arr);

      expect(output).toEqual([{ name: 'item' }]);
      expect(output[0].items).toBeUndefined();
    });

    it('should handle deep circular references', () => {
      const a: any = { name: 'a' };
      const b: any = { name: 'b', ref: a };
      const c: any = { name: 'c', ref: b };
      a.ref = c; // Creates circular: a -> c -> b -> a

      const output = removeCircularReferences(a);

      expect(output.name).toBe('a');
      expect(output.ref.name).toBe('c');
      expect(output.ref.ref.name).toBe('b');
      expect(output.ref.ref.ref).toBeUndefined();
    });

    it('should handle multiple circular references in same structure', () => {
      const obj: any = { name: 'root' };
      obj.self1 = obj;
      obj.self2 = obj;
      obj.data = { value: 42 };

      const output = removeCircularReferences(obj);

      expect(output).toEqual({
        name: 'root',
        data: { value: 42 },
      });
      expect(output.self1).toBeUndefined();
      expect(output.self2).toBeUndefined();
    });
  });

  describe('Complex scenarios', () => {
    it('should handle shared object with internal circular reference', () => {
      const shared: any = { name: 'shared' };
      shared.self = shared;
      const input = { a: shared, b: shared };

      const output = removeCircularReferences(input);

      expect(output).toEqual({
        a: { name: 'shared' },
        b: { name: 'shared' },
      });
      expect(output.a).toBe(output.b); // Same cleaned object
      expect(output.a.self).toBeUndefined();
    });

    it('should handle sibling shared references during processing', () => {
      const siblingShared = { name: 'sibling' };
      const input = {
        a: siblingShared,
        b: siblingShared,
        c: { nested: siblingShared },
      };

      const output = removeCircularReferences(input);

      expect(output.a).toBe(output.b);
      expect(output.a).toBe(output.c.nested);
      expect(output).toEqual({
        a: { name: 'sibling' },
        b: { name: 'sibling' },
        c: { nested: { name: 'sibling' } },
      });
    });

    it('should handle deep structure with shared references at multiple levels', () => {
      const deepShared = { id: 1 };
      const level2 = { shared: deepShared, data: 'level2' };
      const level1 = { shared: deepShared, child: level2, data: 'level1' };

      const output = removeCircularReferences(level1);

      expect(output.shared).toBe(output.child.shared);
      expect(output).toEqual({
        shared: { id: 1 },
        child: { shared: { id: 1 }, data: 'level2' },
        data: 'level1',
      });
    });

    it('should handle array of objects with circular and shared references', () => {
      const shared = { id: 1 };
      const circular: any = { id: 2 };
      circular.self = circular;

      const input = [shared, circular, shared];
      const output = removeCircularReferences(input);

      expect(output).toEqual([{ id: 1 }, { id: 2 }, { id: 1 }]);
      expect(output[0]).toBe(output[2]);
      expect(output[1].self).toBeUndefined();
    });

    it('should handle real-world form data structure', () => {
      const department = { id: 1, name: 'Engineering' };
      const role = { id: 1, name: 'Admin', department };

      const input = {
        users: [
          {
            id: 1,
            name: 'Alice',
            role: role,
            department: department,
          },
          {
            id: 2,
            name: 'Bob',
            role: role,
            department: department,
          },
        ],
        defaultRole: role,
        defaultDepartment: department,
      };

      const output = removeCircularReferences(input);

      // All role references should point to same object
      expect(output.users[0].role).toBe(output.users[1].role);
      expect(output.users[0].role).toBe(output.defaultRole);

      // All department references should point to same object
      expect(output.users[0].department).toBe(output.users[1].department);
      expect(output.users[0].department).toBe(output.defaultDepartment);
      expect(output.users[0].role.department).toBe(output.defaultDepartment);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty object', () => {
      expect(removeCircularReferences({})).toEqual({});
    });

    it('should handle empty array', () => {
      expect(removeCircularReferences([])).toEqual([]);
    });

    it('should handle object with undefined values', () => {
      const input = { a: 1, b: undefined, c: 3 };
      const output = removeCircularReferences(input);

      expect(output).toEqual({ a: 1, c: 3 });
      expect('b' in output).toBe(false);
    });

    it('should handle array with undefined values', () => {
      const input = [1, undefined, 3];
      const output = removeCircularReferences(input);

      expect(output).toEqual([1, undefined, 3]);
    });

    it('should not process non-plain objects (Date, RegExp, etc.)', () => {
      const date = new Date('2024-01-01');
      const regex = /test/;
      const input = { date, regex, number: 42 };

      const output = removeCircularReferences(input);

      expect(output.date).toBe(date);
      expect(output.regex).toBe(regex);
      expect(output.number).toBe(42);
    });

    it('should handle object with null prototype', () => {
      const obj = Object.create(null);
      obj.a = 1;
      obj.b = 2;

      const input = { data: obj };
      const output = removeCircularReferences(input);

      // Non-plain object should be preserved as-is
      expect(output.data).toBe(obj);
    });

    it('should handle very deep nesting', () => {
      let deep: any = { value: 0 };
      for (let i = 1; i < 100; i++) {
        deep = { value: i, child: deep };
      }

      const output = removeCircularReferences(deep);

      // Should successfully process without stack overflow
      expect(output.value).toBe(99);
      let current = output;
      for (let i = 99; i >= 0; i--) {
        expect(current.value).toBe(i);
        current = current.child;
      }
      expect(current).toBeUndefined();
    });

    it('should handle object with circular reference to parent at multiple levels', () => {
      const root: any = { name: 'root' };
      const level1: any = { name: 'level1', parent: root };
      const level2: any = { name: 'level2', parent: level1, root: root };
      root.level1 = level1;
      level1.level2 = level2;

      const output = removeCircularReferences(root);

      expect(output.name).toBe('root');
      expect(output.level1.name).toBe('level1');
      expect(output.level1.level2.name).toBe('level2');
      expect(output.level1.parent).toBeUndefined();
      expect(output.level1.level2.parent).toBeUndefined();
      expect(output.level1.level2.root).toBeUndefined();
    });
  });

  describe('Properties with falsy values', () => {
    it('should preserve properties with value 0', () => {
      const input = { count: 0, name: 'test' };
      const output = removeCircularReferences(input);

      expect(output).toEqual({ count: 0, name: 'test' });
    });

    it('should preserve properties with empty string', () => {
      const input = { name: '', value: 'test' };
      const output = removeCircularReferences(input);

      expect(output).toEqual({ name: '', value: 'test' });
    });

    it('should preserve properties with false', () => {
      const input = { active: false, name: 'test' };
      const output = removeCircularReferences(input);

      expect(output).toEqual({ active: false, name: 'test' });
    });

    it('should preserve properties with null', () => {
      const input = { data: null, name: 'test' };
      const output = removeCircularReferences(input);

      expect(output).toEqual({ data: null, name: 'test' });
    });

    it('should omit properties with undefined', () => {
      const input = { data: undefined, name: 'test' };
      const output = removeCircularReferences(input);

      expect(output).toEqual({ name: 'test' });
      expect('data' in output).toBe(false);
    });
  });
});
