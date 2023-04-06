import { forEach } from '../forEach';

describe('forEach', () => {
  test('array', () => {
    const arr = [1, 2, 3];
    const result = [];
    forEach(arr, (value, index) => {
      result.push(value);
    });
    expect(result).toEqual(arr);
  });

  test('object', () => {
    const obj = { a: 1, b: 2, c: 3 };
    const result = [];
    forEach(obj, (value, key) => {
      result.push(value);
    });
    expect(result).toEqual([1, 2, 3]);
  });
});
