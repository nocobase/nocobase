// @vitest-environment node
/**
 * The plugin's API document: every route declares itself, the schemas are sound, every operation is listed under the
 * `Agents` tag with a unique `agents…` operationId, and the routes that take another credential than a session or an
 * API key name it.
 */
import { Auth, authenticationToken } from '@nocobase/app-plugin-authentication';
import { parseCommandLine } from '@nocobase/app-cli-client/parse';
import { fillRequest } from '@nocobase/app-cli-client/request';
import { authorizationToken } from '@nocobase/app-plugin-authorization';
import { createAppPaths } from '@nocobase/app-server/config';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import {
  findApiDocumentSchemaProblems,
  deriveAllCliCommands,
  findUndeclaredApiRoutes,
  generateApiDocument,
  inspectApiRoutes,
  type ApiDocument,
  type OpenAPIV3_1,
} from '@nocobase/app-server/router';
import { ServiceContainer } from '@nocobase/service-provider';
import { Hono } from 'hono';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { apiRoutes } from '../server/routes/index.js';
import { agentsSecurityFragment } from '../server/routes/openapi.js';
import { agentsToken } from '../server/tokens.js';
import { claim, createHarness, type Harness } from './harness.js';

let h: Harness;
let api: Hono;
let document: ApiDocument;

beforeAll(async () => {
  h = await createHarness();
  const container = new ServiceContainer();
  container.instance(
    authenticationToken,
    new Auth({
      connection: h.database.connection(),
      secret: 'agents-openapi-test-secret-at-least-32-characters',
      baseURL: 'http://example.test',
    }),
  );
  container.instance(authorizationToken, {
    middleware: () => async (_context: unknown, next: () => Promise<void>) =>
      next(),
  } as never);
  container.instance(agentsToken, h.services);
  const app: AppPluginApplication = {
    appName: 'main',
    publicBasePath: '',
    config: { app: { name: 'main', publicBasePath: '' } },
    paths: createAppPaths({ rootDir: '/tmp/agents-openapi' }),
    router: new Hono(),
    container,
  };
  api = await apiRoutes.createRouter(app);
  document = await generateApiDocument(api, {
    info: { title: 'Agents', version: '0.0.0' },
    fragments: [agentsSecurityFragment()],
  });
});
afterAll(() => h.close());

const operations = (): (OpenAPIV3_1.OperationObject & {
  readonly key: string;
})[] =>
  Object.entries(document.paths ?? {}).flatMap(([path, item]) =>
    Object.entries(item ?? {})
      .filter(([method]) =>
        ['get', 'put', 'post', 'patch', 'delete'].includes(method),
      )
      .map(([method, operation]) => ({
        ...(operation as OpenAPIV3_1.OperationObject),
        key: `${method.toUpperCase()} ${path}`,
      })),
  );

function operation(method: string, path: string): OpenAPIV3_1.OperationObject {
  const found = operations().find((item) => item.key === `${method} ${path}`);
  if (!found) throw new Error(`${method} ${path} is not in the document`);
  return found;
}

describe('agents API document', () => {
  it('declares every route and hides none', () => {
    expect(findUndeclaredApiRoutes(api)).toEqual([]);
    const routes = inspectApiRoutes(api);
    expect(routes.filter((route) => route.hidden)).toEqual([]);
    expect(routes.length).toBeGreaterThanOrEqual(97);
    expect(operations()).toHaveLength(routes.length);
  });

  it('derives repeatable raw event type flags from the query schema', () => {
    const command = deriveAllCliCommands(document).find(
      (entry) => entry.id === 'run:events',
    );
    expect(command?.parameters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'type',
          type: 'string[]',
          required: false,
          enum: [
            'text',
            'thinking',
            'toolUse',
            'toolResult',
            'permission',
            'input',
            'checkout',
            'status',
            'error',
            'usage',
          ],
        }),
      ]),
    );
  });

  it('has sound schemas', () => {
    expect(findApiDocumentSchemaProblems(document)).toEqual([]);
  });

  it('sends repeated CLI types to the event API and retains them on the next page', async () => {
    const command = deriveAllCliCommands(document).find(
      (entry) => entry.id === 'run:events',
    );
    if (!command) throw new Error('Missing run:events command');
    const runId = await h.enqueue(await h.createAgent(), 'cli-filter', {
      actorUserId: 'bob',
    });
    const runner = await h.registerRunner();
    await claim(h, runner);
    const stored = await h.request(
      'POST',
      `/agents/runners/runs/${runId}/events`,
      {
        runnerKey: runner.key,
        body: {
          events: ['status', 'text', 'toolUse', 'input', 'text'].map(
            (type, index) => ({
              seq: index + 1,
              at: '2026-10-10T00:00:00Z',
              type,
              content: `event ${index + 1}`,
            }),
          ),
        },
      },
    );
    expect(stored.status).toBe(200);
    const args = [runId, '--type', 'text', '--type', 'input', '--limit', '2'];
    const options = {
      bin: 'nocobase',
      io: { readText: () => Promise.resolve(undefined), env: () => undefined },
    };
    const firstCall = await parseCommandLine(command, args, options);
    const firstRequest = fillRequest(command, firstCall.values);
    expect(
      new URL(firstRequest.path, 'http://example.test').searchParams.getAll(
        'type',
      ),
    ).toEqual(['text', 'input']);
    const first = await h.request(
      firstRequest.method,
      firstRequest.path.replace(/^\/api/u, ''),
      {
        user: 'bob',
      },
    );
    expect(first.status).toBe(200);
    expect(first.body.data.map((row: { seq: number }) => row.seq)).toEqual([
      2, 4,
    ]);
    const token: unknown = first.body.meta.nextPageToken;
    if (typeof token !== 'string') throw new Error('Missing next page token');
    const nextCall = await parseCommandLine(
      command,
      [...args, '--page-token', token],
      options,
    );
    const nextRequest = fillRequest(command, nextCall.values);
    const next = await h.request(
      nextRequest.method,
      nextRequest.path.replace(/^\/api/u, ''),
      {
        user: 'bob',
      },
    );
    expect(next.status).toBe(200);
    expect(next.body.data.map((row: { seq: number }) => row.seq)).toEqual([5]);
    expect(next.body.meta).toEqual({ lastSeq: 5 });
  });

  it('lists every operation under Agents with a unique agents operationId', () => {
    const all = operations();
    expect(
      all.filter(
        (item) =>
          item.tags?.join() !== 'Agents' ||
          !item.summary ||
          !/^agents[A-Z]/u.test(item.operationId ?? ''),
      ),
    ).toEqual([]);
    const ids = all.map((item) => item.operationId);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual(
      expect.arrayContaining([
        'agentsListAgents',
        'agentsListAvailableAgents',
        'agentsSetCurrentRunConversationTitle',
        'agentsListRuns',
        'agentsListRunEvents',
        'agentsSendConversationMessage',
        'agentsListModelServices',
        'agentsListRunners',
        'agentsRunnerRegister',
        'agentsRunnerClaimWork',
        'agentsGetCurrentRun',
        'agentsGetRunnerInstallScript',
        'agentsDownloadDistFile',
        'agentsListRunRequests',
        'agentsGetRunRequest',
        'agentsConfirmRunRequest',
        'agentsRejectRunRequest',
        'agentsWithdrawRunRequest',
        'agentsRunRunRequestAsMe',
      ]),
    );
  });

  it('declares the run request routes for people only, with their commands', () => {
    const cli = (method: string, path: string) =>
      (operation(method, path) as Record<string, unknown>)['x-cli'];
    // A session or an API key, as every people's route: never a run token, which could confirm for its person.
    for (const [method, path] of [
      ['GET', '/api/agents/runRequests'],
      ['GET', '/api/agents/runRequests/{requestId}'],
      ['POST', '/api/agents/runRequests/{requestId}/confirm'],
      ['POST', '/api/agents/runRequests/{requestId}/reject'],
      ['POST', '/api/agents/runRequests/{requestId}/withdraw'],
      ['POST', '/api/agents/runRequests/{requestId}/runAsMe'],
    ] as const)
      expect(operation(method, path).security).toBeUndefined();
    expect(cli('GET', '/api/agents/runRequests')).toMatchObject({
      command: 'run request list',
    });
    expect(
      cli('POST', '/api/agents/runRequests/{requestId}/confirm'),
    ).toMatchObject({
      command: 'run request confirm',
      args: ['requestId'],
      confirm: expect.any(String),
    });
    expect(
      cli('POST', '/api/agents/runRequests/{requestId}/runAsMe'),
    ).toMatchObject({ command: 'run request run-as-me' });
  });

  it('declares concurrent settlement conflicts on every run request mutation', () => {
    for (const action of ['confirm', 'reject', 'withdraw', 'runAsMe'])
      expect(
        operation('POST', `/api/agents/runRequests/{requestId}/${action}`)
          .responses,
      ).toHaveProperty('409');
  });

  it('names the credential of each route that takes no session', () => {
    expect(Object.keys(document.components?.securitySchemes ?? {})).toEqual(
      expect.arrayContaining(['runToken', 'runnerKey', 'registrationToken']),
    );
    expect(document.components?.securitySchemes?.runToken).toMatchObject({
      type: 'apiKey',
      in: 'header',
      name: 'x-nocobase-run-token',
    });
    expect(
      operation('GET', '/api/agents/runs/current/context').security,
    ).toEqual([{ runToken: [] }]);
    expect(operation('POST', '/api/agents/runners/claim').security).toEqual([
      { runnerKey: [] },
    ]);
    expect(
      operation('POST', '/api/agents/runners/runs/{runId}/complete').security,
    ).toEqual([{ runnerKey: [] }]);
    expect(operation('POST', '/api/agents/runners/register').security).toEqual(
      [],
    );
    expect(operation('GET', '/api/agents/dist/installScript').security).toEqual(
      [],
    );
    expect(operation('GET', '/api/agents/dist/manifest').security).toEqual([
      { runnerKey: [] },
      { registrationToken: [] },
      { downloadToken: [] },
      { cookieAuth: [] },
      { apiKeyAuth: [] },
    ]);
    expect(operation('GET', '/api/agents/available').security).toEqual([
      { cookieAuth: [] },
      { apiKeyAuth: [] },
      { runToken: [] },
    ]);
    expect(
      operation('PATCH', '/api/agents/runs/current/conversation').security,
    ).toEqual([{ runToken: [] }]);
    // People's routes inherit the document's session and API key requirement, minting a download token too.
    expect(
      operation('POST', '/api/agents/dist/downloadTokens').security,
    ).toBeUndefined();
    expect(operation('GET', '/api/agents/runs').security).toBeUndefined();
  });

  it('names the commands, and keeps the runner protocol off the command line', () => {
    const cli = (method: string, path: string) =>
      (operation(method, path) as Record<string, unknown>)['x-cli'];
    expect(cli('GET', '/api/agents/available')).toMatchObject({
      command: 'agent list',
      action: 'agents.agents/view',
    });
    expect(cli('PATCH', '/api/agents/runs/current/conversation')).toMatchObject(
      { command: 'conversation title set', args: ['title'] },
    );
    expect(cli('DELETE', '/api/agents/{agentId}')).toMatchObject({
      command: 'agent delete',
      confirm: expect.any(String),
    });
    for (const [method, path] of [
      ['POST', '/api/agents/runners/claim'],
      ['POST', '/api/agents/runners/runs/{runId}/complete'],
      ['POST', '/api/agents/runners/jobs/{jobId}/lease'],
      ['GET', '/api/agents/dist/manifest'],
      ['GET', '/api/agents/dist/installScript'],
    ] as const)
      expect(cli(method, path)).toBe(false);
    // A signed-in person hands a download token to a machine without a browser.
    expect(cli('POST', '/api/agents/dist/downloadTokens')).toMatchObject({
      command: 'install-token create',
    });
    // Every runToken route names the business action a run must hold.
    expect(
      operations().filter(
        (item) =>
          item.security?.some((entry) => 'runToken' in entry) &&
          !(item as { 'x-cli'?: { action?: string } })['x-cli']?.action,
      ),
    ).toEqual([]);
  });

  it('documents the bodies a handler reads itself, and the downloads', () => {
    const claim = operation('POST', '/api/agents/runners/claim');
    expect(claim.requestBody).toMatchObject({
      content: { 'application/json': { schema: { type: 'object' } } },
    });
    expect(
      operation('GET', '/api/agents/dist/installScript').responses?.['200'],
    ).toMatchObject({ content: { 'text/x-shellscript': {} } });
    expect(
      operation(
        'GET',
        '/api/agents/dist/products/{product}/versions/{version}/files/{file}',
      ).responses?.['200'],
    ).toMatchObject({
      content: {
        'application/gzip': { schema: { type: 'string', format: 'binary' } },
      },
    });
  });
});
