import { authenticationToken } from '@nocobase/app-plugin-authentication';
import {
  findApiDocumentSchemaProblems,
  findUndeclaredApiRoutes,
  generateApiDocument,
  inspectApiRoutes,
} from '@nocobase/app-server/router';
import type { DatabaseManager } from '@nocobase/db';
import { ServiceContainer } from '@nocobase/service-provider';
import type { Hono, MiddlewareHandler } from 'hono';
import { describe, expect } from 'vitest';

import { apiRoutes } from '../../server/routes/index.js';
import { AgentSessionsService } from '../../server/service.js';
import { agentSessionsToken } from '../../server/tokens.js';
import { test } from '../helpers/database.js';

/** The routes behind a stand-in for sign-in: the `x-user` header names the person, and no header answers 401. */
async function mount(database: DatabaseManager): Promise<Hono> {
  const required = (): MiddlewareHandler => async (context, next) => {
    const id = context.req.header('x-user');
    if (!id)
      return context.json(
        { error: { reason: 'AUTHENTICATION_REQUIRED' } },
        401,
      );
    context.set('auth' as never, { user: { id } } as never);
    await next();
  };
  const container = new ServiceContainer();
  container.instance(authenticationToken, { required } as never);
  container.instance(
    agentSessionsToken,
    new AgentSessionsService({ database }),
  );
  return apiRoutes.createRouter({ container } as never);
}

function call(
  router: Hono,
  method: string,
  path: string,
  user?: string,
  json?: unknown,
): Promise<Response> {
  return Promise.resolve(
    router.request(`/agentSessions${path}`, {
      method,
      headers: {
        ...(user ? { 'x-user': user } : {}),
        ...(json ? { 'content-type': 'application/json' } : {}),
      },
      ...(json ? { body: JSON.stringify(json) } : {}),
    }),
  );
}

const computer = {
  name: 'Laptop',
  platform: 'darwin',
  arch: 'arm64',
  host: 'nb-studio 1.0.0',
  roots: ['/home/zhou'],
  agents: [{ id: 'codex', name: 'Codex', version: '2.2.2' }],
};

describe('the agent sessions routes', () => {
  test('declare themselves for the API document', async ({ database }) => {
    const router = await mount(database);
    expect(findUndeclaredApiRoutes(router)).toEqual([]);
    const document = await generateApiDocument(router, {
      info: { title: 'Agent sessions', version: '0.0.0' },
    });
    expect(findApiDocumentSchemaProblems(document)).toEqual([]);
    const operations = Object.values(document.paths ?? {}).flatMap((item) =>
      Object.values(item ?? {}).flatMap((operation) =>
        typeof operation === 'object' && 'operationId' in operation
          ? [operation]
          : [],
      ),
    );
    expect(operations).toHaveLength(inspectApiRoutes(router).length);
    expect(
      new Set(operations.map((operation) => operation.operationId)).size,
    ).toBe(operations.length);
    for (const operation of operations) {
      expect(operation.tags).toEqual(['AgentSessions']);
      expect(operation.operationId).toMatch(/^agentSessions[A-Z]/u);
    }
  });

  test('answer nobody who is not signed in', async ({ database }) => {
    const router = await mount(database);
    expect((await call(router, 'GET', '/sessions')).status).toBe(401);
    expect(
      (
        await call(router, 'POST', '/bridge/register', undefined, {
          protocol: 1,
          computerId: null,
          computer,
        })
      ).status,
    ).toBe(401);
  });

  test('let a person reach only their own computers and sessions', async ({
    database,
  }) => {
    const router = await mount(database);
    const registered = await call(router, 'POST', '/bridge/register', 'u1', {
      protocol: 1,
      computerId: null,
      computer,
    });
    const { computerId } = (
      (await registered.json()) as { data: { computerId: string } }
    ).data;

    const created = await call(router, 'POST', '/sessions', 'u1', {
      computerId,
      agentId: 'codex',
      cwd: '/home/zhou',
      content: [{ type: 'text', text: 'hi' }],
    });
    expect(created.status).toBe(201);
    const { data: session } = (await created.json()) as {
      data: { id: string; title: string };
    };
    expect(session.title).toBe('hi');

    expect(
      (await call(router, 'GET', `/sessions/${session.id}`, 'u1')).status,
    ).toBe(200);
    const theirs = await call(router, 'GET', `/sessions/${session.id}`, 'u2');
    expect(theirs.status).toBe(404);
    await expect(theirs.json()).resolves.toMatchObject({
      error: { reason: 'AGENT_SESSIONS_SESSION_NOT_FOUND' },
    });
    await expect(
      (await call(router, 'GET', '/computers', 'u2')).json(),
    ).resolves.toEqual({ data: [], meta: { total: 0 } });
    expect(
      (
        await call(router, 'POST', '/bridge/poll', 'u2', {
          computerId,
          wait: false,
        })
      ).status,
    ).toBe(404);
  });

  test('refuse a directory outside the computer’s roots, naming the field', async ({
    database,
  }) => {
    const router = await mount(database);
    const registered = await call(router, 'POST', '/bridge/register', 'u1', {
      protocol: 1,
      computerId: null,
      computer,
    });
    const { computerId } = (
      (await registered.json()) as { data: { computerId: string } }
    ).data;
    const refused = await call(router, 'POST', '/sessions', 'u1', {
      computerId,
      agentId: 'codex',
      cwd: '/etc',
      content: [{ type: 'text', text: 'hi' }],
    });
    expect(refused.status).toBe(400);
    await expect(refused.json()).resolves.toMatchObject({
      error: {
        reason: 'AGENT_SESSIONS_DIRECTORY_NOT_ALLOWED',
        fieldViolations: [{ field: 'cwd' }],
      },
    });
  });
});
