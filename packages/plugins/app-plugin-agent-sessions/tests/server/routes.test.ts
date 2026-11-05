import { BRIDGE_PROTOCOL_VERSION } from '@nocobase/acp-bridge/protocol';
import { randomUUID } from 'node:crypto';
import { authenticationToken } from '@nocobase/app-plugin-authentication';
import {
  findApiDocumentSchemaProblems,
  findUndeclaredApiRoutes,
  generateApiDocument,
  inspectApiRoutes,
} from '@nocobase/app-server/router';
import type { DatabaseManager } from '@nocobase/db';
import { ServiceContainer } from '@nocobase/service-provider';
import { Hono, type MiddlewareHandler } from 'hono';
import { I18nRuntime, createI18nMiddleware } from '@nocobase/i18n/server';
import locales from '../../server/locales/index.js';
import enUS from '../../server/locales/en-US.js';
import zhCN from '../../server/locales/zh-CN.js';
import { AGENT_SESSIONS_NAMESPACE } from '../../server/errors.js';
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
  options: { readonly images?: ImageStorage; readonly locale?: string } = {},
): Promise<Hono> {
  const required =
    (options?: { readonly scopedKeys?: boolean }): MiddlewareHandler =>
    async (context, next) => {
      const id = context.req.header('x-user');
      if (!id)
        return context.json(
          { error: { reason: 'AUTHENTICATION_REQUIRED' } },
          401,
        );
      const computer = context.req.header('x-computer');
      if (
        computer &&
        !options?.scopedKeys &&
        !context.req.path.includes('/agentSessions/bridge/')
      )
        return context.json(
          { error: { reason: 'SCOPED_CREDENTIAL_FORBIDDEN' } },
          403,
        );
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
  const router = apiRoutes.createRouter({ container } as never);
  if (!options.locale) return router;
  const runtime = new I18nRuntime({
    defaultLocale: options.locale,
    locales: ['en-US', 'zh-CN'],
  });
  runtime.registerNamespace(AGENT_SESSIONS_NAMESPACE, locales);
  await runtime.init(options.locale);
  return new Hono().use('*', createI18nMiddleware(runtime)).route('/', router);
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
  test('protects withdrawal, claim and removal acknowledgement with ownership and computer identity', async ({
    database,
  }) => {
    const router = await mount(database);
    const generation = {
      protocol: BRIDGE_PROTOCOL_VERSION,
      bridgeStartedAt: 'withdrawal',
    };
    const {
      data: { computerId },
    } = await (
      await call(router, 'POST', '/bridge/register', 'u1', {
        ...generation,
        computerId: null,
        computer,
      })
    ).json();
    const { data: session } = await (
      await call(router, 'POST', '/sessions', 'u1', {
        computerId,
        agentId: 'codex',
        cwd: '/home/zhou',
        content: [{ type: 'text', text: 'Queued' }],
      })
    ).json();
    const { data: transcript } = await (
      await call(router, 'GET', `/sessions/${session.id}/events`, 'u1')
    ).json();
    const prompt = transcript[0];
    const route = `/sessions/${session.id}/withdraw`;
    expect(
      (await call(router, 'POST', route, undefined, { seq: prompt.seq }))
        .status,
    ).toBe(401);
    expect(
      (await call(router, 'POST', route, 'u2', { seq: prompt.seq })).status,
    ).toBe(404);
    expect((await call(router, 'POST', route, 'u1', { seq: 0 })).status).toBe(
      400,
    );
    expect(
      (await call(router, 'POST', route, 'u1', { seq: prompt.seq }, computerId))
        .status,
    ).toBe(403);
    const request = {
      ...generation,
      computerId,
      sessionId: session.id,
      seq: prompt.seq,
      promptId: prompt.promptId,
    };
    expect(
      (await call(router, 'POST', '/bridge/claim', undefined, request)).status,
    ).toBe(401);
    expect(
      (await call(router, 'POST', '/bridge/claim', 'u2', request)).status,
    ).toBe(404);
    expect(
      (
        await call(
          router,
          'POST',
          '/bridge/withdrawn',
          'u1',
          request,
          'another',
        )
      ).status,
    ).toBe(404);
    expect(
      (await call(router, 'POST', route, 'u1', { seq: prompt.seq })).status,
    ).toBe(204);
    expect(
      await (
        await call(router, 'POST', '/bridge/claim', 'u1', request, computerId)
      ).json(),
    ).toEqual({ data: { execute: false } });
    expect(
      (
        await call(
          router,
          'POST',
          '/bridge/withdrawn',
          'u1',
          request,
          computerId,
        )
      ).status,
    ).toBe(200);
    expect(
      (
        await call(
          router,
          'POST',
          '/bridge/withdrawn',
          'u1',
          request,
          computerId,
        )
      ).status,
    ).toBe(200);
  });
  test('validates submission IDs, protects confirmation ownership and hides internal metadata', async ({
    database,
  }) => {
    const router = await mount(database);
    const registered = await call(router, 'POST', '/bridge/register', 'u1', {
      protocol: BRIDGE_PROTOCOL_VERSION,
      computerId: null,
      bridgeStartedAt: 'one',
      computer,
    });
    const {
      data: { computerId },
    } = await registered.json();
    const input = {
      computerId,
      agentId: 'codex',
      cwd: '/home/zhou',
      content: [{ type: 'text', text: 'Hello' }],
      submissionId: randomUUID(),
    };
    expect(
      (await call(router, 'POST', '/sessions', undefined, input)).status,
    ).toBe(401);
    expect(
      (
        await call(router, 'POST', '/sessions', 'u1', {
          ...input,
          submissionId: 'invalid',
        })
      ).status,
    ).toBe(400);
    const first = await call(router, 'POST', '/sessions', 'u1', input);
    expect(first.status).toBe(201);
    const { data: session } = await first.json();
    const repeated = await call(router, 'POST', '/sessions', 'u1', input);
    expect((await repeated.json()).data.id).toBe(session.id);
    const stranger = await call(router, 'POST', '/sessions', 'u2', input);
    expect(stranger.status).toBe(409);
    expect(JSON.stringify(await stranger.json())).not.toContain(session.id);
    const prompt = { content: input.content, submissionId: randomUUID() };
    const route = `/sessions/${session.id}/prompt`;
    const sent = await call(router, 'POST', route, 'u1', prompt);
    const confirmation = await sent.json();
    expect(sent.status).toBe(200);
    expect(
      await (await call(router, 'POST', route, 'u1', prompt)).json(),
    ).toEqual(confirmation);
    const conflict = await call(router, 'POST', route, 'u1', {
      ...prompt,
      content: [{ type: 'text', text: 'Changed' }],
    });
    expect(conflict.status).toBe(409);
    expect((await conflict.json()).error.reason).toBe(
      'AGENT_SESSIONS_SUBMISSION_CONFLICT',
    );
    const transcript = await call(
      router,
      'GET',
      `/sessions/${session.id}/events`,
      'u1',
    );
    expect(JSON.stringify(await transcript.json())).not.toContain(
      '_submission',
    );
  });
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
          {
            computerId,
            wait: false,
            protocol: BRIDGE_PROTOCOL_VERSION,
            bridgeStartedAt: 'bridge-1',
          },
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
    const discovery = {
      status: 'available',
      choices: [
        {
          id: 'agent',
          name: 'n'.repeat(201),
          currentValue: 'web-fetch',
          options: [
            {
              value: 'web-fetch',
              name: 'Web fetch',
              description: 'w'.repeat(1944),
            },
            { value: 'v'.repeat(201), name: 'Invalid' },
            { value: 'other', name: 'Other' },
          ],
        },
      ],
    };
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
    expect(await (await pending).json()).toEqual({
      data: {
        status: 'available',
        choices: [
          {
            id: 'agent',
            name: 'n'.repeat(200),
            currentValue: 'web-fetch',
            options: [
              {
                value: 'web-fetch',
                name: 'Web fetch',
                description: 'w'.repeat(1000),
              },
              { value: 'other', name: 'Other' },
            ],
          },
        ],
      },
    });
  });
  test('accepts old bridge state with long display text and discards invalid identifiers without weakening ownership', async ({
    database,
  }) => {
    const router = await mount(database);
    const {
      data: { computerId },
    } = await (
      await call(router, 'POST', '/bridge/register', 'u1', {
        protocol: BRIDGE_PROTOCOL_VERSION,
        computerId: null,
        bridgeStartedAt: 'bridge-1',
        computer,
      })
    ).json();
    const { data: session } = await (
      await call(router, 'POST', '/sessions', 'u1', {
        computerId,
        agentId: 'codex',
        cwd: '/home/zhou',
        content: [{ type: 'text', text: 'Hello' }],
      })
    ).json();
    const input = {
      computerId,
      sessionId: session.id,
      batch: 1,
      bridgeStartedAt: 'bridge-1',
      events: [],
      state: {
        acpSessionId: 's1',
        agent: 'test agent',
        commands: [],
        title: null,
        context: null,
        choices: [
          {
            id: 'bad',
            name: 'Bad',
            currentValue: 'v'.repeat(201),
            options: [],
          },
          {
            id: 'mode',
            name: 'n'.repeat(201),
            currentValue: 'ask',
            options: [
              { value: 'ask', name: 'Ask', description: 'w'.repeat(1944) },
              { value: 'v'.repeat(201), name: 'Invalid' },
              { value: 'full', name: 'Full access' },
            ],
          },
        ],
      },
    };
    expect(
      (await call(router, 'POST', '/bridge/report', undefined, input)).status,
    ).toBe(401);
    expect(
      (await call(router, 'POST', '/bridge/report', 'u2', input)).status,
    ).toBe(404);
    expect(
      (await call(router, 'POST', '/bridge/report', 'u1', input, computerId))
        .status,
    ).toBe(200);
    const { data: saved } = await (
      await call(router, 'GET', `/sessions/${session.id}`, 'u1')
    ).json();
    expect(saved.state.choices).toEqual([
      {
        id: 'mode',
        name: 'n'.repeat(200),
        currentValue: 'ask',
        options: [
          { value: 'ask', name: 'Ask', description: 'w'.repeat(1000) },
          { value: 'full', name: 'Full access' },
        ],
      },
    ]);
  });

  for (const [locale, message] of [
    ['en-US', enUS.errors.discoveryFailed],
    ['zh-CN', zhCN.errors.discoveryFailed],
  ]) {
    test(`gives recovery steps before the CLI discovery error in ${locale}`, async ({
      database,
    }) => {
      const router = await mount(database, { locale });
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
      const pending = call(
        router,
        'POST',
        `/computers/${computerId}/discoverChoices`,
        'u1',
        { agentId: 'codex', cwd: '/home/zhou', settings: {} },
      );
      let requestId = '';
      await vi.waitFor(async () => {
        const { data } = (await (
          await call(
            router,
            'POST',
            '/bridge/poll',
            'u1',
            {
              computerId,
              wait: false,
              protocol: BRIDGE_PROTOCOL_VERSION,
              bridgeStartedAt: 'bridge-1',
            },
            computerId,
          )
        ).json()) as {
          data: { commands: { type: string; requestId: string }[] };
        };
        requestId =
          data.commands.find((command) => command.type === 'discoverChoices')
            ?.requestId ?? '';
        expect(requestId).not.toBe('');
      });
      const detail = 'Invalid Skill installation record: skills.json';
      await call(
        router,
        'POST',
        '/bridge/reply',
        'u1',
        {
          computerId,
          requestId,
          listing: null,
          discovery: null,
          error: detail,
        },
        computerId,
      );
      const response = await pending;
      expect(response.status).toBe(400);
      const body = (await response.json()) as {
        error: {
          reason: string;
          localizedMessage: { locale: string; message: string };
        };
      };
      expect(body.error.reason).toBe('AGENT_SESSIONS_DISCOVERY_FAILED');
      expect(body.error.localizedMessage).toEqual({
        locale,
        message: `${message} ${detail}`,
      });
    });
  }

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

  test('refuse an older bridge with the protocols they speak, and show its computer as outdated until it registers', async ({
    database,
  }) => {
    const router = await mount(database);
    const register = (protocol: number, computerId: string | null) =>
      call(router, 'POST', '/bridge/register', 'u1', {
        protocol,
        computerId,
        bridgeStartedAt: 'bridge-1',
        computer,
      });
    const { computerId } = (
      (await (await register(BRIDGE_PROTOCOL_VERSION, null)).json()) as {
        data: { computerId: string };
      }
    ).data;

    const old = BRIDGE_PROTOCOL_VERSION - 1;
    const refused = await register(old, computerId);
    expect(refused.status).toBe(400);
    expect(
      ((await refused.json()) as { error: Record<string, unknown> }).error,
    ).toMatchObject({
      status: 'FAILED_PRECONDITION',
      reason: 'AGENT_SESSIONS_UPGRADE_REQUIRED',
      domain: 'agentSessions',
      metadata: {
        bridgeProtocol: old,
        protocol: BRIDGE_PROTOCOL_VERSION,
        supportedProtocols: [BRIDGE_PROTOCOL_VERSION],
      },
    });
    const listed = async () =>
      (
        (await (await call(router, 'GET', '/computers', 'u1')).json()) as {
          data: Record<string, unknown>[];
        }
      ).data;
    expect((await listed())[0]).toMatchObject({
      outdatedBridge: {
        host: computer.host,
        bridgeProtocol: old,
        protocol: BRIDGE_PROTOCOL_VERSION,
      },
    });

    // A newer bridge than the application is the application's to update: its computer is not marked.
    expect(
      (await register(BRIDGE_PROTOCOL_VERSION + 1, computerId)).status,
    ).toBe(400);
    expect((await register(BRIDGE_PROTOCOL_VERSION, computerId)).status).toBe(
      200,
    );
    expect((await listed())[0]).not.toHaveProperty('outdatedBridge');
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
        {
          computerId,
          wait: false,
          protocol: BRIDGE_PROTOCOL_VERSION,
          bridgeStartedAt: 'bridge-1',
        },
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

test('session work authenticates its owner and returns an empty session without writes', async ({
  database,
}) => {
  const router = await mount(database);
  const service = new AgentSessionsService({ database });
  const { computerId } = await service.register('u1', {
    protocol: BRIDGE_PROTOCOL_VERSION,
    computerId: null,
    computer: {
      name: 'Laptop',
      platform: 'linux',
      arch: 'x64',
      host: 'test',
      roots: ['/workspace'],
      agents: [{ id: 'codex', name: 'Codex', version: 'test' }],
    },
  });
  const session = await service.createSession(
    { userId: 'u1' },
    {
      computerId,
      agentId: 'codex',
      cwd: '/workspace',
      content: [{ type: 'text', text: 'Plan' }],
    },
  );
  const path = `/sessions/${session.id}/work`;
  expect((await call(router, 'GET', path)).status).toBe(401);
  expect((await call(router, 'GET', path, 'u2')).status).toBe(404);
  const own = await call(router, 'GET', path, 'u1');
  expect(own.status).toBe(200);
  expect(await own.json()).toEqual({ data: [] });
});

test('lists the sessions tied to one record, the viewer’s own only, and refuses a malformed record', async ({
  database,
}) => {
  const router = await mount(database);
  const service = new AgentSessionsService({ database });
  const { computerId } = await service.register('u1', {
    protocol: BRIDGE_PROTOCOL_VERSION,
    computerId: null,
    computer: {
      name: 'Laptop',
      platform: 'linux',
      arch: 'x64',
      host: 'test',
      roots: ['/workspace'],
      agents: [{ id: 'codex', name: 'Codex', version: 'test' }],
    },
  });
  await service.createSession(
    { userId: 'u1' },
    {
      computerId,
      agentId: 'codex',
      cwd: '/workspace',
      content: [{ type: 'text', text: 'Plan' }],
    },
  );
  const path = '/sessions?linked=issue:7';
  expect((await call(router, 'GET', path)).status).toBe(401);
  for (const linked of ['issue', ':7', 'issue:', 'issue:7 8', '1issue:7'])
    expect(
      (
        await call(
          router,
          'GET',
          `/sessions?linked=${encodeURIComponent(linked)}`,
          'u1',
        )
      ).status,
    ).toBe(400);
  const none = await call(router, 'GET', path, 'u1');
  expect(none.status).toBe(200);
  expect((await none.json()).data).toEqual([]);
});
