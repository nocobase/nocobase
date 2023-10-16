import { getValuesByPath } from '../getValuesByPath';

describe('getValuesByPath', () => {
  it('should return correct value', () => {
    const obj = {
      a: {
        b: 1,
      },
    };
    const result = getValuesByPath(obj, 'a.b');
    expect(result).toEqual(1);
  });

  it('should return an array of values', () => {
    const obj = {
      a: [{ b: 1 }, { b: 2 }],
    };
    const result = getValuesByPath(obj, 'a.b');
    expect(result).toEqual([1, 2]);
  });

  it('should return an array of values', () => {
    const obj = {
      a: [{ b: 1 }],
    };
    const result = getValuesByPath(obj, 'a.b');
    expect(result).toEqual([1]);
  });

  it('nested array', () => {
    const obj = {
      a: [{ b: [{ c: 1 }, { c: 2 }] }, { b: [{ c: 3 }, { c: 4 }] }],
    };
    const result = getValuesByPath(obj, 'a.b.c');
    expect(result).toEqual([1, 2, 3, 4]);
  });

  it('when path is empty', () => {
    const obj = {
      a: { b: 1 },
    };
    const result = getValuesByPath(obj, '');
    expect(result).toEqual(undefined);
  });

  it('when path is not found', () => {
    const obj = {
      a: { b: 1 },
    };
    const result = getValuesByPath(obj, 'a.c');
    expect(result).toEqual(undefined);
  });

  it('when path is not found in nested array', () => {
    const obj = {
      a: [{ b: 1 }, { b: 2 }],
    };
    const result = getValuesByPath(obj, 'a.c');
    expect(result).toEqual(undefined);
  });

  it('when path is not found in nested array with empty string', () => {
    const obj = {
      a: [{ b: 1 }, { b: 2 }],
    };
    const result = getValuesByPath(obj, 'a.');
    expect(result).toEqual(undefined);
  });

  it('when obj is null', () => {
    const obj = null;
    const result = getValuesByPath(obj, 'a.b');
    expect(result).toBe(undefined);
  });

  it('default value', () => {
    const obj = {
      a: { b: 1 },
    };
    const result = getValuesByPath(obj, 'a.c', null);
    expect(result).toEqual(null);
  });

  it('should return empty array when obj key value is undefined', () => {
    const obj = {
      a: undefined,
    };
    const result = getValuesByPath(obj, 'a.b');
    expect(result).toEqual(undefined);
  });

  it('the initial value is an array', () => {
    const arr = [{ b: 1 }, { b: 2 }];
    const result = getValuesByPath(arr, 'b', []);
    expect(result).toEqual([1, 2]);
  });

  it('should return 0 when the initial value is 0', () => {
    const obj = { a: 0 };
    const result = getValuesByPath(obj, 'a');
    expect(result).toBe(0);
  });
});
