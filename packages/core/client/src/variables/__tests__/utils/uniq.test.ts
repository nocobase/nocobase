import { uniq } from '../../utils/uniq';

describe('uniq', () => {
  test('uniq method with non-array value', () => {
    const value = 'Hello';
    const result = uniq(value);
    expect(result).toBe(value);
  });

  test('uniq method with array elements as strings', () => {
    const value = ['apple', 'banana', 'apple', 'orange'];
    const result = uniq(value);
    expect(result).toEqual(['apple', 'banana', 'apple', 'orange']);
  });

  test('uniq method with array elements as objects with an id property', () => {
    const value = [
      { id: 1, name: 'John' },
      { id: 2, name: 'Jane' },
      { id: 1, name: 'John Doe' },
    ];
    const result = uniq(value);
    expect(result).toEqual([
      { id: 1, name: 'John' },
      { id: 2, name: 'Jane' },
    ]);
  });

  test('uniq method with array elements as objects without an id property', () => {
    const value = [
      { id: 1, name: 'John' },
      { id: 1, name: 'John' },
      { id: 2, name: 'John Doe' },
    ];
    const result = uniq(value);
    expect(result).toEqual([
      { id: 1, name: 'John' },
      { id: 2, name: 'John Doe' },
    ]);
  });
});
