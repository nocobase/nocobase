import { Cache } from '@nocobase/cache';
import { Database } from '@nocobase/database';
import { createMockServer, MockServer } from '@nocobase/test';
import UiSchemaRepository, { GetJsonSchemaOptions, GetPropertiesOptions } from '../repository';

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
    app = await createMockServer({
      registerActions: true,
      plugins: ['ui-schema-storage'],
    });

    db = app.db;
    repository = db.getCollection('uiSchemas').repository as UiSchemaRepository;
    cache = app.cache;
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
          properties: {
            c1: {
              'x-uid': 'c1Uid',
              type: 'string',
              title: 'C1',
            },
            c2: {
              'x-uid': 'c2Uid',
              type: 'string',
              title: 'C2',
            },
          },
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

  it('should not cache when getJsonSchema with readFromCache false', async () => {
    const xUid = schema['x-uid'];
    // xUid not in cache
    expect(await cache.get(xUid)).toBeUndefined();
    await repository.insert(schema);
    const result = await repository.getJsonSchema(xUid, { readFromCache: false } as GetJsonSchemaOptions);
    expect(result).toBeDefined();
    // xUid's schema is not cached
    expect(await cache.get(`s_${xUid}`)).toBeUndefined();
  });

  it('should cache when getProperties with readFromCache', async () => {
    const xUid = schema['x-uid'];
    // xUid not in cache
    expect(await cache.get(xUid)).toBeUndefined();
    await repository.insert(schema);
    const result = await repository.getProperties(xUid, { readFromCache: true } as GetPropertiesOptions);

    // xUid's properties is cached
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

  it('should not cache when getProperties with readFromCache false', async () => {
    const xUid = schema['x-uid'];
    // xUid not in cache
    expect(await cache.get(xUid)).toBeUndefined();
    await repository.insert(schema);
    const result = await repository.getProperties(xUid, { readFromCache: false } as GetPropertiesOptions);

    expect(result).toBeDefined();
    // xUid's properties is not cached
    expect(await cache.get(`p_${xUid}`)).toBeUndefined();
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

  it('should clear cache when remove children schema', async () => {
    const xUid = schema['x-uid'];
    // xUid not in cache
    expect(await cache.get(xUid)).toBeUndefined();

    await repository.insert(schema);

    let sResult = await repository.getJsonSchema(xUid, { readFromCache: true } as GetJsonSchemaOptions);
    expect(await cache.get(`s_${xUid}`)).toMatchObject(sResult);
    expect(sResult.properties.a1.properties.c1).toBeDefined();

    let pResult = (await repository.getProperties(xUid, { readFromCache: true } as GetPropertiesOptions)) as any;
    expect(await cache.get(`p_${xUid}`)).toMatchObject(pResult);
    expect(pResult.properties.a1.properties.c1).toBeDefined();

    await repository.remove(schema.properties.a1.properties.c1['x-uid']);

    expect(await cache.get(`s_${xUid}`)).toBeUndefined();
    expect(await cache.get(`p_${xUid}`)).toBeUndefined();

    sResult = await repository.getJsonSchema(xUid, { readFromCache: true } as GetJsonSchemaOptions);
    expect(await cache.get(`s_${xUid}`)).toMatchObject(sResult);
    expect(sResult.properties.a1.properties.c1).toBeUndefined();

    pResult = (await repository.getProperties(xUid, { readFromCache: true } as GetPropertiesOptions)) as any;
    expect(await cache.get(`p_${xUid}`)).toMatchObject(pResult);
    expect(pResult.properties.a1.properties.c1).toBeUndefined();
  });

  it('should clear cache when patch', async () => {
    const xUid = schema['x-uid'];
    // xUid not in cache
    expect(await cache.get(`s_${xUid}`)).toBeUndefined();
    expect(await cache.get(`p_${xUid}`)).toBeUndefined();

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
    };
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

  it('should clear cache when patch children schema', async () => {
    const xUid = schema['x-uid'];
    // xUid not in cache
    expect(await cache.get(`s_${xUid}`)).toBeUndefined();
    expect(await cache.get(`p_${xUid}`)).toBeUndefined();

    await repository.insert(schema);

    let sResult = await repository.getJsonSchema(xUid, { readFromCache: true } as GetJsonSchemaOptions);
    expect(await cache.get(`s_${xUid}`)).toMatchObject(sResult);

    let pResult = (await repository.getProperties(xUid, { readFromCache: true } as GetPropertiesOptions)) as any;
    expect(await cache.get(`p_${xUid}`)).toMatchObject(pResult);

    expect(sResult.properties.a1.properties.c1.title).toEqual(schema.properties.a1.properties.c1.title);
    expect(pResult.properties.a1.properties.c1.title).toEqual(schema.properties.a1.properties.c1.title);

    const newSchema = {
      'x-uid': 'c1Uid',
      type: 'string',
      title: 'C1-test',
    };
    await repository.patch(newSchema);

    expect(await cache.get(`s_${xUid}`)).toBeUndefined();
    expect(await cache.get(`p_${xUid}`)).toBeUndefined();

    // patched result
    sResult = await repository.getJsonSchema(xUid, { readFromCache: true } as GetJsonSchemaOptions);
    expect(await cache.get(`s_${xUid}`)).toMatchObject(sResult);

    pResult = (await repository.getProperties(xUid, { readFromCache: true } as GetPropertiesOptions)) as any;
    expect(await cache.get(`p_${xUid}`)).toMatchObject(pResult);

    expect(sResult.properties.a1.properties.c1.title).toEqual(newSchema.title);
    expect(pResult.properties.a1.properties.c1.title).toEqual(newSchema.title);
  });

  it('should clear cache when clearAncestor', async () => {
    const xUid = schema['x-uid'];
    // xUid not in cache
    expect(await cache.get(`s_${xUid}`)).toBeUndefined();
    expect(await cache.get(`p_${xUid}`)).toBeUndefined();

    await repository.insert(schema);

    const sResult = await repository.getJsonSchema(xUid, { readFromCache: true } as GetJsonSchemaOptions);
    expect(await cache.get(`s_${xUid}`)).toMatchObject(sResult);

    const pResult = (await repository.getProperties(xUid, { readFromCache: true } as GetPropertiesOptions)) as any;
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
    expect(await cache.get(`s_${xUid}`)).toBeUndefined();
    expect(await cache.get(`p_${xUid}`)).toBeUndefined();

    await repository.insert(schema);

    let sResult = await repository.getJsonSchema(xUid, { readFromCache: true } as GetJsonSchemaOptions);
    expect(await cache.get(`s_${xUid}`)).toMatchObject(sResult);

    let pResult = (await repository.getProperties(xUid, { readFromCache: true } as GetPropertiesOptions)) as any;
    expect(await cache.get(`p_${xUid}`)).toMatchObject(pResult);

    expect(sResult.title).toEqual(schema.title);
    expect(pResult.properties.a1.title).toEqual(schema.properties.a1.title);
    await repository.insertAdjacent('beforeBegin', sResult.properties.a1['x-uid'], {
      name: 'a0',
      type: 'string',
      title: 'a0 title',
      'x-component': 'Input',
    });

    expect(await cache.get(`s_${xUid}`)).toBeUndefined();
    expect(await cache.get(`p_${xUid}`)).toBeUndefined();

    sResult = await repository.getJsonSchema(xUid, { readFromCache: true } as GetJsonSchemaOptions);
    expect(await cache.get(`s_${xUid}`)).toMatchObject(sResult);

    pResult = (await repository.getProperties(xUid, { readFromCache: true } as GetPropertiesOptions)) as any;
    expect(await cache.get(`p_${xUid}`)).toMatchObject(pResult);

    expect(sResult.properties?.a0).toBeDefined();
    expect(pResult.properties?.a0).toBeDefined();
  });

  it('should clear cache when insertAdjacent children schema', async () => {
    const xUid = schema['x-uid'];
    // xUid not in cache
    expect(await cache.get(`s_${xUid}`)).toBeUndefined();
    expect(await cache.get(`p_${xUid}`)).toBeUndefined();

    await repository.insert(schema);

    let sResult = await repository.getJsonSchema(xUid, { readFromCache: true } as GetJsonSchemaOptions);
    expect(await cache.get(`s_${xUid}`)).toMatchObject(sResult);

    let pResult = (await repository.getProperties(xUid, { readFromCache: true } as GetPropertiesOptions)) as any;
    expect(await cache.get(`p_${xUid}`)).toMatchObject(pResult);

    expect(sResult.title).toEqual(schema.title);
    expect(pResult.properties.a1.title).toEqual(schema.properties.a1.title);
    const c0Schema = {
      name: 'c0',
      type: 'string',
      title: 'c0 title',
      'x-component': 'Input',
    };
    await repository.insertAdjacent('afterBegin', sResult.properties.a1['x-uid'], c0Schema);

    expect(await cache.get(`s_${xUid}`)).toBeUndefined();
    expect(await cache.get(`p_${xUid}`)).toBeUndefined();

    sResult = await repository.getJsonSchema(xUid, { readFromCache: true } as GetJsonSchemaOptions);
    expect(await cache.get(`s_${xUid}`)).toMatchObject(sResult);

    pResult = (await repository.getProperties(xUid, { readFromCache: true } as GetPropertiesOptions)) as any;
    expect(await cache.get(`p_${xUid}`)).toMatchObject(pResult);

    expect(sResult.properties.a1.properties.c0.title).toEqual(c0Schema.title);
    expect(pResult.properties.a1.properties.c0.title).toEqual(c0Schema.title);
  });

  it('should clear cache when move children schema 1', async () => {
    const schema = {
      name: 'A',
      'x-uid': 'A',
      title: 'title A',
      properties: {
        B: {
          name: 'B',
          'x-uid': 'B',
          title: 'title B',
          properties: {
            C: {
              name: 'C',
              'x-uid': 'C',
              title: 'title C',
            },
          },
        },
        D: {
          name: 'D',
          'x-uid': 'D',
          title: 'title D',
        },
      },
    };
    const xUid = 'A';
    // xUid not in cache
    expect(await cache.get(`s_${xUid}`)).toBeUndefined();
    expect(await cache.get(`p_${xUid}`)).toBeUndefined();

    await repository.insert(schema);

    let sResult = await repository.getJsonSchema(xUid, { readFromCache: true } as GetJsonSchemaOptions);
    expect(await cache.get(`s_${xUid}`)).toMatchObject(sResult);

    let pResult = (await repository.getProperties(xUid, { readFromCache: true } as GetPropertiesOptions)) as any;
    expect(await cache.get(`p_${xUid}`)).toMatchObject(pResult);

    expect(sResult.properties.B.properties.C).toBeDefined();
    expect(sResult.properties.D).toBeDefined();
    expect(pResult.properties.B.properties.C).toBeDefined();
    expect(pResult.properties.D).toBeDefined();

    await repository.insertAdjacent('afterBegin', schema.properties.D['x-uid'], schema.properties.B.properties.C);

    expect(await cache.get(`s_${xUid}`)).toBeUndefined();
    expect(await cache.get(`p_${xUid}`)).toBeUndefined();

    sResult = await repository.getJsonSchema(xUid, { readFromCache: true } as GetJsonSchemaOptions);
    expect(await cache.get(`s_${xUid}`)).toMatchObject(sResult);

    pResult = (await repository.getProperties(xUid, { readFromCache: true } as GetPropertiesOptions)) as any;
    expect(await cache.get(`p_${xUid}`)).toMatchObject(pResult);

    expect(sResult.properties.B.properties?.C).toBeUndefined();
    expect(sResult.properties.D.properties?.C).toBeDefined();
    expect(sResult.properties.D.properties?.C?.title).toEqual(schema.properties.B.properties.C.title);

    expect(pResult.properties.B.properties?.C).toBeUndefined();
    expect(pResult.properties.D.properties?.C).toBeDefined();
  });

  it('should clear cache when move children schema 2', async () => {
    const schema1 = {
      name: 'A',
      'x-uid': 'A',
      title: 'title A',
      properties: {
        B: {
          name: 'B',
          'x-uid': 'B',
          title: 'title B',
          properties: {
            C: {
              name: 'C',
              'x-uid': 'C',
              title: 'title C',
            },
          },
        },
      },
    };
    const schema2 = {
      name: 'D',
      'x-uid': 'D',
      title: 'title D',
      properties: {
        E: {
          name: 'E',
          'x-uid': 'E',
          title: 'title E',
        },
      },
    };
    const xUid_A = 'A';
    const xUid_D = 'D';
    // xUid not in cache
    expect(await cache.get(`s_${xUid_A}`)).toBeUndefined();
    expect(await cache.get(`p_${xUid_A}`)).toBeUndefined();
    expect(await cache.get(`s_${xUid_D}`)).toBeUndefined();
    expect(await cache.get(`p_${xUid_D}`)).toBeUndefined();

    await repository.insert(schema1);
    await repository.insert(schema2);

    let sResult1 = await repository.getJsonSchema(xUid_A, { readFromCache: true } as GetJsonSchemaOptions);
    expect(await cache.get(`s_${xUid_A}`)).toMatchObject(sResult1);

    let pResult1 = (await repository.getProperties(xUid_A, { readFromCache: true } as GetPropertiesOptions)) as any;
    expect(await cache.get(`p_${xUid_A}`)).toMatchObject(pResult1);

    let sResult2 = await repository.getJsonSchema(xUid_D, { readFromCache: true } as GetJsonSchemaOptions);
    expect(await cache.get(`s_${xUid_D}`)).toMatchObject(sResult2);

    let pResult2 = (await repository.getProperties(xUid_D, { readFromCache: true } as GetPropertiesOptions)) as any;
    expect(await cache.get(`p_${xUid_D}`)).toMatchObject(pResult2);

    expect(sResult1.properties.B.properties.C).toBeDefined();
    expect(pResult1.properties.B.properties.C).toBeDefined();

    expect(sResult2.properties.E).toBeDefined();
    expect(sResult2.properties.E).toBeDefined();
    expect(sResult2.properties.E?.properties?.C).toBeUndefined();
    expect(pResult2.properties.E?.properties?.C).toBeUndefined();

    await repository.insertAdjacent('afterBegin', schema2.properties.E['x-uid'], schema1.properties.B.properties.C);

    expect(await cache.get(`s_${xUid_A}`)).toBeUndefined();
    expect(await cache.get(`p_${xUid_A}`)).toBeUndefined();
    expect(await cache.get(`s_${xUid_D}`)).toBeUndefined();
    expect(await cache.get(`p_${xUid_D}`)).toBeUndefined();

    sResult1 = await repository.getJsonSchema(xUid_A, { readFromCache: true } as GetJsonSchemaOptions);
    expect(await cache.get(`s_${xUid_A}`)).toMatchObject(sResult1);

    pResult1 = (await repository.getProperties(xUid_A, { readFromCache: true } as GetPropertiesOptions)) as any;
    expect(await cache.get(`p_${xUid_A}`)).toMatchObject(pResult1);

    sResult2 = await repository.getJsonSchema(xUid_D, { readFromCache: true } as GetJsonSchemaOptions);
    expect(await cache.get(`s_${xUid_D}`)).toMatchObject(sResult2);

    pResult2 = (await repository.getProperties(xUid_D, { readFromCache: true } as GetPropertiesOptions)) as any;
    expect(await cache.get(`p_${xUid_D}`)).toMatchObject(pResult2);

    expect(sResult1.properties.B?.properties?.C).toBeUndefined();
    expect(pResult1.properties.B?.properties?.C).toBeUndefined();

    expect(sResult2.properties.E.properties.C).toBeDefined();
    expect(pResult2.properties.E.properties.C).toBeDefined();
    expect(sResult2.properties.E.properties?.C?.title).toEqual(schema1.properties.B.properties.C.title);
  });
});
