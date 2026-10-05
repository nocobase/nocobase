import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import {
  apiValidator,
  dataResponse,
  describeRoute,
  findApiDocumentSchemaProblems,
  generateApiDocument,
  listResponse,
  type ApiDocument,
  type OpenAPIV3_1,
} from '../src/router/index.js';

const info = { title: 'Test', version: '1.0.0' };

type Schema = OpenAPIV3_1.SchemaObject & Partial<OpenAPIV3_1.ReferenceObject>;

function responseSchema(
  document: ApiDocument,
  path: string,
  method: 'get' | 'post' = 'post',
): Schema {
  const response = document.paths![path]![method]!.responses!['200'] as {
    content: Record<string, { schema: Schema }>;
  };
  return response.content['application/json']!.schema;
}

function requestSchema(document: ApiDocument, path: string): Schema {
  const body = document.paths![path]!.post!.requestBody as {
    content: Record<string, { schema: Schema }>;
  };
  return body.content['application/json']!.schema;
}

function dataOf(schema: Schema): Schema {
  return schema.properties!.data as Schema;
}

function schemaNames(document: ApiDocument): string[] {
  return Object.keys(document.components?.schemas ?? {});
}

const jsonValueBranches = (ref: string): unknown => ({
  anyOf: [
    { type: 'string' },
    { type: 'number' },
    { type: 'boolean' },
    { type: 'null' },
    { type: 'array', items: { $ref: ref } },
    {
      type: 'object',
      propertyNames: { type: 'string' },
      additionalProperties: { $ref: ref },
    },
  ],
});

describe('recursive schemas', () => {
  it('names an anonymous z.json() JsonValue in responses and request bodies', async () => {
    const router = new Hono();
    router.post(
      '/things',
      describeRoute({
        operationId: 'createThing',
        responses: {
          200: dataResponse(z.object({ value: z.json(), name: z.string() })),
        },
      }),
      apiValidator('json', z.strictObject({ value: z.json() })),
      (context) => context.json({ data: null }),
    );
    router.post(
      '/raw',
      describeRoute({
        operationId: 'readRaw',
        responses: { 200: dataResponse(z.json()) },
      }),
      apiValidator('json', z.json()),
      (context) => context.json({ data: null }),
    );

    const document = await generateApiDocument(router, { info });

    expect(findApiDocumentSchemaProblems(document)).toEqual([]);
    const ref = '#/components/schemas/JsonValue';
    expect(document.components!.schemas!.JsonValue).toEqual(
      jsonValueBranches(ref),
    );
    expect(
      dataOf(responseSchema(document, '/api/things')).properties!.value,
    ).toEqual({ $ref: ref });
    expect(requestSchema(document, '/api/things').properties!.value).toEqual({
      $ref: ref,
    });
    // A recursive root refers to itself as `#`, which in a document would be the document; it becomes a component.
    expect(dataOf(responseSchema(document, '/api/raw'))).toEqual({ $ref: ref });
    expect(requestSchema(document, '/api/raw')).toEqual({ $ref: ref });
  });

  it('names a recursive schema after its declared ref and points every $ref at the component', async () => {
    const WorkflowJson = z.json().meta({ ref: 'WorkflowJson' });
    const router = new Hono();
    router.post(
      '/workflows',
      describeRoute({
        operationId: 'createWorkflow',
        responses: {
          200: dataResponse(
            z.object({
              config: WorkflowJson,
              notes: WorkflowJson.describe('Free-form notes.'),
            }),
          ),
        },
      }),
      apiValidator('json', z.object({ config: WorkflowJson })),
      (context) => context.json({ data: null }),
    );
    router.post(
      '/workflows/raw',
      describeRoute({
        operationId: 'readWorkflowConfig',
        responses: { 200: dataResponse(WorkflowJson) },
      }),
      (context) => context.json({ data: null }),
    );

    const document = await generateApiDocument(router, { info });

    expect(findApiDocumentSchemaProblems(document)).toEqual([]);
    const ref = '#/components/schemas/WorkflowJson';
    expect(document.components!.schemas!.WorkflowJson).toEqual(
      jsonValueBranches(ref),
    );
    expect(schemaNames(document)).not.toContain('JsonValue');
    expect(
      dataOf(responseSchema(document, '/api/workflows')).properties,
    ).toEqual({
      config: { $ref: ref },
      notes: { $ref: ref, description: 'Free-form notes.' },
    });
    expect(
      requestSchema(document, '/api/workflows').properties!.config,
    ).toEqual({ $ref: ref });
    expect(dataOf(responseSchema(document, '/api/workflows/raw'))).toEqual({
      $ref: ref,
    });
  });

  it('gives different anonymous recursive schemas different stable names', async () => {
    interface Tree {
      name: string;
      children: Tree[];
    }
    const Tree: z.ZodType<Tree> = z.lazy(() =>
      z.object({ name: z.string(), children: z.array(Tree) }),
    );
    interface Chain {
      next?: Chain;
    }
    const Chain: z.ZodType<Chain> = z.lazy(() =>
      z.object({ next: Chain.optional() }),
    );
    const build = (): Hono => {
      const router = new Hono();
      router.get(
        '/trees',
        describeRoute({
          operationId: 'listTrees',
          responses: { 200: listResponse(z.object({ tree: Tree })) },
        }),
        (context) => context.json({ data: [] }),
      );
      router.get(
        '/chains',
        describeRoute({
          operationId: 'listChains',
          responses: { 200: listResponse(z.object({ chain: Chain })) },
        }),
        (context) => context.json({ data: [] }),
      );
      return router;
    };

    const document = await generateApiDocument(build(), { info });
    const again = await generateApiDocument(build(), { info });

    expect(findApiDocumentSchemaProblems(document)).toEqual([]);
    const names = schemaNames(document).filter((name) =>
      name.startsWith('Recursive'),
    );
    expect(names).toHaveLength(2);
    expect(names.every((name) => /^Recursive[0-9a-f]{8}$/.test(name))).toBe(
      true,
    );
    expect(
      schemaNames(again).filter((name) => name.startsWith('Recursive')),
    ).toEqual(names);
  });
});

describe('findApiDocumentSchemaProblems', () => {
  it('reports converter-generated names, unresolved references and invalid component names', () => {
    const document: ApiDocument = {
      openapi: '3.1.0',
      info,
      paths: {
        '/api/things': {
          get: {
            responses: {
              200: {
                description: 'Success.',
                content: {
                  'application/json': {
                    schema: { $ref: '#/components/schemas/Missing' },
                  },
                },
              },
            },
          },
        },
      },
      components: {
        schemas: {
          __schema0: { type: 'string' },
          WorkflowJson: { $ref: '#/$defs/__schema0' },
          'Bad name': { type: 'string' },
          Remote: { $ref: 'https://example.com/schema.json' },
        },
      },
    };

    expect(findApiDocumentSchemaProblems(document)).toEqual([
      'components/schemas/__schema0 is a name generated by the schema converter, not a declared one.',
      'components/schemas/Bad name is not a valid OpenAPI component name.',
      '#/paths/~1api~1things/get/responses/200/content/application~1json/schema refers to #/components/schemas/Missing, which does not exist in the document.',
      '#/components/schemas/WorkflowJson refers to #/$defs/__schema0, which does not exist in the document.',
    ]);
  });
});

describe('object strictness', () => {
  it('documents response objects open unless strict, and request bodies as validated', async () => {
    const Shape = z.object({
      plain: z.object({ a: z.string() }),
      strict: z.strictObject({ b: z.string() }),
      loose: z.looseObject({ c: z.string() }),
    });
    const router = new Hono();
    router.post(
      '/shapes',
      describeRoute({
        operationId: 'createShape',
        responses: { 200: dataResponse(Shape) },
      }),
      apiValidator('json', Shape),
      (context) => context.json({ data: null }),
    );
    router.post(
      '/strict-shapes',
      describeRoute({
        operationId: 'createStrictShape',
        responses: { 200: dataResponse(z.strictObject({ id: z.string() })) },
      }),
      apiValidator('json', z.strictObject({ name: z.string() })),
      (context) => context.json({ data: null }),
    );

    const document = await generateApiDocument(router, { info });

    const response = dataOf(responseSchema(document, '/api/shapes'));
    expect(response).not.toHaveProperty('additionalProperties');
    expect(response.properties!.plain).not.toHaveProperty(
      'additionalProperties',
    );
    expect(response.properties!.strict).toMatchObject({
      additionalProperties: false,
    });
    expect(response.properties!.loose).toMatchObject({
      additionalProperties: {},
    });

    const request = requestSchema(document, '/api/shapes');
    expect(request).not.toHaveProperty('additionalProperties');
    expect(request.properties!.plain).not.toHaveProperty(
      'additionalProperties',
    );
    expect(request.properties!.strict).toMatchObject({
      additionalProperties: false,
    });

    expect(
      dataOf(responseSchema(document, '/api/strict-shapes')),
    ).toMatchObject({ additionalProperties: false });
    expect(requestSchema(document, '/api/strict-shapes')).toMatchObject({
      additionalProperties: false,
    });
  });
});

describe('shared schemas', () => {
  it('keeps a property description next to the $ref of a shared schema without changing the component', async () => {
    const Employee = z
      .object({ id: z.string() })
      .meta({ ref: 'TestEmployee', description: 'An employee.' });
    const router = new Hono();
    router.post(
      '/assignments',
      describeRoute({
        operationId: 'createAssignment',
        responses: {
          200: dataResponse(
            z.object({
              assignee: Employee.meta({ description: 'Who does the work.' }),
              reviewer: Employee.describe('Who reviews the work.'),
              owner: Employee,
            }),
          ),
        },
      }),
      apiValidator(
        'json',
        z.strictObject({
          assignee: Employee.meta({ description: 'Who does the work.' }),
        }),
      ),
      (context) => context.json({ data: null }),
    );

    const document = await generateApiDocument(router, { info });

    expect(findApiDocumentSchemaProblems(document)).toEqual([]);
    const ref = '#/components/schemas/TestEmployee';
    expect(
      dataOf(responseSchema(document, '/api/assignments')).properties,
    ).toEqual({
      assignee: { $ref: ref, description: 'Who does the work.' },
      reviewer: { $ref: ref, description: 'Who reviews the work.' },
      owner: { $ref: ref },
    });
    expect(requestSchema(document, '/api/assignments').properties).toEqual({
      assignee: { $ref: ref, description: 'Who does the work.' },
    });
    expect(document.components!.schemas!.TestEmployee).toEqual({
      type: 'object',
      description: 'An employee.',
      properties: { id: { type: 'string' } },
      required: ['id'],
    });
  });
});

describe('header parameters', () => {
  it('leaves out the headers OpenAPI ignores as parameters', async () => {
    const router = new Hono();
    router.post(
      '/uploads',
      describeRoute({
        operationId: 'createUpload',
        responses: { 200: dataResponse(z.object({ id: z.string() })) },
      }),
      apiValidator(
        'header',
        z.object({
          'content-type': z.string(),
          Accept: z.string().optional(),
          authorization: z.string().optional(),
          'x-file-name': z.string(),
        }),
      ),
      (context) => context.json({ data: { id: '1' } }),
    );

    const document = await generateApiDocument(router, { info });

    const parameters = document.paths!['/api/uploads']!.post!.parameters as {
      name: string;
      in: string;
      required?: boolean;
    }[];
    expect(parameters).toEqual([
      expect.objectContaining({
        in: 'header',
        name: 'x-file-name',
        required: true,
      }),
    ]);
  });
});
