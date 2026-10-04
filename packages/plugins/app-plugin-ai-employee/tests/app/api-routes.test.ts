import { Hono } from 'hono';
import { describe, expect, it, vi } from 'vitest';

import {
  AI_EMPLOYEE_RESERVED_USERNAMES,
  AI_JSON_BODY_MAX_BYTES,
  AI_RUN_BODY_MAX_BYTES,
  MCP_SERVER_RESERVED_NAMES,
  createAIEmployeeRoutes,
} from '../../server/route/index.js';
import { conversationNotFound } from '../../server/service/ai-conversation-service.js';
import { notFoundError } from '../../server/types.js';
import { AI_ROUTES, concretePath } from './route-table.js';
import { createTestAIEmployeeFixture } from './test-context.js';

type Fixture = Awaited<ReturnType<typeof createTestAIEmployeeFixture>>;

function mount({ deps, services }: Fixture): Hono {
  const app = new Hono();
  app.route(
    '/api',
    createAIEmployeeRoutes({
      authentication: deps.auth,
      authorization: deps.authorization,
      services,
      logger: deps.logging.getLogger('ai-employee-test'),
    }),
  );
  return app;
}

function registered(app: Hono): string[] {
  return [
    ...new Set(
      app.routes
        .filter((route) => route.method !== 'ALL')
        .map((route) => `${route.method} ${route.path}`),
    ),
  ];
}

function signIn(deps: Fixture['deps']): void {
  vi.spyOn(deps.auth, 'getSession').mockResolvedValue({
    user: { id: 'fixture-user' },
    session: {},
  } as never);
}

describe('AI employee HTTP routes', () => {
  it('registers exactly the routes of the route table, under /api/aiEmployees and /api/aiEmployee', async () => {
    const app = mount(await createTestAIEmployeeFixture());

    expect(registered(app).sort()).toEqual(
      AI_ROUTES.map(([method, path]) => `${method} /api${path}`).sort(),
    );
    // The middleware is scoped to the plugin's own prefixes, never to the whole of `/api`.
    expect(
      app.routes
        .filter((route) => route.method === 'ALL')
        .map((route) => route.path),
    ).toEqual(
      expect.arrayContaining(['/api/aiEmployees/*', '/api/aiEmployee/*']),
    );
    expect(
      app.routes.some(
        (route) => route.method === 'ALL' && route.path === '/api/*',
      ),
    ).toBe(false);
  });

  it('registers each fixed segment before the path parameter beside it', async () => {
    const app = mount(await createTestAIEmployeeFixture());
    const order = registered(app);
    const indexOf = (route: string) => order.indexOf(route);

    for (const [fixed, parameter] of [
      ['GET /api/aiEmployees/roster', 'GET /api/aiEmployees/:username'],
      ['GET /api/aiEmployees/templates', 'GET /api/aiEmployees/:username'],
      [
        'GET /api/aiEmployee/conversations/unreadCount',
        'GET /api/aiEmployee/conversations/:sessionId',
      ],
      [
        'GET /api/aiEmployee/mcpServers/tools',
        'GET /api/aiEmployee/mcpServers/:name',
      ],
    ]) {
      expect(indexOf(fixed), fixed).toBeGreaterThanOrEqual(0);
      expect(indexOf(fixed), fixed).toBeLessThan(indexOf(parameter));
    }
  });

  // A name chosen by a user or in config.yml sits beside these fixed segments, so each must be a reserved name.
  function fixedSegmentsBeside(collection: string): string[] {
    const pattern = new RegExp(`^${collection}/([^/:]+)$`);
    return [
      ...new Set(
        AI_ROUTES.flatMap(([, path]) => pattern.exec(path)?.slice(1) ?? []),
      ),
    ].sort();
  }

  it('reserves every fixed segment under /aiEmployees as a username', () => {
    expect(fixedSegmentsBeside('/aiEmployees')).toEqual(
      [...AI_EMPLOYEE_RESERVED_USERNAMES].sort(),
    );
  });

  it('reserves every fixed segment under /aiEmployee/mcpServers as a server name', () => {
    expect(fixedSegmentsBeside('/aiEmployee/mcpServers')).toEqual(
      [...MCP_SERVER_RESERVED_NAMES].sort(),
    );
  });

  it('has no fixed segment beside a configured LLM service name', () => {
    // Should one be added, LLM service names need the same reservation as MCP server names.
    expect(fixedSegmentsBeside('/aiEmployee/llmServices')).toEqual([]);
  });

  it('rejects every route without a session before it reaches a service', async () => {
    const fixture = await createTestAIEmployeeFixture();
    const ready = vi.spyOn(fixture.services, 'ready');
    const setEnabled = vi.spyOn(fixture.services.llmService, 'setEnabled');
    const testCandidate = vi.spyOn(
      fixture.services.mcpServerService,
      'testCandidate',
    );
    const app = mount(fixture);

    for (const [method, path] of AI_ROUTES) {
      const response = await app.request(
        `http://localhost/api${concretePath(path)}`,
        {
          method,
          headers: { 'content-type': 'application/json' },
          ...(method === 'GET' || method === 'DELETE'
            ? {}
            : {
                body: JSON.stringify({
                  name: 'intruder',
                  transport: 'stdio',
                  command: 'touch',
                }),
              }),
        },
      );
      expect(response.status, `${method} ${path}`).toBe(401);
      expect((await response.json()).error.reason).toBe(
        'AUTHENTICATION_REQUIRED',
      );
    }
    expect(ready).not.toHaveBeenCalled();
    expect(setEnabled).not.toHaveBeenCalled();
    expect(testCandidate).not.toHaveBeenCalled();
  });

  it('answers { data } with the local marker, and 404 for a method no route has', async () => {
    const fixture = await createTestAIEmployeeFixture();
    signIn(fixture.deps);
    fixture.services.ready = async () => undefined;
    // Chat routes, so the test needs no AI settings access.
    fixture.services.employeeService.listByUser = async () => [];
    fixture.services.conversationService.unreadCount = async () => ({
      count: 3,
    });
    const app = mount(fixture);

    const response = await app.request(
      'http://localhost/api/aiEmployees/roster',
    );
    expect(response.status).toBe(200);
    expect(response.headers.get('x-local-ai')).toBe('1');
    expect(await response.json()).toEqual({ data: [], meta: { total: 0 } });

    const unread = await app.request(
      'http://localhost/api/aiEmployee/conversations/unreadCount',
    );
    expect(unread.status).toBe(200);
    expect(await unread.json()).toEqual({ data: { count: 3 } });

    const wrongMethod = await app.request(
      'http://localhost/api/aiEmployees/roster',
      { method: 'POST', body: JSON.stringify({}) },
    );
    expect(wrongMethod.status).toBe(404);
  });

  it('answers a missing path resource with 404 in the standard error body', async () => {
    const fixture = await createTestAIEmployeeFixture();
    signIn(fixture.deps);
    fixture.services.ready = async () => undefined;
    vi.spyOn(fixture.services.fileService, 'preview').mockRejectedValue(
      notFoundError('AI file 42 was not found.', 'FILE_NOT_FOUND'),
    );
    const app = mount(fixture);

    const response = await app.request(
      'http://localhost/api/aiEmployee/files/42/preview',
    );
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      error: expect.objectContaining({
        code: 404,
        status: 'NOT_FOUND',
        reason: 'FILE_NOT_FOUND',
        domain: 'aiEmployees',
      }),
    });
  });

  it('rejects an invalid body before the stream opens, naming the field', async () => {
    const fixture = await createTestAIEmployeeFixture();
    signIn(fixture.deps);
    fixture.services.ready = async () => undefined;
    const sendMessages = vi.fn(async () => undefined);
    fixture.services.conversationService.sendMessages = sendMessages as never;
    fixture.services.conversationService.checkRun = vi.fn(
      async () => undefined,
    ) as never;
    const app = mount(fixture);

    const send = (model: unknown) =>
      app.request(
        'http://localhost/api/aiEmployee/conversations/session-1/send',
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ aiEmployee: 'dara', messages: [], model }),
        },
      );

    // `AgentState.model` promises every tool a resolved reference, so a partial one, or one with extra fields, is
    // refused rather than carried.
    for (const model of [
      { llmService: 'openai' },
      'gpt-5',
      { llmService: 'openai', model: 'gpt-5', reasoning: 'ignored' },
    ]) {
      const response = await send(model);
      expect(response.status).toBe(400);
      const { error } = await response.json();
      expect(error).toMatchObject({
        status: 'INVALID_ARGUMENT',
        reason: 'INVALID_INPUT',
      });
      expect(error.fieldViolations[0].field).toMatch(/^model/);
    }
    expect(sendMessages).not.toHaveBeenCalled();

    const accepted = await send({ llmService: 'openai', model: 'gpt-5' });
    expect(accepted.status).toBe(200);
    expect(accepted.headers.get('content-type')).toContain('text/event-stream');
    // The run answers over SSE, so the handler is only done once the stream is.
    await accepted.text();
    expect(sendMessages).toHaveBeenCalledOnce();
    expect(sendMessages.mock.calls[0][0]).toMatchObject({
      aiEmployee: 'dara',
      state: {
        sessionId: 'session-1',
        model: { llmService: 'openai', model: 'gpt-5' },
      },
    });
  });

  it('answers a run on a conversation that is not the caller’s with 404 before streaming', async () => {
    const fixture = await createTestAIEmployeeFixture();
    signIn(fixture.deps);
    fixture.services.ready = async () => undefined;
    const sendMessages = vi.fn(async () => undefined);
    fixture.services.conversationService.sendMessages = sendMessages as never;
    vi.spyOn(
      fixture.services.conversationService,
      'requireOwnConversation',
    ).mockRejectedValue(conversationNotFound('someone-else'));
    const app = mount(fixture);

    const response = await app.request(
      'http://localhost/api/aiEmployee/conversations/someone-else/send',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ aiEmployee: 'dara', messages: [] }),
      },
    );

    expect(response.status).toBe(404);
    expect((await response.json()).error.reason).toBe('CONVERSATION_NOT_FOUND');
    expect(sendMessages).not.toHaveBeenCalled();
  });

  it('refuses a JSON body over the limit with 413, and a run body only over its larger limit', async () => {
    const fixture = await createTestAIEmployeeFixture();
    signIn(fixture.deps);
    fixture.services.ready = async () => undefined;
    const updateUserPrompt = vi.fn(async () => ({}));
    fixture.services.employeeService.updateUserPrompt =
      updateUserPrompt as never;
    const checkRun = vi.fn(async () => undefined);
    fixture.services.conversationService.checkRun = checkRun as never;
    fixture.services.conversationService.sendMessages = vi.fn(
      async () => undefined,
    ) as never;
    const app = mount(fixture);
    const post = (path: string, body: unknown, method = 'POST') =>
      app.request(`http://localhost/api${path}`, {
        method,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });

    const tooLarge = await post(
      '/aiEmployees/dara/userPrompt',
      { prompt: 'x'.repeat(AI_JSON_BODY_MAX_BYTES) },
      'PUT',
    );
    expect(tooLarge.status).toBe(413);
    expect((await tooLarge.json()).error).toMatchObject({
      status: 'INVALID_ARGUMENT',
      reason: 'BODY_TOO_LARGE',
      domain: 'aiEmployees',
    });
    expect(updateUserPrompt).not.toHaveBeenCalled();

    const message = {
      role: 'user',
      content: { type: 'text', content: 'x'.repeat(AI_JSON_BODY_MAX_BYTES) },
    };
    const run = await post('/aiEmployee/conversations/session-1/send', {
      aiEmployee: 'dara',
      messages: [message],
    });
    expect(run.status).toBe(200);
    await run.text();
    const runTooLarge = await post('/aiEmployee/conversations/session-1/send', {
      aiEmployee: 'dara',
      messages: [
        {
          ...message,
          content: { type: 'text', content: 'x'.repeat(AI_RUN_BODY_MAX_BYTES) },
        },
      ],
    });
    expect(runTooLarge.status).toBe(413);
    expect(checkRun).toHaveBeenCalledOnce();
  });

  it('refuses unknown fields in nested request objects', async () => {
    const fixture = await createTestAIEmployeeFixture();
    signIn(fixture.deps);
    fixture.services.ready = async () => undefined;
    const create = vi.fn(async () => ({}));
    fixture.services.conversationService.create = create as never;
    const app = mount(fixture);

    const response = await app.request(
      'http://localhost/api/aiEmployee/conversations',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          aiEmployee: { username: 'dara', nickname: 'Dara' },
        }),
      },
    );
    expect(response.status).toBe(400);
    const { error } = await response.json();
    expect(error).toMatchObject({ reason: 'INVALID_INPUT' });
    expect(error.fieldViolations[0].field).toMatch(/^aiEmployee/);
    expect(create).not.toHaveBeenCalled();
  });

  it('wires each managed resource to a dedicated service instance', async () => {
    const { services } = await createTestAIEmployeeFixture();
    expect(services.employeeService.constructor.name).toBe('AIEmployeeService');
    expect(services.toolService.constructor.name).toBe('AIToolService');
    expect(services.skillService.constructor.name).toBe('AISkillService');
    expect(services.llmService.constructor.name).toBe('LLMService');
    expect(services.mcpServerService.constructor.name).toBe(
      'AIMCPServerService',
    );
    expect(services.conversationService.constructor.name).toBe(
      'AIConversationService',
    );
    expect(
      new Set([
        services.employeeService,
        services.toolService,
        services.skillService,
        services.llmService,
        services.mcpServerService,
        services.conversationService,
      ]).size,
    ).toBe(6);
  });
});
