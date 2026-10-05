import {
  databaseManagerToken,
  filterOperatorsForFieldType,
  type DatabaseManager,
  type RepositoryPolicy,
} from '@nocobase/db';
import {
  provisionTestDatabases,
  type ProvisionedTestDatabases,
  type TestDatabase,
} from '@nocobase/db-testing';
import { ServiceContainer } from '@nocobase/service-provider';
import { Hono } from 'hono';
import { z } from 'zod';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';

import {
  defineRepositoryApiRoutes,
  findApiDocumentSchemaProblems,
  findUndeclaredApiRoutes,
  generateApiDocument,
  type ApiDocument,
  type OpenAPIV3_1,
} from '../src/router/index.js';

type Schema = OpenAPIV3_1.SchemaObject & Record<string, unknown>;

const open: RepositoryPolicy = {
  read: true,
  create: true,
  update: true,
  delete: true,
};

function schemaOf(document: ApiDocument, name: string): Schema {
  const schema = document.components?.schemas?.[name];
  expect(schema, `components.schemas.${name}`).toBeDefined();
  return schema as Schema;
}

function requestSchema(
  document: ApiDocument,
  path: string,
): Schema & { properties: Record<string, Schema> } {
  const operation = document.paths![path]!.post!;
  const body = operation.requestBody as OpenAPIV3_1.RequestBodyObject;
  return body.content['application/json']!.schema as Schema & {
    properties: Record<string, Schema>;
  };
}

describe('data endpoints in the API document', () => {
  let testDatabases: ProvisionedTestDatabases | undefined;
  let testDatabase: TestDatabase | undefined;
  let database: DatabaseManager;
  let container: ServiceContainer;

  beforeAll(async () => {
    testDatabases = await provisionTestDatabases();
  });

  afterAll(async () => {
    await testDatabases?.drop();
  });

  beforeEach(async () => {
    testDatabase = await testDatabases!.open();
    database = testDatabase.database;
    container = new ServiceContainer();
    container.instance(databaseManagerToken, database);
    await database.builder().createCollection('customers', (collection) => {
      collection.string('id').primary().notNull();
      collection.string('name').notNull();
    });
    await database.builder().createCollection('orders', (collection) => {
      collection.string('id').primary().notNull();
      collection.string('title', { length: 120 }).notNull();
      collection.text('notes').nullable();
      collection
        .enum('status', { values: ['draft', 'paid'] })
        .notNull()
        .defaultTo('draft');
      collection.integer('quantity').nullable();
      collection.bigInt('amount').nullable();
      collection.decimal('price', { precision: 20, scale: 6 }).nullable();
      collection.boolean('urgent').nullable();
      collection.date('dueOn').nullable();
      collection.datetimeTz('placedAt').nullable();
      collection.json('metadata').nullable();
      collection.integer('version').notNull();
      collection.optimisticLock('version');
      collection.string('customerId').nullable();
      collection
        .belongsTo('customer', 'customers')
        .foreignKey('customerId')
        .targetKey('id')
        .foreignKeyType('string');
    });
  });

  afterEach(async () => {
    await testDatabase?.destroy();
    testDatabase = undefined;
  });

  async function documentFor(
    repositories: Parameters<
      typeof defineRepositoryApiRoutes
    >[0]['repositories'],
    principal?: () => unknown,
  ): Promise<ApiDocument> {
    const api = new Hono();
    api.route(
      '/',
      await defineRepositoryApiRoutes({
        repositories,
        ...(principal ? { principal } : {}),
      }).createRouter({ container }),
    );
    expect(findUndeclaredApiRoutes(api)).toEqual([]);
    const document = await generateApiDocument(api, {
      info: { title: 'Test', version: '1' },
    });
    expect(findApiDocumentSchemaProblems(document)).toEqual([]);
    return document;
  }

  it('expands data endpoints a runtime dispatcher forwards to, as it does those mounted on /api', async () => {
    const forwarded = await defineRepositoryApiRoutes({
      repositories: [
        {
          name: 'salesOrders',
          collection: 'orders',
          policy: open,
          actions: { findOne: {}, createOne: {} },
        },
      ],
    }).createRouter({ container });
    const document = await generateApiDocument(new Hono(), {
      info: { title: 'Test', version: '1' },
      forwarded: {
        routers: [
          { owner: 'dispatcher', prefix: '/api/dispatched', router: forwarded },
        ],
        undeclared: [],
      },
    });

    expect(findApiDocumentSchemaProblems(document)).toEqual([]);
    expect(JSON.stringify(document)).not.toContain('x-nocobase-repository');
    const operation =
      document.paths!['/api/dispatched/salesOrders/createOne']!.post!;
    expect(operation.operationId).toBe('salesOrdersCreateOne');
    expect(
      requestSchema(document, '/api/dispatched/salesOrders/createOne')
        .properties.values,
    ).toBeDefined();
    expect(schemaOf(document, 'SalesOrdersRecord').properties).toHaveProperty(
      'title',
    );
  });

  it('documents every action of an exposure without a hand-written declaration', async () => {
    const document = await documentFor([
      {
        name: 'salesOrders',
        collection: 'orders',
        policy: open,
        actions: {
          findMany: { maxLimit: 50 },
          findOne: {},
          count: {},
          aggregate: {},
          groupBy: {},
          exists: {},
          createOne: {},
          updateOne: {},
          deleteOne: {},
        },
      },
    ]);

    for (const action of [
      'findMany',
      'findOne',
      'count',
      'aggregate',
      'groupBy',
      'exists',
      'createOne',
      'updateOne',
      'deleteOne',
    ]) {
      const operation = document.paths![`/api/salesOrders/${action}`]!.post!;
      expect(operation.tags).toEqual(['SalesOrders']);
      expect(operation.operationId).toBe(
        `salesOrders${action.charAt(0).toUpperCase()}${action.slice(1)}`,
      );
      expect(operation.summary).toMatch(/ of salesOrders$/);
      expect(operation).not.toHaveProperty('x-nocobase-repository');
    }
    expect(document.tags).toEqual([{ name: 'SalesOrders' }]);

    const findMany = requestSchema(document, '/api/salesOrders/findMany');
    expect(Object.keys(findMany.properties)).toEqual([
      'filter',
      'select',
      'sort',
      'distinct',
      'limit',
      'offset',
      'cursor',
      'direction',
    ]);
    expect(findMany.additionalProperties).toBe(false);
    expect(findMany.properties.limit).toMatchObject({
      maximum: 50,
      default: 50,
    });
    expect(findMany.properties.filter).toEqual({
      $ref: '#/components/schemas/SalesOrdersFilter',
    });
    const findManyResponse = document.paths!['/api/salesOrders/findMany']!.post!
      .responses!['200'] as OpenAPIV3_1.ResponseObject;
    expect(Object.keys(findManyResponse.content!)).toEqual([
      'application/json',
      'application/x-ndjson',
    ]);
    expect(findManyResponse.content!['application/json']!.schema).toEqual({
      type: 'object',
      required: ['data'],
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/SalesOrdersRecord' },
        },
      },
    });

    expect(
      requestSchema(document, '/api/salesOrders/updateOne').required,
    ).toEqual(['filter', 'values']);
    expect(
      requestSchema(document, '/api/salesOrders/groupBy').required,
    ).toEqual(['aggregate', 'by']);
    expect(
      document.paths!['/api/salesOrders/updateOne']!.post!.responses,
    ).toMatchObject({
      '404': { $ref: '#/components/responses/NotFound' },
      '409': { $ref: '#/components/responses/Conflict' },
      '415': { $ref: '#/components/responses/UnsupportedMediaType' },
    });
  });

  it('expands records and values per field from the Collection', async () => {
    const document = await documentFor([
      {
        name: 'salesOrders',
        collection: 'orders',
        policy: open,
        actions: { findOne: {}, createOne: {}, updateOne: {} },
      },
    ]);

    const record = schemaOf(document, 'SalesOrdersRecord');
    expect(record.properties).toMatchObject({
      id: { type: 'string' },
      title: { type: 'string', maxLength: 120 },
      notes: { type: ['string', 'null'] },
      status: { type: 'string', enum: ['draft', 'paid'] },
      quantity: { type: ['integer', 'null'] },
      amount: { type: ['string', 'null'], pattern: '^-?\\d+$' },
      price: { type: ['string', 'null'] },
      urgent: { type: ['boolean', 'null'] },
      dueOn: { type: ['string', 'null'], format: 'date' },
      placedAt: { type: ['string', 'null'], format: 'date-time' },
      version: { type: 'integer', readOnly: true },
      customer: {
        anyOf: [{ type: 'object' }, { type: 'null' }],
      },
    });
    expect(record.properties!.metadata).not.toHaveProperty('type');

    const create = schemaOf(document, 'SalesOrdersCreateValues');
    expect(Object.keys(create.properties!)).toEqual([
      'id',
      'title',
      'notes',
      'status',
      'quantity',
      'amount',
      'price',
      'urgent',
      'dueOn',
      'placedAt',
      'metadata',
      'customerId',
      'customer',
    ]);
    expect(create.properties).not.toHaveProperty('version');
    expect(create.properties!.customer).toEqual({
      $ref: '#/components/schemas/RepositoryRelationMutation',
    });
    expect(create.required).toEqual(['id', 'title']);
    expect(create.additionalProperties).toBe(false);
    expect(
      schemaOf(document, 'SalesOrdersUpdateValues').required,
    ).toBeUndefined();
  });

  it('describes a per-collection filter whose operators come from the Repository', async () => {
    const document = await documentFor([
      {
        name: 'salesOrders',
        collection: 'orders',
        policy: open,
        actions: { findMany: {} },
      },
    ]);

    const filter = schemaOf(document, 'SalesOrdersFilter');
    const [shorthand, ast] = filter.anyOf as Schema[];
    expect(Object.keys(shorthand!.properties!)).toEqual([
      'id',
      'title',
      'notes',
      'status',
      'quantity',
      'amount',
      'price',
      'urgent',
      'version',
      'customerId',
    ]);
    expect(ast).toMatchObject({
      properties: {
        kind: { const: 'filter' },
        collection: { const: 'orders' },
        root: { $ref: '#/components/schemas/SalesOrdersFilterGroup' },
      },
    });

    const conditions = (
      schemaOf(document, 'SalesOrdersFilterCondition').anyOf as Schema[]
    ).filter((condition) => typeof condition.title === 'string');
    const operatorsOf = (field: string): unknown =>
      (
        conditions.find((condition) => condition.title === field)!
          .properties as Record<string, Schema>
      ).operator!.enum;
    expect(operatorsOf('title')).toEqual(filterOperatorsForFieldType('string'));
    expect(operatorsOf('quantity')).toEqual(
      filterOperatorsForFieldType('integer'),
    );
    expect(operatorsOf('dueOn')).toEqual(filterOperatorsForFieldType('date'));
    expect(operatorsOf('urgent')).toEqual([
      '$isTruly',
      '$isFalsy',
      '$empty',
      '$notEmpty',
    ]);
    expect(operatorsOf('metadata')).toEqual(
      filterOperatorsForFieldType('json'),
    );
    expect(
      (
        conditions.find((condition) => condition.title === 'metadata')!
          .properties as Record<string, Schema>
      ).jsonPath,
    ).toBeDefined();

    const shared = schemaOf(document, 'RepositoryFilter');
    expect(shared.description).toContain('| Field types | Operators |');
    expect(shared.description).toContain('`$dateBetween`');
    expect(shared.description).toContain('"quantifier": "some"');
    expect(shared.description).toContain('jsonPath');
    for (const name of [
      'RepositoryFilterGroup',
      'RepositoryFilterCondition',
      'RepositoryFilterRelation',
      'RepositoryFilterVariable',
      'RepositorySelect',
      'RepositorySort',
    ]) {
      schemaOf(document, name);
    }
    const sort = requestSchema(document, '/api/salesOrders/findMany').properties
      .sort!;
    expect(sort.description).toContain('`dueOn`');
    expect(sort.description).not.toContain('`metadata`');
  });

  it('omits what a static Policy forbids', async () => {
    const document = await documentFor([
      {
        name: 'publicOrders',
        collection: 'orders',
        policy: {
          read: { scope: true, fields: ['id', 'title'] },
          create: { scope: true, fields: ['title'], defaults: { id: 'x' } },
          update: false,
          delete: false,
        },
        actions: { findMany: {}, createOne: {}, updateOne: {} },
      },
    ]);

    const record = schemaOf(document, 'PublicOrdersRecord');
    expect(Object.keys(record.properties!)).toEqual(['id', 'title']);
    expect(record.description).not.toContain('permissions restrict');
    const create = schemaOf(document, 'PublicOrdersCreateValues');
    expect(Object.keys(create.properties!)).toEqual(['title']);
    expect(create.required).toEqual(['title']);
    expect(schemaOf(document, 'PublicOrdersUpdateValues')).toMatchObject({
      maxProperties: 0,
    });
    const shorthand = (
      schemaOf(document, 'PublicOrdersFilter').anyOf as Schema[]
    )[0]!;
    expect(Object.keys(shorthand.properties!)).toEqual(['id', 'title']);
  });

  it('documents the full Collection with a note when the Policy depends on the principal', async () => {
    const document = await documentFor(
      [
        {
          name: 'myOrders',
          collection: 'orders',
          policy: () => open,
          actions: { findMany: {}, createOne: {} },
        },
      ],
      () => ({ id: 'u1' }),
    );

    const record = schemaOf(document, 'MyOrdersRecord');
    expect(record.properties).toHaveProperty('price');
    expect(record.description).toContain("caller's permissions restrict");
    expect(
      schemaOf(document, 'MyOrdersCreateValues').properties,
    ).toHaveProperty('customerId');
  });

  it('falls back to a generic record when the Collection cannot be read', async () => {
    const document = await documentFor([
      {
        name: 'ghosts',
        policy: open,
        actions: { findOne: {} },
      },
    ]);

    expect(schemaOf(document, 'GhostsRecord')).toMatchObject({
      additionalProperties: true,
    });
    expect(
      requestSchema(document, '/api/ghosts/findOne').properties.filter,
    ).toEqual({
      $ref: '#/components/schemas/RepositoryFilter',
    });
  });

  it('lists computed fields read-only in the record schema and nowhere in the request', async () => {
    const document = await documentFor([
      {
        name: 'salesOrders',
        collection: 'orders',
        policy: open,
        actions: { findMany: {}, findOne: {}, createOne: {}, deleteOne: {} },
        computedFields: {
          trackingUrl: z
            .string()
            .meta({ description: 'Where to track the order.' }),
          summary: {
            type: 'object',
            properties: { lines: { type: 'integer' } },
          },
        },
      },
    ]);

    const record = schemaOf(document, 'SalesOrdersRecord');
    expect(record.properties!.trackingUrl).toEqual({
      type: 'string',
      description: 'Where to track the order.',
      readOnly: true,
    });
    expect(record.properties!.summary).toMatchObject({
      type: 'object',
      readOnly: true,
    });
    expect(record.description).toContain(
      '`trackingUrl`, `summary` are added by the server',
    );
    // Every record a response carries is this one schema, so findMany, findOne and the mutation results all list them.
    const success = (action: string) =>
      (
        document.paths![`/api/salesOrders/${action}`]!.post!.responses![
          '200'
        ] as OpenAPIV3_1.ResponseObject
      ).content!['application/json']!.schema;
    expect(JSON.stringify(success('findMany'))).toContain('SalesOrdersRecord');
    expect(JSON.stringify(success('createOne'))).toContain('SalesOrdersRecord');

    expect(
      schemaOf(document, 'SalesOrdersCreateValues').properties,
    ).not.toHaveProperty('trackingUrl');
    const shorthand = (
      schemaOf(document, 'SalesOrdersFilter').anyOf as Schema[]
    )[0]!;
    expect(shorthand.properties).not.toHaveProperty('trackingUrl');
    expect(
      JSON.stringify(schemaOf(document, 'SalesOrdersFilterCondition')),
    ).not.toContain('trackingUrl');
    expect(
      requestSchema(document, '/api/salesOrders/findMany').properties.sort!
        .description,
    ).not.toContain('trackingUrl');
  });

  it('refuses a computed field named like a field of the Collection when the routes are created', async () => {
    const routes = defineRepositoryApiRoutes({
      repositories: [
        {
          name: 'salesOrders',
          collection: 'orders',
          policy: open,
          actions: { findOne: {} },
          computedFields: { title: z.string() },
        },
      ],
    });
    await expect(
      Promise.resolve(routes.createRouter({ container })),
    ).rejects.toThrow(
      'Repository API exposure "salesOrders" declares computed field "title", which is also a field of the Collection "orders".',
    );
  });

  it('refuses a malformed computedFields declaration where it is written', () => {
    expect(() =>
      defineRepositoryApiRoutes({
        repositories: [
          {
            name: 'salesOrders',
            policy: open,
            actions: {},
            computedFields: { trackingUrl: 'string' as never },
          },
        ],
      }),
    ).toThrow(
      'computed field "trackingUrl" must be described by a Standard Schema or an OpenAPI schema object',
    );
  });
});
