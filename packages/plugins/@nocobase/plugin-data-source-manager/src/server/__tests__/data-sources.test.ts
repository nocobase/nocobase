import { createMockServer, MockServer } from '@nocobase/test';
import { CollectionManager, DataSource } from '@nocobase/data-source-manager';

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

  describe('data source collections', () => {
    beforeEach(async () => {
      class MockCollectionManager extends CollectionManager {}
      class MockDataSource extends DataSource {
        async load(): Promise<void> {
          this.collectionManager.defineCollection({
            name: 'posts',
            fields: [
              {
                type: 'string',
                name: 'title',
              },
              {
                type: 'hasMany',
                name: 'comments',
              },
            ],
          });

          this.collectionManager.defineCollection({
            name: 'comments',
            fields: [
              {
                type: 'string',
                name: 'content',
              },
              {
                type: 'belongsTo',
                name: 'post',
              },
            ],
          });
        }

        createCollectionManager(options?: any) {
          return new MockCollectionManager();
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
    });

    it('should get collections from datasource', async () => {
      const listResp = await app.agent().resource('dataSources').list();
      expect(listResp.status).toBe(200);

      // get collections
      const collectionsResp = await app.agent().resource('dataSources.collections', 'mockInstance1').list();
      expect(collectionsResp.status).toBe(200);
      const data = collectionsResp.body.data;

      expect(data.length).toBe(2);
    });

    it('should edit datasource collections', async () => {
      // edit collections
      const editResp = await app
        .agent()
        .resource('dataSources.collections', 'mockInstance1.posts')
        .update({
          values: {
            title: '标题 Collection',
          },
        });

      expect(editResp.status).toBe(200);

      const dataSource = app.dataSourceManager.dataSources.get('mockInstance1');
      const collection = dataSource.collectionManager.getCollection('posts');
      expect(collection.options.title).toBe('标题 Collection');
    });
  });
});
