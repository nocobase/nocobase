import { isValidFilter } from '..';

describe('isValidFilter', () => {
  it('should return false', () => {
    expect(isValidFilter(undefined)).toBe(false);
    expect(isValidFilter({})).toBe(false);
    expect(isValidFilter({ $and: [] })).toBe(false);
    expect(isValidFilter({ $or: [] })).toBe(false);
    expect(isValidFilter({ $and: [{}] })).toBe(false);
    expect(isValidFilter({ $or: [{}] })).toBe(false);
    expect(isValidFilter({ $and: [{ $or: [] }] })).toBe(false);
    expect(isValidFilter({ $or: [{ $and: [] }] })).toBe(false);
    expect(isValidFilter({ $and: [{}], $or: [{ $and: [], $or: [] }] })).toBe(false);
  });

  it('should return true', () => {
    expect(isValidFilter({ $and: [{ name: { $eq: 'test' } }] })).toBe(true);
    expect(isValidFilter({ $or: [{ name: { $eq: 'test' } }] })).toBe(true);
    expect(isValidFilter({ $and: [{ $or: [{ name: { $eq: 'test' } }] }] })).toBe(true);
    expect(isValidFilter({ $or: [{ $and: [{ name: { $eq: 'test' } }] }] })).toBe(true);
    expect(isValidFilter({ $and: [], $or: [{ name: 'test' }] })).toBe(true);
  });
});
