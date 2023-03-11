import { parse, parseFilter } from '../parse';

describe('parse', () => {
  test('non-variable', () => {
    expect(parse('abc', {})).toBe('abc');
  });

  test('variable', () => {
    const ctx = { abc: '123' };
    expect(parse('{{abc}}', ctx)).toBe('123');
  });

  test('nested variable', () => {
    const ctx = { abc: { def: '456' } };
    expect(parse('{{abc.def}}', ctx)).toBe('456');
  });
});

describe('walkFilter', () => {
  test('$and', () => {
    const ctx = { abc: '123' };
    const filter = {
      $and: [{ a: { $eq: '{{abc}}' } }],
    };

    expect(parseFilter(filter, ctx)).toEqual({
      $and: [{ a: { $eq: '123' } }],
    });
  });

  test('$or', () => {
    const ctx = { abc: '123' };
    const filter = {
      $or: [{ a: { $eq: '{{abc}}' } }],
    };

    expect(parseFilter(filter, ctx)).toEqual({
      $or: [{ a: { $eq: '123' } }],
    });
  });

  test('$and and $or', () => {
    const ctx = { abc: '123' };
    const filter = {
      $and: [{ a: { $eq: '{{abc}}' } }],
      $or: [{ b: { $eq: '{{abc}}' } }],
    };

    expect(parseFilter(filter, ctx)).toEqual({
      $and: [{ a: { $eq: '123' } }],
      $or: [{ b: { $eq: '123' } }],
    });
  });

  test('nested $and', () => {
    const ctx = { abc: '123' };
    const filter = {
      $and: [{ a: { $eq: '{{abc}}' } }, { $and: [{ b: { $eq: '{{abc}}' } }] }],
    };

    expect(parseFilter(filter, ctx)).toEqual({
      $and: [{ a: { $eq: '123' } }, { $and: [{ b: { $eq: '123' } }] }],
    });
  });

  test('nested $or', () => {
    const ctx = { abc: '123' };
    const filter = {
      $or: [{ a: { $eq: '{{abc}}' } }, { $or: [{ b: { $eq: '{{abc}}' } }] }],
    };

    expect(parseFilter(filter, ctx)).toEqual({
      $or: [{ a: { $eq: '123' } }, { $or: [{ b: { $eq: '123' } }] }],
    });
  });
});
