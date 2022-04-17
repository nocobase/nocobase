import { assign } from '../assign';

describe('merge strategy', () => {
  describe('andMerge', () => {
    it('case 1', () => {
      const obj = assign(
        {},
        {
          filter: { a: 'a2' },
        },
        {
          filter: 'andMerge',
        },
      );
      expect(obj).toMatchObject({
        filter: { a: 'a2' },
      });
    });
    it('case 2', () => {
      const obj = assign(
        {
          filter: { a: 'a1' },
        },
        {},
        {
          filter: 'andMerge',
        },
      );
      expect(obj).toMatchObject({
        filter: { a: 'a1' },
      });
    });
    it('case 3', () => {
      const obj = assign(
        {
          filter: { a: 'a1' },
        },
        {
          filter: undefined,
        },
        {
          filter: 'andMerge',
        },
      );
      expect(obj).toMatchObject({
        filter: { a: 'a1' },
      });
    });
    it('case 4', () => {
      const obj = assign(
        {
          filter: { a: 'a1' },
        },
        {
          filter: { a: 'a2' },
        },
        {
          filter: 'andMerge',
        },
      );
      expect(obj).toMatchObject({
        filter: {
          $and: [{ a: 'a1' }, { a: 'a2' }],
        },
      });
    });
  });

  describe('orMerge', () => {
    it('case 1', () => {
      const obj = assign(
        {},
        {
          filter: { a: 'a2' },
        },
        {
          filter: 'orMerge',
        },
      );
      expect(obj).toMatchObject({
        filter: { a: 'a2' },
      });
    });
    it('case 2', () => {
      const obj = assign(
        {
          filter: { a: 'a1' },
        },
        {},
        {
          filter: 'orMerge',
        },
      );
      expect(obj).toMatchObject({
        filter: { a: 'a1' },
      });
    });
    it('case 3', () => {
      const obj = assign(
        {
          filter: { a: 'a1' },
        },
        {
          filter: undefined,
        },
        {
          filter: 'orMerge',
        },
      );
      expect(obj).toMatchObject({
        filter: { a: 'a1' },
      });
    });
    it('case 4', () => {
      const obj = assign(
        {
          filter: { a: 'a1' },
        },
        {
          filter: { a: 'a2' },
        },
        {
          filter: 'orMerge',
        },
      );
      expect(obj).toMatchObject({
        filter: {
          $or: [{ a: 'a1' }, { a: 'a2' }],
        },
      });
    });
  });

  describe('intersect', () => {
    it('case 1', () => {
      const obj = assign(
        {
          key1: ['val1'],
        },
        {
          key1: ['val2'],
        },
        {
          key1: 'intersect',
        },
      );
      expect(obj).toMatchObject({
        key1: [],
      });
    });
    it('case 2', () => {
      const obj = assign(
        {
          key1: ['val1'],
        },
        {},
        {
          key1: 'intersect',
        },
      );
      expect(obj).toMatchObject({
        key1: ['val1'],
      });
    });
    it('case 3', () => {
      const obj = assign(
        {},
        {
          key1: ['val2'],
        },
        {
          key1: 'intersect',
        },
      );
      expect(obj).toMatchObject({
        key1: ['val2'],
      });
    });
    it('case 4', () => {
      const obj = assign(
        {
          key1: 'a,b,c',
        },
        {
          key1: 'b,c,d',
        },
        {
          key1: 'intersect',
        },
      );
      expect(obj).toMatchObject({
        key1: ['b', 'c'],
      });
    });
    it('case 5', () => {
      const obj = assign(
        {
          key1: 'a,b,c',
        },
        {
          key1: ['b', 'c', 'd'],
        },
        {
          key1: 'intersect',
        },
      );
      expect(obj).toMatchObject({
        key1: ['b', 'c'],
      });
    });
  });

  describe('union', () => {
    it('case 1', () => {
      const obj = assign(
        {
          key1: ['val1'],
        },
        {
          key1: ['val2'],
        },
        {
          key1: 'union',
        },
      );
      expect(obj).toMatchObject({
        key1: ['val1', 'val2'],
      });
    });
    it('case 2', () => {
      const obj = assign(
        {
          key1: ['val1'],
        },
        {},
        {
          key1: 'union',
        },
      );
      expect(obj).toMatchObject({
        key1: ['val1'],
      });
    });
    it('case 3', () => {
      const obj = assign(
        {},
        {
          key1: ['val2'],
        },
        {
          key1: 'union',
        },
      );
      expect(obj).toMatchObject({
        key1: ['val2'],
      });
    });
    it('case 4', () => {
      const obj = assign(
        {
          key1: 'a,b,c',
        },
        {
          key1: 'b,c,d',
        },
        {
          key1: 'union',
        },
      );
      expect(obj).toMatchObject({
        key1: ['a', 'b', 'c', 'd'],
      });
    });
    it('case 5', () => {
      const obj = assign(
        {
          key1: 'a,b,c',
        },
        {
          key1: ['b', 'c', 'd'],
        },
        {
          key1: 'union',
        },
      );
      expect(obj).toMatchObject({
        key1: ['a', 'b', 'c', 'd'],
      });
    });
  });

  describe('function', () => {
    it('case 1', () => {
      const obj = assign(
        {
          key1: 'val1',
        },
        {
          key1: 'val2',
        },
        {
          key1: (x, y) => `${x} + ${y}`,
        },
      );
      expect(obj).toMatchObject({
        key1: 'val1 + val2',
      });
    });
  });

  describe('merge', () => {
    it('case 1', () => {
      const obj = assign(
        {
          key1: { a: 'a1' },
        },
        {
          key1: { b: 'b1' },
        },
        {
          key1: 'merge',
        },
      );
      expect(obj).toMatchObject({
        key1: { b: 'b1' },
      });
    });
  });

  describe('default = deepmerge', () => {
    it('case 1', () => {
      const obj = assign(
        {
          key1: 'val1',
        },
        {
          key1: 'val2',
        },
      );
      expect(obj).toMatchObject({
        key1: 'val2',
      });
    });
    it('case 2', () => {
      const obj = assign(
        {
          key1: 'val1',
        },
        {
          key1: null,
        },
      );
      expect(obj).toMatchObject({
        key1: null,
      });
    });
    it('case 3', () => {
      const obj = assign(
        {
          key1: 'val1',
        },
        {
          key1: {},
        },
      );
      expect(obj).toMatchObject({
        key1: {},
      });
    });
    it('case 3', () => {
      const obj = assign(
        {
          key1: 'val1',
        },
        {
          key1: [],
        },
      );
      expect(obj).toMatchObject({
        key1: [],
      });
    });
    it('case 4', () => {
      const obj = assign(
        {
          key1: ['val1'],
        },
        {
          key1: ['val2'],
        },
      );
      expect(obj).toMatchObject({
        key1: ['val2'],
      });
    });
    it('case 5', () => {
      const obj = assign(
        {
          key1: { a: 'a1' },
        },
        {
          key1: { b: 'b1' },
        },
      );
      expect(obj).toMatchObject({
        key1: { a: 'a1', b: 'b1' },
      });
    });
  });
});
