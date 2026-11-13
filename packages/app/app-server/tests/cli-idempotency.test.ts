import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import {
  apiErrorHandler,
  apiValidator,
  cliRoute,
  describeRoute,
  dataResponse,
  generateApiDocument,
  deriveAllCliCommands,
  deriveCliCommands,
  CliService,
  createCliRouter,
  type ApiDocument,
} from '../src/router/index.js';
import { ApiDocsService } from '../src/router/openapi/service.js';
import { deriveCliIdempotency } from '../src/router/cli/idempotency.js';

const caller = { kind: 'person' as const, userId: 'u1', displayName: 'Ada' };
const header = (
  schema: object = { type: 'string', minLength: 1, 'x-idempotency': true },
  name = 'idempotency-key',
) => ({ in: 'header', name, required: true, schema });
function document(
  parameters: object[] = [header()],
  extra: object = {},
): ApiDocument {
  return {
    openapi: '3.1.0',
    info: { title: 'Keys', version: 'test' },
    paths: {
      '/api/records': {
        post: {
          summary: 'Create a record',
          operationId: 'createRecord',
          parameters,
          responses: {},
          ...extra,
        },
      },
    },
  } as ApiDocument;
}
function command(doc = document()) {
  return deriveAllCliCommands(doc)[0]!;
}

describe('schema-derived operation keys', () => {
  it('preserves field metadata through NocoBase apiValidator, document generation and manifest derivation', async () => {
    const router = new Hono();
    router.onError(apiErrorHandler);
    const Key = z
      .string()
      .min(1)
      .meta({ 'x-idempotency': true, ref: 'OperationKey' });
    router.post(
      '/records',
      describeRoute({
        tags: ['Records'],
        summary: 'Create a record',
        operationId: 'createRecord',
        responses: { 200: dataResponse(z.object({ id: z.string() })) },
        ...cliRoute({ command: 'record create' }),
      }),
      apiValidator(
        'header',
        z.object({
          'idempotency-key': Key,
          'ordinary-header': z.string().optional(),
        }),
      ),
      apiValidator('json', z.strictObject({ name: z.string() })),
      (c) => c.json({ data: { id: c.req.valid('header')['idempotency-key'] } }),
    );
    const doc = await generateApiDocument(router, {
      info: { title: 'Keys', version: 'test' },
    });
    expect(doc.components?.schemas?.OperationKey).toMatchObject({
      type: 'string',
      minLength: 1,
      'x-idempotency': true,
    });
    const parameter = doc.paths?.['/api/records']?.post?.parameters?.[0];
    expect(parameter).toMatchObject({
      name: 'idempotency-key',
      in: 'header',
      required: true,
    });
    expect(parameter).not.toHaveProperty('x-idempotency');
    const derived = command(doc);
    expect(derived.idempotency).toEqual({
      header: 'idempotency-key',
      flag: 'operation-key',
      minLength: 1,
    });
    expect(derived.parameters.map((p) => p.name)).toEqual(['name']);
    expect(derived.requiredCapabilities).toEqual(['idempotency-v1']);
    expect(deriveCliCommands(doc, caller).commands).toEqual([]);
    expect(
      deriveCliCommands(doc, caller, { capabilities: ['idempotency-v1'] })
        .commands,
    ).toHaveLength(1);
    expect(
      (
        await router.request('/records', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: '{"name":"A"}',
        })
      ).status,
    ).toBe(400);
  });

  it('ignores ordinary headers and false markers without creating flags', () => {
    const derived = command(
      document([
        header({ type: 'string' }),
        header({ type: 'number', 'x-idempotency': false }, 'other'),
      ]),
    );
    expect(derived).not.toHaveProperty('idempotency');
    expect(derived.parameters).toEqual([]);
  });

  it('resolves parameter and schema refs, allOf intersections, and path-level parameters', () => {
    const doc = document([{ $ref: '#/components/parameters/Key' }]);
    doc.components = {
      parameters: {
        Key: header({
          $ref: '#/components/schemas/Key',
          maxLength: 80,
        }) as never,
      },
      schemas: {
        Key: {
          allOf: [
            { type: 'string', minLength: 1 },
            { minLength: 3, 'x-idempotency': true } as object,
          ],
        },
      },
    };
    expect(command(doc).idempotency).toMatchObject({
      minLength: 3,
      maxLength: 80,
    });
    const path = doc.paths!['/api/records']!;
    path.parameters = path.post!.parameters;
    delete path.post!.parameters;
    expect(command(doc).idempotency?.header).toBe('idempotency-key');
  });

  it.each([
    [{ type: 'number', 'x-idempotency': true }, 'string'],
    [{ type: ['string', 'null'], 'x-idempotency': true }, 'string'],
    [{ type: 'string', 'x-idempotency': 'true' }, 'true or false'],
    [{ type: 'string', 'x-idempotency': null }, 'true or false'],
    [{ type: 'string', minLength: 37, 'x-idempotency': true }, 'UUID'],
    [{ type: 'string', maxLength: 35, 'x-idempotency': true }, 'UUID'],
    [{ type: 'string', pattern: '^a', 'x-idempotency': true }, 'unsupported'],
    [{ type: 'string', format: 'email', 'x-idempotency': true }, 'format'],
    [{ type: 'string', enum: ['a'], 'x-idempotency': true }, 'unsupported'],
    [
      { anyOf: [{ type: 'string', 'x-idempotency': true }, { type: 'null' }] },
      'ambiguous',
    ],
    [
      {
        type: 'string',
        allOf: [{ 'x-idempotency': true }, { 'x-idempotency': false }],
      },
      'conflicting',
    ],
  ])('rejects unsupported or ambiguous schema %j', (schema, message) => {
    expect(() => command(document([header(schema)]))).toThrow(message);
  });

  it.each([
    'Authorization',
    'COOKIE',
    'Host',
    'Content-Length',
    'Transfer-Encoding',
    'x-NB-agent-session',
    'X-NocoBase-run-token',
    'Sec-Fetch-Site',
    'X-HTTP-Method-Override',
    'bad name',
  ])('refuses reserved header %s case-insensitively', (name) => {
    expect(() => command(document([header(undefined, name)]))).toThrow(
      'header',
    );
  });

  it('refuses custom authentication headers including referenced schemes', () => {
    const doc = document([header(undefined, 'X-Custom-Credential')]);
    doc.components = {
      securitySchemes: {
        auth: { type: 'apiKey', in: 'header', name: 'x-custom-credential' },
        alias: { $ref: '#/components/securitySchemes/auth' },
      },
    };
    expect(() => command(doc)).toThrow('authentication');
  });

  it('rejects duplicate headers, multiple keys, parameter-level markers, non-header and optional declarations', () => {
    expect(() =>
      command(document([header(), header(undefined, 'IDEMPOTENCY-KEY')])),
    ).toThrow('duplicate');
    expect(() =>
      command(document([header(), header(undefined, 'another-key')])),
    ).toThrow('one operation');
    expect(() =>
      command(document([{ ...header(), 'x-idempotency': true }])),
    ).toThrow('schema');
    expect(() => command(document([{ ...header(), in: 'query' }]))).toThrow(
      'only header',
    );
    expect(() => command(document([{ ...header(), required: false }]))).toThrow(
      'required',
    );
    for (const method of ['GET', 'HEAD', 'OPTIONS'])
      expect(() =>
        deriveCliIdempotency(document(), method, [header() as never]),
      ).toThrow('read methods');
    const doc = document();
    doc.paths!['/api/records']!.get = doc.paths!['/api/records']!.post;
    delete doc.paths!['/api/records']!.post;
    expect(() => command(doc)).toThrow('read methods');
  });

  it('rejects missing/external/cyclic references, body markers, flag collisions and multi-request flows', () => {
    for (const ref of [
      '#/components/schemas/Missing',
      'https://example.com/key',
      '#/components/schemas/Loop',
    ]) {
      const doc = document([header({ $ref: ref, 'x-idempotency': true })]);
      doc.components = {
        schemas: { Loop: { $ref: '#/components/schemas/Loop' } },
      };
      expect(() => command(doc)).toThrow('reference');
    }
    expect(() =>
      command(
        document([], {
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    key: { type: 'string', 'x-idempotency': true },
                  },
                },
              },
            },
          },
        }),
      ),
    ).toThrow('only header');
    for (const name of ['operationKey', 'payload']) {
      const extra = {
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: { [name]: { type: 'string' } },
              },
            },
          },
        },
        'x-cli': name === 'payload' ? { bodyFile: 'operation-key' } : {},
      };
      expect(() => command(document([header()], extra))).toThrow('conflicts');
    }
    expect(() =>
      command(
        document([header()], {
          'x-cli': { ticketUpload: { flag: 'tar', maxBytes: 100 } },
        }),
      ),
    ).toThrow('single target');
  });

  it('separates HTTP capabilities, ETags, 304 and references without changing caller permissions', async () => {
    const router = new Hono();
    router.onError(apiErrorHandler);
    router.post(
      '/records',
      describeRoute({
        tags: ['Records'],
        summary: 'Create a record',
        operationId: 'createRecord',
        responses: { 200: dataResponse(z.string()) },
      }),
      apiValidator(
        'header',
        z.object({
          'idempotency-key': z.string().min(1).meta({ 'x-idempotency': true }),
        }),
      ),
      (c) => c.json({ data: 'ok' }),
    );
    router.get(
      '/records',
      describeRoute({
        tags: ['Records'],
        summary: 'List records',
        operationId: 'listRecords',
        responses: { 200: dataResponse(z.string()) },
      }),
      (c) => c.json({ data: 'ok' }),
    );
    const docs = new ApiDocsService();
    docs.attach({
      api: router,
      describe: () => ({ info: { title: 'Keys', version: 'test' } }),
    });
    const cli = new CliService();
    cli.addCaller(() => caller);
    cli.describe({ bin: 'acme' });
    const routes = createCliRouter(cli, docs);
    const first = await routes.request('/cli/manifest');
    const old = (await first.json()).data;
    expect(old.commands.map((c: { method: string }) => c.method)).toEqual([
      'GET',
    ]);
    const headers = {
      'x-nocobase-cli-capabilities': 'idempotency-v1',
      'if-none-match': first.headers.get('etag')!,
    };
    const second = await routes.request('/cli/manifest', { headers });
    expect(second.status).toBe(200);
    expect(second.headers.get('vary')).toBe('x-nocobase-cli-capabilities');
    const fresh = (await second.json()).data;
    expect(fresh.commands).toHaveLength(2);
    expect(fresh.etag).not.toBe(old.etag);
    expect(
      (
        await routes.request('/cli/manifest', {
          headers: { ...headers, 'if-none-match': second.headers.get('etag')! },
        })
      ).status,
    ).toBe(304);
    expect(
      (
        await routes.request('/cli/manifest', {
          headers: { 'if-none-match': second.headers.get('etag')! },
        })
      ).status,
    ).toBe(200);
    const reference = await routes.request('/cli/llms.txt', { headers });
    expect(await reference.text()).toContain('--operation-key');
  });
});
