import { splitDataSource } from '../utils/splitDataSource';

describe('splitDataSource', () => {
  it('should split the data source into left and right data sources based on the target keys', () => {
    const dataSource = [
      { key: '1', name: 'John' },
      { key: '2', name: 'Doe' },
      { key: '3', name: 'Jane' },
    ];
    const targetKeys = ['1', '3'];
    const { leftDataSource, rightDataSource } = splitDataSource({ dataSource, targetKeys });
    expect(leftDataSource).toEqual([{ key: '2', name: 'Doe' }]);
    expect(rightDataSource).toEqual([
      { key: '1', name: 'John' },
      { key: '3', name: 'Jane' },
    ]);
  });
});
