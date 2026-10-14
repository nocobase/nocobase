import { BRIDGE_PROTOCOL_VERSION } from '@nocobase/acp-bridge/protocol';
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
import { describe, expect, vi } from 'vitest';

import {
  COMPUTER_CREDENTIAL,
  COMPUTER_KEY_SCHEME,
} from '../../server/computer-key.js';
import type { ImageStorage } from '../../server/images.js';
import { apiRoutes } from '../../server/routes/index.js';
import { AgentSessionsService } from '../../server/service.js';
import { agentSessionsToken } from '../../server/tokens.js';
import { test } from '../helpers/database.js';
import { fakeFiles } from '../helpers/files.js';

/**
 * The routes behind a stand-in for sign-in: the `x-user` header names the person, and no header answers 401; with
 * `x-computer` too, the person comes with that computer's key, as the credential resolver of `computer-key.ts` makes.
 */
async function mount(
  database: DatabaseManager,
  options: { readonly images?: ImageStorage } = {},
): Promise<Hono> {
  const required = (): MiddlewareHandler => async (context, next) => {
    const id = context.req.header('x-user');
    if (!id)
      return context.json(
        { error: { reason: 'AUTHENTICATION_REQUIRED' } },
        401,
      );
    const computer = context.req.header('x-computer');
    context.set(
      'auth' as never,
      {
        user: { id },
        ...(computer
          ? {
              credential: {
                type: COMPUTER_CREDENTIAL,
                id: computer,
                userId: id,
                scheme: COMPUTER_KEY_SCHEME,
              },
            }
          : {}),
      } as never,
    );
    await next();
  };
  const container = new ServiceContainer();
  container.instance(authenticationToken, { required } as never);
  container.instance(
    agentSessionsToken,
    new AgentSessionsService({ database, ...options }),
  );
  return apiRoutes.createRouter({ container } as never);
}

function call(
  router: Hono,
  method: string,
  path: string,
  user?: string,
  json?: unknown,
  computer?: string,
): Promise<Response> {
  return Promise.resolve(
    router.request(`/agentSessions${path}`, {
      method,
      headers: {
        ...(user ? { 'x-user': user } : {}),
        ...(computer ? { 'x-computer': computer } : {}),
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
  test('discovers through authenticated owned routes with validated input and a correlated bridge reply', async ({
    database,
  }) => {
    const router = await mount(database);
    const {
      data: { computerId },
    } = (await (
      await call(router, 'POST', '/bridge/register', 'u1', {
        protocol: BRIDGE_PROTOCOL_VERSION,
        computerId: null,
        bridgeStartedAt: 'bridge-1',
        computer,
      })
    ).json()) as { data: { computerId: string } };
    const input = { agentId: 'codex', cwd: '/home/zhou', settings: {} };
    const route = `/computers/${computerId}/discoverChoices`;
    expect((await call(router, 'POST', route, undefined, input)).status).toBe(
      401,
    );
    expect((await call(router, 'POST', route, 'u2', input)).status).toBe(404);
    expect(
      (await call(router, 'POST', route, 'u1', { ...input, unwanted: true }))
        .status,
    ).toBe(400);
    const pending = call(router, 'POST', route, 'u1', input);
    let requestId = '';
    await vi.waitFor(async () => {
      const reply = (await (
        await call(
          router,
          'POST',
          '/bridge/poll',
          'u1',
          { computerId, wait: false },
          computerId,
        )
      ).json()) as {
        data: { commands: { type: string; requestId: string }[] };
      };
      requestId =
        reply.data.commands.find(
          (command) => command.type === 'discoverChoices',
        )?.requestId ?? '';
      expect(requestId).not.toBe('');
    });
    const discovery = { status: 'unsupported', choices: [] };
    expect(
      (
        await call(
          router,
          'POST',
          '/bridge/reply',
          'u1',
          { computerId, requestId, listing: null, discovery, error: null },
          computerId,
        )
      ).status,
    ).toBe(204);
    expect(await (await pending).json()).toEqual({ data: discovery });
  });
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
          protocol: BRIDGE_PROTOCOL_VERSION,
          computerId: null,
          bridgeStartedAt: 'bridge-1',
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
      protocol: BRIDGE_PROTOCOL_VERSION,
      computerId: null,
      bridgeStartedAt: 'bridge-1',
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
      protocol: BRIDGE_PROTOCOL_VERSION,
      computerId: null,
      bridgeStartedAt: 'bridge-1',
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

  test('take a computer’s key only for that computer', async ({ database }) => {
    const router = await mount(database);
    const register = async (json: object, as?: string) =>
      (
        (await (
          await call(router, 'POST', '/bridge/register', 'u1', json, as)
        ).json()) as { data: { computerId: string; key?: string } }
      ).data;
    const body = {
      protocol: BRIDGE_PROTOCOL_VERSION,
      bridgeStartedAt: 'bridge-1',
      computer,
    };
    const mine = await register({ ...body, computerId: null });
    const other = await register({ ...body, computerId: null });
    expect(mine.key).toMatch(/^nbc_/u);

    // Registering with the key keeps it, so the answer has none.
    await expect(
      register({ ...body, computerId: mine.computerId }, mine.computerId),
    ).resolves.toEqual({ computerId: mine.computerId });
    const poll = (computerId: string) =>
      call(
        router,
        'POST',
        '/bridge/poll',
        'u1',
        { computerId, wait: false },
        mine.computerId,
      );
    expect((await poll(mine.computerId)).status).toBe(200);
    const elsewhere = await poll(other.computerId);
    expect(elsewhere.status).toBe(404);
    await expect(elsewhere.json()).resolves.toMatchObject({
      error: { reason: 'AGENT_SESSIONS_COMPUTER_NOT_FOUND' },
    });
  });

  test('serve an image sent in a session as nothing a browser runs', async ({
    database,
  }) => {
    const router = await mount(database, {
      images: fakeFiles(database).storage,
    });
    const { computerId } = (
      (await (
        await call(router, 'POST', '/bridge/register', 'u1', {
          protocol: BRIDGE_PROTOCOL_VERSION,
          computerId: null,
          bridgeStartedAt: 'bridge-1',
          computer,
        })
      ).json()) as { data: { computerId: string } }
    ).data;
    const image = async (mimeType: string) => {
      const created = await call(router, 'POST', '/sessions', 'u1', {
        computerId,
        agentId: 'codex',
        cwd: '/home/zhou',
        content: [
          {
            type: 'image',
            mimeType,
            data: Buffer.from('x').toString('base64'),
          },
        ],
      });
      const { id } = ((await created.json()) as { data: { id: string } }).data;
      const events = (await (
        await call(router, 'GET', `/sessions/${id}/events`, 'u1')
      ).json()) as { data: { content: { file: string }[] }[] };
      const path = `/sessions/${id}/images/${events.data[0]!.content[0]!.file}`;
      return { path, response: await call(router, 'GET', path, 'u1') };
    };

    const png = await image('image/png');
    expect(png.response.status).toBe(200);
    expect(Object.fromEntries(png.response.headers)).toMatchObject({
      'content-type': 'image/png',
      'content-disposition': 'inline',
      'x-content-type-options': 'nosniff',
      'content-security-policy': 'sandbox',
    });
    await expect(png.response.text()).resolves.toBe('x');
    expect((await call(router, 'GET', png.path, 'u2')).status).toBe(404);

    const svg = await image('image/svg+xml');
    expect(Object.fromEntries(svg.response.headers)).toMatchObject({
      'content-type': 'application/octet-stream',
      'content-disposition': 'attachment',
    });
  });
});
