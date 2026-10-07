import {
  findUndeclaredApiRoutes,
  generateApiDocument,
  inspectApiRoutes,
  type ApiDocument,
  type OpenAPIV3_1,
} from '@nocobase/app-server/router';
import { beforeAll, describe, expect, it } from 'vitest';

import { createAIEmployeeRoutes } from '../../server/route/index.js';
import { AI_ROUTES } from './route-table.js';
import { createTestAIEmployeeFixture } from './test-context.js';

/** Hono's `:name` path parameters, as the API document writes them. */
function documentPath(path: string): string {
  return `/api${path.replace(/:(\w+)/g, '{$1}')}`;
}

describe('AI employee API document', () => {
  let router: ReturnType<typeof createAIEmployeeRoutes>;
  let document: ApiDocument;

  beforeAll(async () => {
    const { deps, services } = await createTestAIEmployeeFixture();
    router = createAIEmployeeRoutes({
      authentication: deps.auth,
      authorization: deps.authorization,
      services,
      logger: deps.logging.getLogger('ai-employee-test'),
    });
    document = await generateApiDocument(router, {
      info: { title: 'AI employee', version: '0.0.0' },
    });
  });

  function operation(
    method: string,
    path: string,
  ): OpenAPIV3_1.OperationObject {
    const item = document.paths?.[documentPath(path)];
    const found = item?.[method.toLowerCase() as OpenAPIV3_1.HttpMethods];
    if (!found) throw new Error(`${method} ${path} is not in the document`);
    return found;
  }

  it('declares every route, and hides none', () => {
    expect(findUndeclaredApiRoutes(router)).toEqual([]);
    const routes = inspectApiRoutes(router);
    expect(routes.filter((route) => route.hidden)).toEqual([]);
    expect(routes).toHaveLength(AI_ROUTES.length);
  });

  it('documents every route under the AiEmployee tag with a unique aiEmployees operationId', () => {
    const operationIds = AI_ROUTES.map(([method, path]) => {
      const documented = operation(method, path);
      expect(documented.tags).toEqual(['AiEmployee']);
      expect(documented.summary).toBeTruthy();
      expect(documented.operationId).toMatch(/^aiEmployees[A-Z]/);
      return documented.operationId;
    });
    expect(new Set(operationIds).size).toBe(AI_ROUTES.length);
    expect(operationIds).toEqual(
      expect.arrayContaining([
        'aiEmployeesListRoster',
        'aiEmployeesUpdateEmployee',
        'aiEmployeesSendConversationMessages',
        'aiEmployeesUploadFile',
        'aiEmployeesGetUsageSummary',
      ]),
    );
  });

  it('documents the input each route validates', () => {
    const update = operation('PATCH', '/aiEmployees/:username');
    expect(update.requestBody).toMatchObject({
      content: { 'application/json': { schema: expect.any(Object) } },
    });
    expect(update.responses).toHaveProperty('200');
    expect(update.responses).toHaveProperty('404');
    expect(update.responses).toHaveProperty('413');

    const messages = operation(
      'GET',
      '/aiEmployee/conversations/:sessionId/messages',
    );
    expect(messages.parameters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ in: 'path', name: 'sessionId' }),
        expect.objectContaining({ in: 'query', name: 'pageToken' }),
        expect.objectContaining({ in: 'query', name: 'pageSize' }),
      ]),
    );
  });

  it('names the AI settings permission a settings route requires', () => {
    expect(operation('GET', '/aiEmployees').description).toContain(
      'Requires the AI settings permission `read` on `ai.employees` or `read` on `ai.conversations`.',
    );
    expect(
      operation('POST', '/aiEmployee/llmServices/:name/enable').description,
    ).toContain(
      'Requires the AI settings permission `manage` on `ai.llmServices`.',
    );
  });

  it('documents a run as a server-sent event stream, with the errors answered before it opens', () => {
    const send = operation('POST', '/aiEmployee/conversations/:sessionId/send');
    const ok = send.responses?.['200'] as OpenAPIV3_1.ResponseObject;
    expect(Object.keys(ok.content ?? {})).toEqual(['text/event-stream']);
    expect(ok.description).toContain('"type": "error"');
    expect(Object.keys(send.responses ?? {})).toEqual(
      expect.arrayContaining(['400', '401', '404', '413', '429']),
    );
  });

  it('documents the upload as multipart and its size and media type refusals', () => {
    const upload = operation('POST', '/aiEmployee/files');
    expect(upload.requestBody).toMatchObject({
      content: { 'multipart/form-data': expect.any(Object) },
    });
    expect(Object.keys(upload.responses ?? {})).toEqual(
      expect.arrayContaining(['201', '413', '415']),
    );
  });

  it('describes responses with shared components', () => {
    expect(document.components?.schemas).toEqual(
      expect.objectContaining({
        AiEmployeeEmployee: expect.any(Object),
        AiEmployeeConversation: expect.any(Object),
        AiEmployeeMessage: expect.any(Object),
        AiEmployeeLLMService: expect.any(Object),
        AiEmployeeUsageSummary: expect.any(Object),
      }),
    );
  });
});
