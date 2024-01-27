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

  it('should test datasource connection', async () => {
    const testConnectionFn = vi.fn();

    class MockDataSource extends DataSource {
      static testConnection(options?: any): Promise<boolean> {
        testConnectionFn();
        return Promise.resolve(true);
      }
      async load(): Promise<void> {}

      createCollectionManager(options?: any): any {
        return undefined;
      }
    }

    app.dataSourceManager.factory.register('mock', MockDataSource);

    const testArgs = {
      test: '123',
    };

    await app
      .agent()
      .resource('dataSources')
      .testConnection({
        values: {
          options: testArgs,
          type: 'mock',
        },
      });

    expect(testConnectionFn).toBeCalledTimes(1);
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
        .resource('dataSources.collections', 'mockInstance1')
        .update({
          filterByTk: 'posts',
          values: {
            title: '标题 Collection',
          },
        });

      expect(editResp.status).toBe(200);

      const dataSource = app.dataSourceManager.dataSources.get('mockInstance1');
      const collection = dataSource.collectionManager.getCollection('posts');
      expect(collection.options.title).toBe('标题 Collection');
    });

    it('should get collection fields', async () => {
      const fieldListResp = await app.agent().resource('dataSourcesCollections.fields', 'mockInstance1.posts').list();
      expect(fieldListResp.status).toBe(200);

      expect(fieldListResp.body.data.length).toBe(2);

      // detail
      const fieldDetailResp = await app.agent().resource('dataSourcesCollections.fields', 'mockInstance1.posts').get({
        filterByTk: 'title',
      });
      expect(fieldDetailResp.status).toBe(200);
    });

    it('should update collection field', async () => {
      const fieldUpdateResp = await app
        .agent()
        .resource('dataSourcesCollections.fields', 'mockInstance1.posts')
        .update({
          filterByTk: 'title',
          values: {
            title: '标题 Field',
          },
        });

      expect(fieldUpdateResp.status).toBe(200);

      const dataSource = app.dataSourceManager.dataSources.get('mockInstance1');
      const collection = dataSource.collectionManager.getCollection('posts');
      const field = collection.getField('title');
      expect(field.options.title).toBe('标题 Field');
    });

    it('should create collection field', async () => {
      const dataSource = app.dataSourceManager.dataSources.get('mockInstance1');
      const collection = dataSource.collectionManager.getCollection('comments');

      expect(collection.getField('post')).toBeFalsy();

      const createResp = await app
        .agent()
        .resource('dataSourcesCollections.fields', 'mockInstance1.comments')
        .create({
          values: {
            type: 'belongsTo',
            name: 'post',
            target: 'posts',
            foreignKey: 'post_id',
          },
        });

      expect(createResp.status).toBe(200);

      expect(collection.getField('post')).toBeTruthy();

      // destroy field
      const destroyResp = await app
        .agent()
        .resource('dataSourcesCollections.fields', 'mockInstance1.comments')
        .destroy({
          filterByTk: 'post',
        });

      expect(destroyResp.status).toBe(200);
      expect(collection.getField('post')).toBeFalsy();
    });
  });
});
