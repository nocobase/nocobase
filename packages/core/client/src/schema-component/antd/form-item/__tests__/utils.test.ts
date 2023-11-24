import { isFieldValueEmpty } from '../utils';

describe('isFieldValueEmpty', () => {
  it('should return true for empty array', () => {
    const value = [];
    const targetKey = 'name';
    const result = isFieldValueEmpty(value, targetKey);
    expect(result).toBe(true);
  });

  it('should return true for array with empty objects', () => {
    const value = [{ name: null }, { name: undefined }];
    const targetKey = 'name';
    const result = isFieldValueEmpty(value, targetKey);
    expect(result).toBe(true);
  });

  it('should return false for array with non-empty objects', () => {
    const value = [{ name: 'John' }, { name: 'Doe' }];
    const targetKey = 'name';
    const result = isFieldValueEmpty(value, targetKey);
    expect(result).toBe(false);
  });

  it('should return true for empty object', () => {
    const value = {};
    const targetKey = 'name';
    const result = isFieldValueEmpty(value, targetKey);
    expect(result).toBe(true);
  });

  it('should return true for object with null value', () => {
    const value = { name: null };
    const targetKey = 'name';
    const result = isFieldValueEmpty(value, targetKey);
    expect(result).toBe(true);
  });

  it('should return true for object with undefined value', () => {
    const value = { name: undefined };
    const targetKey = 'name';
    const result = isFieldValueEmpty(value, targetKey);
    expect(result).toBe(true);
  });

  it('should return false for object with non-empty value', () => {
    const value = { name: 'John' };
    const targetKey = 'name';
    const result = isFieldValueEmpty(value, targetKey);
    expect(result).toBe(false);
  });
});
