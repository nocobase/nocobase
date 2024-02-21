import { Application, DataSourceOptions, DataSource } from '@nocobase/client';

describe('DataSource', () => {
  let dataSource: DataSource;
  let app: Application;
  const collections = [{ name: 'a' }];
  const newDisplayName = 'new display name';
  const dataSourceOptions: DataSourceOptions = {
    key: 'test',
    displayName: 'Test Data Source',
    status: 'loading',
  };

  beforeEach(() => {
    app = new Application({});
    class TestDataSource extends DataSource {
      async getDataSource() {
        return {
          displayName: newDisplayName,
          collections: collections,
        };
      }
    }
    app.dataSourceManager.addDataSource(TestDataSource, dataSourceOptions);
    dataSource = app.dataSourceManager.getDataSource('test');
  });

  it('initializes with the correct options', () => {
    expect(dataSource.getOptions()).toEqual(dataSourceOptions);
    expect(dataSource.app).toBe(app);
    expect(dataSource.key).toBe(dataSourceOptions.key);
    expect(dataSource.displayName).toBe(dataSourceOptions.displayName);
    expect(dataSource.key).toBe(dataSourceOptions.key);
    expect(dataSource.status).toBe(dataSourceOptions.status);
    expect(dataSource.errorMessage).toBe(dataSourceOptions.errorMessage);
    expect(dataSource.collections).toEqual([]);
  });

  it('getOption() returns the correct value', () => {
    expect(dataSource.getOption('displayName')).toBe(dataSourceOptions.displayName);
  });

  it('sets new options correctly', () => {
    dataSource.setOptions({ displayName: 'New Display Name' });
    expect(dataSource.displayName).toBe('New Display Name');
  });

  it('can add and call reload callbacks', async () => {
    const callback = vitest.fn();
    dataSource.addReloadCallback(callback);
    await dataSource.reload();
    expect(callback).toHaveBeenCalled();
  });

  it('does not add the same reload callback twice', () => {
    const callback = vitest.fn();
    dataSource.addReloadCallback(callback);
    dataSource.addReloadCallback(callback);
    expect(dataSource['reloadCallbacks'].length).toBe(1);
  });

  it('can remove reload callbacks', () => {
    const callback = vitest.fn();
    dataSource.addReloadCallback(callback);
    dataSource.removeReloadCallback(callback);
    expect(dataSource['reloadCallbacks'].length).toBe(0);
  });

  it('updates collections and calls callbacks on reload', async () => {
    const callback = vitest.fn();
    dataSource.addReloadCallback(callback);
    await dataSource.reload();
    expect(dataSource.collections.length).toBe(collections.length);
    expect(dataSource.displayName).toBe(newDisplayName);
    expect(callback).toHaveBeenCalledWith(collections);
    expect(dataSource.collectionManager.getCollection('a')).toBeTruthy();
  });
});
