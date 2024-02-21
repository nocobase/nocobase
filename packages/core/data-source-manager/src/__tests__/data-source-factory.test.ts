import { createMockServer } from '@nocobase/test';
import { DataSource } from '../data-source';
import { ICollectionManager } from '../types';

describe('data source factory', () => {
  it('should register data source type', async () => {
    class MockDataSource extends DataSource {
      createCollectionManager(options?: any): ICollectionManager {
        return undefined;
      }
    }

    const app = await createMockServer({
      acl: false,
      resourcer: {
        prefix: '/api/',
      },
      name: 'test-app-1',
    });

    app.dataSourceManager.factory.register('mock', MockDataSource);

    const ds = app.dataSourceManager.factory.create('mock');

    expect(ds).toBeInstanceOf(MockDataSource);
  });

  it('should throw error when data source type not found', async () => {
    const app = await createMockServer({
      acl: false,
      resourcer: {
        prefix: '/api/',
      },
      name: 'test-app-2',
    });

    expect(() => {
      app.dataSourceManager.factory.create('mock');
    }).toThrowError('Data source type "mock" not found');
  });
});
