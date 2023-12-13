import { defaultFieldNames, getCurrentOptions } from '../utils';

const dataSource = [
  { value: '1', label: 'Option 1', children: [{ value: '1.1', label: 'Option 1.1' }] },
  { value: '2', label: 'Option 2', children: [{ value: '2.1', label: 'Option 2.1' }] },
  { value: '3', label: 'Option 3', children: [{ value: '3.1', label: 'Option 3.1' }] },
];

describe('getCurrentOptions', () => {
  it('returns an empty array when values is an empty array', () => {
    expect(getCurrentOptions([], dataSource, defaultFieldNames)).toEqual([]);
  });

  it('returns an array of options with labels when given an array of values', () => {
    expect(getCurrentOptions(['1', '2'], dataSource, defaultFieldNames)).toEqual([
      { value: '1', label: 'Option 1', children: [{ value: '1.1', label: 'Option 1.1' }] },
      { value: '2', label: 'Option 2', children: [{ value: '2.1', label: 'Option 2.1' }] },
    ]);
  });

  it('returns an array of options with custom labels when given an array of objects with custom value keys', () => {
    const fieldNames = {
      ...defaultFieldNames,
      value: 'id',
      label: 'name',
    };
    const customDataSource = [
      { id: '1', name: 'Option 1', children: [{ id: '1.1', name: 'Option 1.1' }] },
      { id: '2', name: 'Option 2', children: [{ id: '2.1', name: 'Option 2.1' }] },
      { id: '3', name: 'Option 3', children: [{ id: '3.1', name: 'Option 3.1' }] },
    ];
    expect(getCurrentOptions(['1', '2'], customDataSource, fieldNames)).toEqual([
      { id: '1', name: 'Option 1', children: [{ id: '1.1', name: 'Option 1.1' }] },
      { id: '2', name: 'Option 2', children: [{ id: '2.1', name: 'Option 2.1' }] },
    ]);
  });
});
