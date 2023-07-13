import { hasEmptyValue } from '../client';

describe('hasEmptyValue', () => {
  it('should return false when there is no empty value', () => {
    const obj = {
      a: 1,
      b: 'hello',
      c: [1, 2, 3],
      d: {
        e: 'world',
        f: [4, 5, 6],
        g: {
          h: 'foo',
          i: 'bar',
        },
      },
    };
    expect(hasEmptyValue(obj)).toBe(false);
  });

  it('should return true when there is an empty value in an object', () => {
    const obj = {
      a: 1,
      b: '',
      c: [1, 2, 3],
      d: {
        e: 'world',
        f: [4, 5, 6],
        g: {
          h: 'foo',
          i: null,
        },
      },
    };
    expect(hasEmptyValue(obj)).toBe(true);
  });

  it('should return true when there is an empty value in an array', () => {
    const arr = [1, '', 3, [4, 5, 6], { a: 'foo', b: null }];
    expect(hasEmptyValue(arr)).toBe(true);
  });

  it('should return true when there is an empty value in an array and an object', () => {
    const obj = {
      a: 1,
      b: '',
      c: [1, 2, 3],
      d: {
        e: 'world',
        f: [4, 5, 6],
        g: {
          h: 'foo',
          i: null,
        },
      },
      h: [1, '', 3, [4, 5, 6], { a: 'foo', b: null }],
    };
    expect(hasEmptyValue(obj)).toBe(true);
  });

  it('should return false when the input is an empty object', () => {
    expect(hasEmptyValue({})).toBe(true);
  });

  it('should return false when the input is an empty array', () => {
    expect(hasEmptyValue([])).toBe(true);
  });

  it('should return true when the input is an object with an empty value', () => {
    const obj = { $and: [{ f_rto697s6udb: { $dateOn: null } }] };
    expect(hasEmptyValue(obj)).toBe(true);
  });
});
