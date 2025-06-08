/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockServer, MockServer, waitSecond } from '@nocobase/test';
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

  it('should return datasource status when datasource is loading or reloading', async () => {
    class MockDataSource extends DataSource {
      static testConnection(options?: any): Promise<boolean> {
        return Promise.resolve(true);
      }

      async load(): Promise<void> {
        await waitSecond(1000);
      }

      createCollectionManager(options?: any): any {
        return undefined;
      }
    }

    app.dataSourceManager.factory.register('mock', MockDataSource);

    app.dataSourceManager.beforeAddDataSource(async (dataSource: DataSource) => {
      const total = 1000;
      for (let i = 0; i < total; i++) {
        dataSource.emitLoadingProgress({
          total,
          loaded: i,
        });
      }
    });

    await app.db.getRepository('dataSources').create({
      values: {
        key: 'mockInstance1',
        type: 'mock',
        displayName: 'Mock',
        options: {},
      },
    });

    await waitSecond(200);

    // get data source status
    const plugin: any = app.pm.get('data-source-manager');
    expect(plugin.dataSourceStatus['mockInstance1']).toBe('loading');

    const loadingStatus = plugin.dataSourceLoadingProgress['mockInstance1'];
    expect(loadingStatus).toBeDefined();
  });

  it('should get error when datasource loading failed', async () => {
    class MockDataSource extends DataSource {
      static testConnection(options?: any): Promise<boolean> {
        return Promise.resolve(true);
      }

      async load(): Promise<void> {
        throw new Error(`load failed`);
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

    await waitSecond(2000);
    // get data source status
    const plugin: any = app.pm.get('data-source-manager');
    expect(plugin.dataSourceStatus['mockInstance1']).toBe('loading-failed');

    expect(plugin.dataSourceErrors['mockInstance1'].message).toBe('load failed');
  });

  it('should list main datasource in api', async () => {
    const listResp = await app.agent().resource('dataSources').list();
    expect(listResp.status).toBe(200);

    const body = listResp.body;
    expect(body.meta.count).toBe(1);
  });

  it('should refresh status', async () => {
    class MockDataSource extends DataSource {
      static testConnection(options?: any): Promise<boolean> {
        return Promise.resolve(true);
      }

      async load(): Promise<void> {
        await waitSecond(1000);
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

    const plugin: any = app.pm.get('data-source-manager');

    await waitSecond(2000);

    expect(plugin.dataSourceStatus['mockInstance1']).toBe('loaded');

    // current status is loaded
    // request refresh, should change to loading
    const refreshResp = await app.agent().resource('dataSources').refresh({
      filterByTk: 'mockInstance1',
    });

    expect(refreshResp.status).toBe(200);
    expect(refreshResp.body.data.status).toBe('reloading');

    await waitSecond(2000);

    // get refresh loaded status
    const refreshResp1 = await app.agent().resource('dataSources').refresh({
      filterByTk: 'mockInstance1',
      clientStatus: 'reloading',
    });

    expect(refreshResp1.status).toBe(200);
    expect(refreshResp1.body.data.status).toBe('loaded');
  });

  it('should load datasource async', async () => {
    class MockCollectionManager extends CollectionManager {}

    class MockDataSource extends DataSource {
      static testConnection(options?: any): Promise<boolean> {
        return Promise.resolve(true);
      }

      async load(): Promise<void> {
        await waitSecond(1000);
      }

      createCollectionManager(options?: any): any {
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

    const listResp = await app
      .agent()
      .resource('dataSources')
      .list({
        filter: {
          'type.$ne': 'main',
        },
      });

    const item1 = listResp.body.data[0];

    expect(item1.status).toBe('loading');
    await waitSecond(2000);

    const listResp2 = await app.agent().resource('dataSources').list();
    expect(listResp2.body.data[0].status).toBe('loaded');

    // get data source
    const getResp = await app
      .agent()
      .resource('dataSources')
      .get({
        filterByTk: 'mockInstance1',
        appends: ['collections'],
      });

    expect(getResp.status).toBe(200);
    expect(getResp.body.data.status).toBe('loaded');
  });

  it('should not load connection after change enabled status', async () => {
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

    await app
      .agent()
      .resource('dataSources')
      .create({
        values: {
          options: {},
          type: 'mock',
          key: 'mockInstance1',
          enabled: true,
        },
      });

    testConnectionFn.mockClear();

    const findDataSourceInstance = async () => {
      return await app.db.getRepository('dataSources').findOne({
        filterByTk: 'mockInstance1',
      });
    };

    expect((await findDataSourceInstance()).get('enabled')).toBeTruthy();

    await app
      .agent()
      .resource('dataSources')
      .update({
        filterByTk: 'mockInstance1',
        values: {
          enabled: false,
        },
      });

    expect(testConnectionFn).toBeCalledTimes(0);
    expect((await findDataSourceInstance()).get('enabled')).toBeFalsy();
  });

  it('should call test connection after options change', async () => {
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
      .create({
        values: {
          options: {
            ...testArgs,
          },
          type: 'mock',
          key: 'mockInstance1',
        },
      });

    testConnectionFn.mockClear();

    await app
      .agent()
      .resource('dataSources')
      .update({
        filterByTk: 'mockInstance1',
        values: {
          options: {
            otherOptions: 'test',
          },
        },
      });

    await waitSecond(1000);
    expect(testConnectionFn).toBeCalledTimes(1);
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
    await waitSecond(1000);

    expect(loadFn).toBeCalledTimes(1);

    const mockDataSource = app.dataSourceManager.dataSources.get('mockInstance1');
    expect(mockDataSource).toBeInstanceOf(MockDataSource);
  });

  it('should destroy data source', async () => {
    class MockCollectionManager extends CollectionManager {}

    class MockDataSource extends DataSource {
      static testConnection(options?: any): Promise<boolean> {
        return Promise.resolve(true);
      }

      async load(): Promise<void> {
        await waitSecond(1000);
      }

      createCollectionManager(options?: any): any {
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

    await waitSecond(2000);

    expect(app.dataSourceManager.dataSources.get('mockInstance1')).toBeDefined();

    await app.agent().resource('dataSources').destroy({
      filterByTk: 'mockInstance1',
    });

    expect(app.dataSourceManager.dataSources.get('mockInstance1')).not.toBeDefined();
  });

  class MockCollectionManager extends CollectionManager {}

  describe('data source collections', () => {
    beforeEach(async () => {
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
          options: {
            password: '123456',
          },
        },
      });

      await waitSecond(2000);

      const dataSource = app.dataSourceManager.dataSources.get('mockInstance1');
      expect(dataSource).toBeDefined();
    });

    it('should get data source collections', async () => {
      const listResp = await app.agent().resource('dataSources').list({
        appends: 'collections',
      });

      expect(listResp.status).toBe(200);

      const listEnabledResp = await app.agent().resource('dataSources').listEnabled({});
      expect(listEnabledResp.status).toBe(200);
      const data = listEnabledResp.body.data;
      const item = data[0];
      expect(item.collections).toBeDefined();
    });

    it('should get data source with collections when data source load failed', async () => {
      class MockDataSource2 extends DataSource {
        async load(): Promise<void> {
          throw new Error('load failed');
        }

        createCollectionManager(options?: any) {
          return new MockCollectionManager();
        }
      }

      app.dataSourceManager.factory.register('mock2', MockDataSource2);

      await app.db.getRepository('dataSources').create({
        values: {
          key: 'mockInstance2',
          type: 'mock2',
          displayName: 'Mock 2',
          options: {
            password: '123456',
          },
        },
      });

      await waitSecond(1000);

      const listResp = await app.agent().resource('dataSources').listEnabled({
        appends: 'collections',
      });

      expect(listResp.status).toBe(200);

      console.log(listResp.body.data);
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

    it('should update fields through collection', async () => {
      const dataSource = app.dataSourceManager.dataSources.get('mockInstance1');
      const collection = dataSource.collectionManager.getCollection('posts');

      const updateResp = await app
        .agent()
        .resource('dataSources.collections', 'mockInstance1')
        .update({
          filterByTk: 'posts',
          values: {
            fields: [
              {
                type: 'string',
                name: 'title',
                uiSchema: {
                  test: 'value',
                },
              },
              {
                type: 'text',
                name: 'content',
              },
            ],
          },
        });

      expect(updateResp.status).toBe(200);

      const fieldsOptions = [...collection.fields.values()].map((f) => f.options);
      // remove a field
      const newFieldsOptions = fieldsOptions.filter((f) => f.name === 'title');

      const updateResp2 = await app
        .agent()
        .resource('dataSources.collections', 'mockInstance1')
        .update({
          filterByTk: 'posts',
          values: {
            fields: newFieldsOptions,
          },
        });

      expect(updateResp2.status).toBe(200);
      expect(collection.getField('comments')).toBeFalsy();
    });

    it('should update collection with field', async () => {
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
            sourceKey: 'id',
            targetKey: 'id',
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

      // reload data source manager
      const refreshResp = await app.agent().resource('dataSources').refresh({
        filterByTk: 'mockInstance1',
      });

      expect(refreshResp.status).toBe(200);
      expect(refreshResp.body.data.status).toBe('reloading');

      await waitSecond(2000);

      const dataSource2 = app.dataSourceManager.dataSources.get('mockInstance1');
      const collection2 = dataSource2.collectionManager.getCollection('comments');
      expect(collection2.getField('post')).toBeFalsy();
    });

    it(`should not return possibleTypes field when creating field`, async () => {
      const createResp = await app
        .agent()
        .resource('dataSourcesCollections.fields', 'mockInstance1.comments')
        .create({
          values: {
            type: 'string',
            name: 'title',
            possibleTypes: ['123', '456'],
          },
        });

      expect(createResp.status).toBe(200);
      const data = createResp.body.data;
      expect(data.possibleTypes).not.exist;

      const fieldModel = await app.db.getRepository('dataSourcesFields').findOne({
        filter: {
          dataSourceKey: 'mockInstance1',
        },
      });
      expect(fieldModel.get('options').possibleTypes).not.exist;
    });

    it(`should not return possibleTypes field when update field`, async () => {
      const fieldUpdateResp = await app
        .agent()
        .resource('dataSourcesCollections.fields', 'mockInstance1.posts')
        .update({
          filterByTk: 'title',
          values: {
            title: '标题 Field',
            possibleTypes: ['123', '456'],
          },
        });

      expect(fieldUpdateResp.status).toBe(200);
      const data = fieldUpdateResp.body.data;
      expect(data.possibleTypes).not.exist;
    });
  });
});
