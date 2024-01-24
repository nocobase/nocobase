import { createMockServer, MockServer } from '@nocobase/test';
import { DataSource } from '@nocobase/data-source-manager';

describe('data source', async () => {
  let app: MockServer;

  beforeEach(async () => {
    app = await createMockServer({
      plugins: ['nocobase', 'data-source-manager'],
    });
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should create data source', async () => {
    const loadFn = vi.fn();

    class MockDataSource extends DataSource {
      async load(): Promise<void> {
        loadFn();
      }

      createCollectionManager(options?: any): any {
        return undefined;
      }
    }

    app.dataSourceManager.factory.register('mock', MockDataSource);

    await app.db.getRepository('dataSources').create({
      values: {
        key: 'mockInstance1',
        type: 'mock',
        displayName: 'Mock',
        options: {},
      },
    });

    expect(loadFn).toBeCalledTimes(1);

    const mockDataSource = app.dataSourceManager.dataSources.get('mockInstance1');
    expect(mockDataSource).toBeInstanceOf(MockDataSource);
  });
});
