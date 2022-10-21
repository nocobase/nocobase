import { Database } from '@nocobase/database';
import { Cache } from '@nocobase/cache';
import { mockServer, MockServer } from '@nocobase/test';
import UiSchemaRepository, { GetJsonSchemaOptions, GetPropertiesOptions } from '../repository';
import PluginUiSchema from '../server';

describe('ui_schema repository with cache', () => {
  let app: MockServer;
  let db: Database;
  let cache: Cache;
  let repository: UiSchemaRepository;
  let schema;

  afterEach(async () => {
    await app.destroy();
  });

  beforeEach(async () => {
    app = mockServer({
      registerActions: true,
    });

    db = app.db;
    cache = app.cache;

    await db.sequelize.getQueryInterface().dropAllTables();

    app.plugin(PluginUiSchema);

    await app.load();
    await db.sync({
      force: false,
      alter: {
        drop: false,
      },
    });
    repository = db.getCollection('uiSchemas').repository as UiSchemaRepository;
    repository.setCache(cache);

    schema = {
      type: 'object',
      title: 'title',
      name: 'root',
      'x-uid': 'rootUid',
      properties: {
        a1: {
          type: 'string',
          title: 'A1',
          'x-component': 'Input',
        },
        b1: {
          'x-async': true, // 添加了一个异步节点
          type: 'string',
          title: 'B1',
          properties: {
            c1: {
              type: 'string',
              title: 'C1',
            },
            d1: {
              'x-async': true,
              type: 'string',
              title: 'D1',
            },
          },
        },
      },
    };
  });

  it('repository init with cache', async () => {
    expect(repository.cache).toBeDefined();
  });

  it('should cache when getJsonSchema with readFromCache', async () => {
    const xUid = schema['x-uid'];
    // xUid not in cache
    expect(await cache.get(xUid)).toBeUndefined();
    await repository.insert(schema);
    const result = await repository.getJsonSchema(xUid, { readFromCache: true } as GetJsonSchemaOptions);

    // xUid's schema is cached
    expect(await cache.get(`s_${xUid}`)).toMatchObject(result);

    // delete from database
    await repository.destroy({
      filterByTk: xUid,
    });
    const databaseSchema = await repository.findById(xUid);
    expect(databaseSchema).toBeNull();

    // also getJsonSchema from cache
    const secondResult = await repository.getJsonSchema(xUid, { readFromCache: true } as GetJsonSchemaOptions);
    expect(secondResult).toMatchObject(result);
  });

  it('should cache when getProperties with readFromCache', async () => {
    const xUid = schema['x-uid'];
    // xUid not in cache
    expect(await cache.get(xUid)).toBeUndefined();
    await repository.insert(schema);
    const result = await repository.getProperties(xUid, { readFromCache: true } as GetPropertiesOptions);

    // xUid's schema is cached
    expect(await cache.get(`p_${xUid}`)).toMatchObject(result);

    // delete from database
    await repository.destroy({
      filterByTk: xUid,
    });
    const databaseSchema = await repository.findById(xUid);
    expect(databaseSchema).toBeNull();

    // also getProperties from cache
    const secondResult = await repository.getProperties(xUid, { readFromCache: true } as GetPropertiesOptions);
    expect(secondResult).toMatchObject(result);
  });

  it('should clear cache when remove', async () => {
    const xUid = schema['x-uid'];
    // xUid not in cache
    expect(await cache.get(xUid)).toBeUndefined();

    await repository.insert(schema);

    const sResult = await repository.getJsonSchema(xUid, { readFromCache: true } as GetJsonSchemaOptions);
    expect(await cache.get(`s_${xUid}`)).toMatchObject(sResult);

    const pResult = await repository.getProperties(xUid, { readFromCache: true } as GetPropertiesOptions);
    expect(await cache.get(`p_${xUid}`)).toMatchObject(pResult);

    await repository.remove(xUid);

    expect(await cache.get(`s_${xUid}`)).toBeUndefined();
    expect(await cache.get(`p_${xUid}`)).toBeUndefined();
  });

  it('should clear cache when patch', async () => {
    const xUid = schema['x-uid'];
    // xUid not in cache
    expect(await cache.get(xUid)).toBeUndefined();

    await repository.insert(schema);

    let sResult = await repository.getJsonSchema(xUid, { readFromCache: true } as GetJsonSchemaOptions);
    expect(await cache.get(`s_${xUid}`)).toMatchObject(sResult);

    let pResult = (await repository.getProperties(xUid, { readFromCache: true } as GetPropertiesOptions)) as any;
    expect(await cache.get(`p_${xUid}`)).toMatchObject(pResult);

    expect(sResult.title).toEqual(schema.title);
    expect(pResult.properties.a1.title).toEqual(schema.properties.a1.title);

    const newSchema = {
      'x-uid': xUid,
      title: 'test-title',
      properties: {
        a1: {
          type: 'string',
          title: 'new a1 title',
          'x-component': 'Input',
        },
      },
    }
    await repository.patch(newSchema);

    expect(await cache.get(`s_${xUid}`)).toBeUndefined();
    expect(await cache.get(`p_${xUid}`)).toBeUndefined();

    // patched result
    sResult = await repository.getJsonSchema(xUid, { readFromCache: true } as GetJsonSchemaOptions);
    expect(await cache.get(`s_${xUid}`)).toMatchObject(sResult);

    pResult = (await repository.getProperties(xUid, { readFromCache: true } as GetPropertiesOptions)) as any;
    expect(await cache.get(`p_${xUid}`)).toMatchObject(pResult);

    expect(sResult.title).toEqual(newSchema.title);
    expect(pResult.properties.a1.title).toEqual(newSchema.properties.a1.title);
  });

  it('should clear cache when clearAncestor', async () => {
    const xUid = schema['x-uid'];
    // xUid not in cache
    expect(await cache.get(xUid)).toBeUndefined();

    await repository.insert(schema);

    let sResult = await repository.getJsonSchema(xUid, { readFromCache: true } as GetJsonSchemaOptions);
    expect(await cache.get(`s_${xUid}`)).toMatchObject(sResult);

    let pResult = (await repository.getProperties(xUid, { readFromCache: true } as GetPropertiesOptions)) as any;
    expect(await cache.get(`p_${xUid}`)).toMatchObject(pResult);

    expect(sResult.title).toEqual(schema.title);
    expect(pResult.properties.a1.title).toEqual(schema.properties.a1.title);

    await repository.clearAncestor(sResult.properties.a1['x-uid']);

    expect(await cache.get(`s_${xUid}`)).toBeUndefined();
    expect(await cache.get(`p_${xUid}`)).toBeUndefined();
  });

  it('should clear cache when insertAdjacent', async () => {
    const xUid = schema['x-uid'];
    // xUid not in cache
    expect(await cache.get(xUid)).toBeUndefined();

    await repository.insert(schema);

    let sResult = await repository.getJsonSchema(xUid, { readFromCache: true } as GetJsonSchemaOptions);
    expect(await cache.get(`s_${xUid}`)).toMatchObject(sResult);

    let pResult = (await repository.getProperties(xUid, { readFromCache: true } as GetPropertiesOptions)) as any;
    expect(await cache.get(`p_${xUid}`)).toMatchObject(pResult);

    expect(sResult.title).toEqual(schema.title);
    expect(pResult.properties.a1.title).toEqual(schema.properties.a1.title);
    await repository.insertAdjacent('beforeBegin',sResult.properties.a1['x-uid'],{
      name: 'a0',
      type: 'string',
      title: 'a0 title',
      'x-component': 'Input',
    })

    expect(await cache.get(`s_${xUid}`)).toBeUndefined();
    expect(await cache.get(`p_${xUid}`)).toBeUndefined();

    sResult = await repository.getJsonSchema(xUid, { readFromCache: true } as GetJsonSchemaOptions);
    expect(await cache.get(`s_${xUid}`)).toMatchObject(sResult);

    pResult = (await repository.getProperties(xUid, { readFromCache: true } as GetPropertiesOptions)) as any;
    expect(await cache.get(`p_${xUid}`)).toMatchObject(pResult);

    expect(sResult.properties?.a0).toBeDefined()
    expect(pResult.properties?.a0).toBeDefined()
  });
});
