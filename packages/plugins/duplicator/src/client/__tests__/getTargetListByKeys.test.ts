import { getTargetListByKeys } from '../utils/getTargetListByKeys';

describe('getTargetListByKeys', () => {
  it('should return an empty array if the list is empty', () => {
    const result = getTargetListByKeys([], ['key1', 'key2']);
    expect(result).toEqual([]);
  });

  it('should return an empty array if no items in the list match the target keys', () => {
    const list = [
      { key: 'key1', value: 'value1' },
      { key: 'key2', value: 'value2' },
      { key: 'key3', value: 'value3' },
    ];
    const result = getTargetListByKeys(list, ['key4', 'key5']);
    expect(result).toEqual([]);
  });

  it('should return an array of items that match the target keys', () => {
    const list = [
      { key: 'key1', value: 'value1' },
      { key: 'key2', value: 'value2' },
      { key: 'key3', value: 'value3' },
    ];
    const result = getTargetListByKeys(list, ['key1', 'key3']);
    expect(result).toEqual([
      { key: 'key1', value: 'value1' },
      { key: 'key3', value: 'value3' },
    ]);
  });
});
