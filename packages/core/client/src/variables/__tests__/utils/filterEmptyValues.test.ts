import { filterEmptyValues } from '../../utils/filterEmptyValues';

describe('filterEmptyValues', () => {
  test('should remove empty values from an array', () => {
    const value = [null, 0, '', false, undefined, 42];
    const result = filterEmptyValues(value);
    expect(result).toEqual([0, false, 42]);
  });

  test('should return the value unchanged if it is not an array', () => {
    const value = 'hello world';
    const result = filterEmptyValues(value);
    expect(result).toEqual('hello world');
  });

  test('should remove empty values from an array containing various types', () => {
    const value = [1, 'apple', false, 0, 3.14, '', null, 'orange', undefined];
    const result = filterEmptyValues(value);
    expect(result).toEqual([1, 'apple', false, 0, 3.14, 'orange']);
  });
});
