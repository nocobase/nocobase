import { randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { authenticationToken } from '@nocobase/app-plugin-authentication/server';
import { authorizationToken } from '@nocobase/app-plugin-authorization';
import { createMigrator } from '@nocobase/db';
import { Hono } from 'hono';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { aiEmployeeApiRoutes } from '../../server/route/plugin.js';
import type { Actor } from '../../server/types.js';
import { createTestAIEmployeeFixture } from './test-context.js';

const root: Actor = { id: 'root-user', roles: ['root'], isRoot: true };
const member: Actor = { id: 'member-user', roles: ['member'], isRoot: false };
/** Owns only a sub-agent session, so the conversation center never lists them. */
const delegate = 'delegate-user';
/** Has never talked to an employee. */
const quiet = 'quiet-user';
const sessions = {
  root: randomUUID(),
  member: randomUUID(),
  scoped: randomUUID(),
  subAgent: randomUUID(),
  historical: randomUUID(),
};

describe('app-wide conversation center', async () => {
  const fixture = await createTestAIEmployeeFixture();
  const { deps, services, repositories, container } = fixture;
  let app: Hono;
  let sessionUser: { id: string | number; [key: string]: unknown } | null = {
    id: root.id,
  };

  beforeAll(async () => {
    await deps.database.connect();
    await deps.database.builder().createCollection('user', (collection) => {
      collection.string('id').notNull();
      collection.string('name').nullable();
      collection.string('username').nullable();
      collection.primary('id');
    });
    await deps.database.builder().createCollection('roles', (collection) => {
      collection.string('name').notNull();
      collection.boolean('allowNewAiEmployee').nullable();
      collection.primary('name');
    });
    await createMigrator({
      database: deps.database,
      packageName: '@nocobase/app-plugin-ai-employee',
      directory: fileURLToPath(
        new URL('../../database/migrations', import.meta.url),
      ),
    }).latest();
    await createMigrator({
      database: deps.database,
      packageName: '@nocobase/app-plugin-authorization',
      directory: join(
        dirname(
          createRequire(import.meta.url).resolve(
            '@nocobase/app-plugin-authorization/package.json',
          ),
        ),
        'database/migrations',
      ),
    }).latest();
    for (const [key, page, userId] of [
      ['system-administrator', '*', String(root.id)],
      ['ai-settings-reader', 'ai.settings', 'settings-reader'],
      ['other-settings-reader', 'users.settings', 'other-reader'],
    ]) {
      await deps.authorization.permissionSets.create({
        key,
        grants: [
          {
            resource: { type: 'page', id: page },
            actions: [{ action: 'access' }],
          },
        ],
      });
      await deps.authorization.permissionSets.assign({
        permissionSet: key,
        subject: { type: 'user', id: userId },
      });
    }
    await deps.database
      .connection()
      .query.insertInto('user')
      .values([
        { id: root.id, name: 'Root Admin', username: 'root' },
        { id: member.id, name: 'Mia Member', username: 'mia' },
        { id: delegate, name: 'Dee Delegate', username: 'dee' },
        { id: quiet, name: 'Quinn Quiet', username: 'quinn' },
      ])
      .execute();
    await repositories.aiEmployees.create({
      values: [
        { username: 'ada', nickname: 'Ada Analyst', avatar: 'avatar-ada' },
        { username: 'bob', nickname: 'Bob Builder', avatar: 'avatar-bob' },
      ],
    });
    // datetime fields use timezone-free wall-clock strings, not datetimeTz instants.
    await repositories.aiConversations.create({
      values: [
        {
          sessionId: sessions.root,
          userId: root.id,
          aiEmployeeUsername: 'ada',
          title: 'Root chat',
          category: 'chat',
          from: 'main-agent',
          read: false,
          updatedAt: '2026-09-01T00:00:00.000',
        },
        {
          sessionId: sessions.member,
          userId: member.id,
          aiEmployeeUsername: 'ada',
          title: 'Member chat',
          category: 'chat',
          from: 'main-agent',
          read: false,
          updatedAt: '2026-09-02T00:00:00.000',
        },
        {
          sessionId: sessions.scoped,
          userId: member.id,
          aiEmployeeUsername: 'bob',
          title: 'Scoped chat',
          scope: 'crm',
          category: 'chat',
          from: 'main-agent',
          read: false,
          updatedAt: '2026-09-03T00:00:00.000',
        },
        {
          sessionId: sessions.subAgent,
          userId: delegate,
          aiEmployeeUsername: 'bob',
          title: 'Delegated chat',
          scope: 'sales',
          category: 'chat',
          from: 'sub-agent',
          read: false,
          updatedAt: '2026-09-04T00:00:00.000',
        },
        {
          sessionId: sessions.historical,
          userId: member.id,
          aiEmployeeUsername: 'ada',
          title: 'Old task',
          read: false,
          category: 'task',
          from: 'main-agent',
          updatedAt: '2026-08-01T00:00:00.000',
        },
      ],
    });
    await repositories.aiMessages.create({
      values: [
        ...Array.from({ length: 12 }, (_, index) => ({
          sessionId: sessions.member,
          messageId: String(1000 + index),
          role: 'assistant' as const,
          content: { type: 'text', content: `Message ${index}` },
        })),
        {
          sessionId: sessions.scoped,
          messageId: '2000',
          role: 'assistant',
          content: { type: 'text', content: 'Scoped answer' },
        },
        {
          sessionId: sessions.subAgent,
          messageId: '3000',
          role: 'assistant',
          content: { type: 'text', content: 'Delegated answer' },
        },
        {
          sessionId: sessions.member,
          messageId: '4000',
          role: 'tool',
          content: { type: 'text', content: 'Hidden raw tool row' },
        },
      ],
    });
    await repositories.aiMessages.update({
      filter: { sessionId: sessions.member, messageId: '1011' },
      values: {
        toolCalls: [
          {
            id: 'tool-call-1',
            name: 'historical-tool',
            args: { query: 'hello' },
          },
        ],
        attachments: [
          {
            filename: 'report.txt',
            mimetype: 'text/plain',
            url: '/storage/report.txt',
          },
        ],
        metadata: {
          subAgentConversations: [
            {
              sessionId: sessions.subAgent,
              toolCallId: 'tool-call-1',
              status: 'completed',
            },
          ],
        },
      },
    });
    await repositories.aiToolMessages.create({
      values: {
        sessionId: sessions.member,
        messageId: '1011',
        toolCallId: 'tool-call-1',
        toolName: 'historical-tool',
        invokeStatus: 'done',
        status: 'success',
        content: { result: 'Stored result' },
        auto: false,
      },
    });
    vi.spyOn(deps.auth, 'getSession').mockImplementation(async () =>
      sessionUser
        ? ({
            user: { ...sessionUser },
            session: {},
          } as never)
        : null,
    );
    vi.spyOn(services, 'ready').mockResolvedValue(undefined);
    container.instance(authenticationToken, deps.auth);
    container.instance(authorizationToken, deps.authorization);
    const routes = await aiEmployeeApiRoutes.createRouter({
      appName: 'main',
      publicBasePath: '/main',
      config: { app: { name: 'main', publicBasePath: '/main' } },
      paths: deps.paths,
      router: new Hono(),
      container,
    });
    app = new Hono();
    app.route('/api', routes);
  });

  beforeEach(() => {
    sessionUser = { id: root.id };
  });
  afterAll(async () => {
    vi.restoreAllMocks();
    await deps.database.destroy();
  });

  function request(
    action: string,
    query = '',
    headers?: HeadersInit,
  ): Promise<Response> {
    return app.request(
      `/api/ai/aiConversations:${action}${query ? `?${query}` : ''}`,
      { headers },
    );
  }

  async function listed(query = ''): Promise<{
    rows: { sessionId: string }[];
    count: number;
    page: number;
    totalPages: number;
  }> {
    const response = await request('listAll', query);
    expect(response.status, query).toBe(200);
    return response.json();
  }

  function sessionIds(result: { rows: { sessionId: string }[] }): string[] {
    return result.rows.map((row) => row.sessionId);
  }

  it('lists main chats across users, scopes and categories with bounded stable pagination', async () => {
    const response = await request('listAll');
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      rows: [
        { sessionId: sessions.scoped, userId: member.id, scope: 'crm' },
        { sessionId: sessions.member },
        { sessionId: sessions.root },
        { sessionId: sessions.historical, category: 'task' },
      ],
      count: 4,
      page: 1,
      pageSize: 20,
      totalPages: 1,
    });
    const secondPage = await request('listAll', 'page=2&pageSize=2');
    expect(await secondPage.json()).toMatchObject({
      rows: [{ sessionId: sessions.root }, { sessionId: sessions.historical }],
      count: 4,
      page: 2,
      pageSize: 2,
      totalPages: 2,
    });
    expect(
      await (await request('listAll', 'page=3&pageSize=2')).json(),
    ).toMatchObject({ rows: [], count: 4 });
    expect((await request('listAll', 'pageSize=100')).status).toBe(200);
  });

  it('leaves sub-agent sessions to the main conversation that embeds them', async () => {
    expect(sessionIds(await listed())).not.toContain(sessions.subAgent);
    expect(await listed(`userId=${delegate}`)).toMatchObject({
      rows: [],
      count: 0,
    });
  });

  it('names each row owner and employee from two batched reads', async () => {
    const employees = vi.spyOn(repositories.aiEmployees, 'find');
    const { rows } = await listed();
    expect(employees).toHaveBeenCalledOnce();
    expect(employees.mock.calls[0]?.[0]?.filter).toEqual({
      username: expect.arrayContaining(['ada', 'bob']),
    });
    employees.mockRestore();
    expect(rows[0]).toMatchObject({
      sessionId: sessions.scoped,
      user: { id: member.id, name: 'Mia Member', username: 'mia' },
      aiEmployee: {
        username: 'bob',
        nickname: 'Bob Builder',
        avatar: 'avatar-bob',
      },
    });
    expect(rows[2]).toMatchObject({
      sessionId: sessions.root,
      user: { id: root.id, name: 'Root Admin', username: 'root' },
      aiEmployee: { username: 'ada', nickname: 'Ada Analyst' },
    });
    expect(await listed('keyword=missing')).toEqual({
      rows: [],
      count: 0,
      page: 1,
      pageSize: 20,
      totalPages: 0,
    });
  });

  it('combines user, employee and title filters before counting and paginating', async () => {
    expect(sessionIds(await listed(`userId=${member.id}`))).toEqual([
      sessions.scoped,
      sessions.member,
      sessions.historical,
    ]);
    expect(sessionIds(await listed('aiEmployeeUsername=ada'))).toEqual([
      sessions.member,
      sessions.root,
      sessions.historical,
    ]);
    expect(
      await listed(`userId=${member.id}&aiEmployeeUsername=ada`),
    ).toMatchObject({
      rows: [
        { sessionId: sessions.member },
        { sessionId: sessions.historical },
      ],
      count: 2,
    });
    expect(
      sessionIds(
        await listed(`userId=${member.id}&aiEmployeeUsername=ada&keyword=Old`),
      ),
    ).toEqual([sessions.historical]);
    expect(
      sessionIds(await listed(`aiEmployeeUsername=bob&keyword=chat`)),
    ).toEqual([sessions.scoped]);
    expect(await listed(`userId=${member.id}&pageSize=2&page=2`)).toMatchObject(
      {
        rows: [{ sessionId: sessions.historical }],
        count: 3,
        page: 2,
        totalPages: 2,
      },
    );
    expect(
      await listed(`userId=${root.id}&aiEmployeeUsername=bob`),
    ).toMatchObject({ rows: [], count: 0, totalPages: 0 });
    expect(await listed(`userId=${quiet}`)).toMatchObject({ count: 0 });
    expect(await listed('aiEmployeeUsername=nobody')).toMatchObject({
      count: 0,
    });
  });

  it('suggests only users who own a main conversation, by name or username', async () => {
    async function users(query = ''): Promise<unknown> {
      const response = await request('listUsers', query);
      expect(response.status, query).toBe(200);
      return response.json();
    }
    expect(await users()).toEqual({
      rows: [
        { id: member.id, name: 'Mia Member', username: 'mia' },
        { id: root.id, name: 'Root Admin', username: 'root' },
      ],
    });
    expect(await users('keyword=Root')).toEqual({
      rows: [{ id: root.id, name: 'Root Admin', username: 'root' }],
    });
    expect(await users('keyword=mia')).toEqual({
      rows: [{ id: member.id, name: 'Mia Member', username: 'mia' }],
    });
    expect(await users(`userId=${member.id}`)).toEqual({
      rows: [{ id: member.id, name: 'Mia Member', username: 'mia' }],
    });
    expect(await users('limit=1')).toEqual({
      rows: [{ id: member.id, name: 'Mia Member', username: 'mia' }],
    });
    for (const query of [
      'keyword=Quinn',
      'keyword=Dee',
      `userId=${quiet}`,
      `userId=${delegate}`,
      'keyword=%27%20OR%201%3D1--',
    ]) {
      expect(await users(query), query).toEqual({ rows: [] });
    }
  });

  it('filters titles in the database before counting and paginating', async () => {
    expect(
      await (await request('listAll', 'keyword=Scoped&pageSize=1')).json(),
    ).toMatchObject({
      rows: [{ sessionId: sessions.scoped }],
      count: 1,
      totalPages: 1,
    });
    expect(
      await (await request('listAll', 'keyword=missing')).json(),
    ).toMatchObject({ rows: [], count: 0, totalPages: 0 });
    expect(
      await (await request('listAll', 'keyword=%27%20OR%201%3D1--')).json(),
    ).toMatchObject({ rows: [], count: 0 });
  });

  it('reads other users and scopes using the existing message format and cursor, without writes', async () => {
    const before = await repositories.aiConversations.find();
    const messagesBefore = await repositories.aiMessages.find();
    const update = vi.spyOn(repositories.aiConversations, 'update');
    const agent = vi.spyOn(services.conversationService, 'sendMessages');
    const response = await request(
      'getAllMessages',
      `sessionId=${sessions.member}&updateRead=true&paginate=false`,
    );
    expect(response.status).toBe(200);
    const first = await response.json();
    expect(first).toMatchObject({ hasMore: true, cursor: '1002' });
    expect(first.rows).toHaveLength(10);
    expect(first.rows[0]).toMatchObject({
      key: '1011',
      content: {
        attachments: [{ filename: 'report.txt' }],
        tool_calls: [
          {
            id: 'tool-call-1',
            invokeStatus: 'done',
            status: 'success',
            content: { result: 'Stored result' },
          },
        ],
        subAgentConversations: [
          { sessionId: sessions.subAgent, messages: [{ key: '3000' }] },
        ],
      },
    });
    const personal = await services.conversationService.getMessages({
      actorId: member.id,
      options: { sessionId: sessions.member },
    });
    expect(first).toEqual(JSON.parse(JSON.stringify(personal)));
    const second = await request(
      'getAllMessages',
      `sessionId=${sessions.member}&cursor=${first.cursor}`,
    );
    expect(await second.json()).toMatchObject({
      rows: [expect.any(Object), expect.any(Object)],
      hasMore: false,
      cursor: '1000',
    });
    expect(
      await (
        await request(
          'getAllMessages',
          `sessionId=${sessions.member}&cursor=1000`,
        )
      ).json(),
    ).toEqual({ rows: [], hasMore: false, cursor: null });
    for (const sessionId of [sessions.scoped, sessions.subAgent]) {
      expect(
        await (
          await request('getAllMessages', `sessionId=${sessionId}`)
        ).json(),
      ).toMatchObject({ rows: [expect.any(Object)], hasMore: false });
    }
    expect(update).not.toHaveBeenCalled();
    expect(agent).not.toHaveBeenCalled();
    expect(await repositories.aiConversations.find()).toEqual(before);
    expect(await repositories.aiMessages.find()).toEqual(messagesBefore);
    update.mockRestore();
    agent.mockRestore();
  });

  it('rejects anonymous sessions before querying', async () => {
    sessionUser = null;
    const find = vi.spyOn(repositories.aiConversations, 'find');
    for (const action of ['listAll', 'listUsers', 'getAllMessages']) {
      const response = await request(action);
      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      });
    }
    expect(find).not.toHaveBeenCalled();
    find.mockRestore();
  });

  it('forbids ungranted users regardless of session extras, query flags, or headers', async () => {
    const find = vi.spyOn(repositories.aiConversations, 'find');
    const listAll = vi.spyOn(services.conversationService, 'listAll');
    const getAllMessages = vi.spyOn(
      services.conversationService,
      'getAllMessages',
    );
    for (const forbidden of [
      { id: member.id },
      { id: 'other-reader' },
      {
        id: member.id,
        roles: ['root'],
        isRoot: true,
        canReadAllConversations: true,
      },
    ]) {
      sessionUser = forbidden;
      for (const [action, query] of [
        ['listAll', 'page=invalid&isRoot=true&canReadAllConversations=true'],
        ['listAll', `userId=${member.id}&aiEmployeeUsername=ada`],
        ['listUsers', 'keyword=mia'],
        ['getAllMessages', `sessionId=${sessions.member}`],
      ]) {
        const response = await request(action, query, {
          'x-user-id': String(root.id),
          'x-role': 'root',
          'x-is-root': 'true',
          'x-can-read-all-conversations': 'true',
        });
        expect(response.status).toBe(403);
        expect(await response.json()).toEqual({
          errors: [{ message: 'AI settings access is required' }],
          error: 'AI settings access is required',
        });
      }
    }
    expect(find).not.toHaveBeenCalled();
    expect(listAll).not.toHaveBeenCalled();
    expect(getAllMessages).not.toHaveBeenCalled();
    find.mockRestore();
    listAll.mockRestore();
    getAllMessages.mockRestore();
  });

  it.each([String(root.id), 'settings-reader'])(
    'allows %s through permission sets with only a session user id',
    async (id) => {
      sessionUser = { id };
      const listAll = vi.spyOn(services.conversationService, 'listAll');
      const getAllMessages = vi.spyOn(
        services.conversationService,
        'getAllMessages',
      );
      expect((await request('listAll')).status).toBe(200);
      expect((await request('listUsers')).status).toBe(200);
      expect(
        (await request('getAllMessages', `sessionId=${sessions.member}`))
          .status,
      ).toBe(200);
      const authorizedActor = { id, canReadAllConversations: true };
      expect(listAll).toHaveBeenCalledWith(
        expect.objectContaining({ actor: authorizedActor }),
      );
      expect(getAllMessages).toHaveBeenCalledWith(
        expect.objectContaining({ actor: authorizedActor }),
      );
      expect(listAll.mock.calls[0][0].actor).toEqual(authorizedActor);
      listAll.mockRestore();
      getAllMessages.mockRestore();
    },
  );

  it('rechecks permission assignments on each request', async () => {
    sessionUser = { id: 'temporary-reader' };
    const assignment = await deps.authorization.permissionSets.assign({
      permissionSet: 'ai-settings-reader',
      subject: { type: 'user', id: 'temporary-reader' },
    });
    expect((await request('listAll')).status).toBe(200);
    expect((await request('listUsers')).status).toBe(200);
    expect(
      (await request('getAllMessages', `sessionId=${sessions.member}`)).status,
    ).toBe(200);
    await deps.authorization.permissionSets.revoke(assignment.id);
    expect((await request('listAll')).status).toBe(403);
    expect((await request('listUsers')).status).toBe(403);
    expect(
      (await request('getAllMessages', `sessionId=${sessions.member}`)).status,
    ).toBe(403);
  });

  it('also requires the explicit conversation capability on direct service calls', async () => {
    for (const forbidden of [
      member,
      root,
      { id: root.id, canReadAllConversations: false },
      { id: 'anonymous', canReadAllConversations: true },
      { id: '', canReadAllConversations: true },
    ]) {
      await expect(
        services.conversationService.listAll({ actor: forbidden }),
      ).rejects.toMatchObject({ status: 403 });
      await expect(
        services.conversationService.listConversationUsers({
          actor: forbidden,
        }),
      ).rejects.toMatchObject({ status: 403 });
      await expect(
        services.conversationService.getAllMessages({
          actor: forbidden,
          sessionId: sessions.member,
        }),
      ).rejects.toMatchObject({ status: 403 });
    }
  });

  it.each([String(root.id), 'settings-reader'])(
    'keeps personal endpoints owner-scoped for authorized reader %s',
    async (id) => {
      sessionUser = { id };
      expect(
        await (await request('list', 'userId=member-user')).json(),
      ).toEqual(
        id === root.id
          ? [expect.objectContaining({ sessionId: sessions.root })]
          : [],
      );
      expect(
        (
          await request(
            'getMessages',
            `sessionId=${sessions.member}&updateRead=true`,
          )
        ).status,
      ).toBe(400);
      await expect(
        services.conversationService.update({
          actorId: id,
          sessionId: sessions.member,
          input: { title: 'Unauthorized change' },
        }),
      ).rejects.toThrow('invalid sessionId');
      await services.conversationService.destroy({
        actorId: id,
        options: { sessionId: sessions.member },
      });
      expect(
        await repositories.aiConversations.findOne({
          filter: { sessionId: sessions.member },
        }),
      ).toMatchObject({ title: 'Member chat', read: false });
      expect(
        await (await request('get', `sessionId=${sessions.member}`)).json(),
      ).toEqual({ llmActiveState: 'idle' });
      sessionUser = { id: member.id };
      const personal = await request('list');
      expect(
        (await personal.json())
          .map((row: { sessionId: string }) => row.sessionId)
          .sort(),
      ).toEqual([sessions.member, sessions.scoped].sort());
      expect(
        (await request('getMessages', `sessionId=${sessions.member}`)).status,
      ).toBe(200);
      expect(
        (await request('getMessages', `sessionId=${sessions.root}`)).status,
      ).toBe(400);
      const scoped = await services.conversationService.list({
        actorId: member.id,
        scope: 'crm',
      });
      expect(scoped.map((row) => row.sessionId)).toEqual([sessions.scoped]);
    },
  );

  it('rejects invalid pagination and ambiguous query values', async () => {
    for (const query of [
      'page=10001',
      'page=0',
      'page=-1',
      'page=1.5',
      'page=NaN',
      'page=',
      'page=1e2',
      'page=9007199254740992',
      'page=9007199254740991&pageSize=100',
      'pageSize=0',
      'pageSize=101',
      'pageSize=-2',
      'pageSize=1.5',
      'pageSize=Infinity',
      'pageSize=',
      'page=1&page=2',
      'keyword=a&keyword=b',
      `keyword=${'a'.repeat(201)}`,
      'userId=',
      'userId=%20',
      'userId=a%20b',
      'userId=a%0Ab',
      `userId=${'a'.repeat(256)}`,
      'userId=a&userId=b',
      'aiEmployeeUsername=',
      'aiEmployeeUsername=%09',
      `aiEmployeeUsername=${'a'.repeat(256)}`,
      'aiEmployeeUsername=ada&aiEmployeeUsername=bob',
    ]) {
      expect((await request('listAll', query)).status, query).toBe(400);
    }
    for (const query of [
      'limit=0',
      'limit=51',
      'limit=1.5',
      'limit=',
      'limit=1&limit=2',
      'keyword=a&keyword=b',
      `keyword=${'a'.repeat(201)}`,
      'userId=',
      'userId=a%20b',
      `userId=${'a'.repeat(256)}`,
      'userId=a&userId=b',
    ]) {
      expect((await request('listUsers', query)).status, query).toBe(400);
    }
    for (const query of [
      '',
      'sessionId=',
      'sessionId=%20',
      'sessionId=not-a-uuid',
      `sessionId=${sessions.member}&cursor=not-a-number`,
      `sessionId=${sessions.member}&cursor=-1`,
      `sessionId=${sessions.member}&cursor=1.5`,
      `sessionId=${sessions.member}&cursor=9223372036854775808`,
      `sessionId=${sessions.member}&cursor=1e3`,
      `sessionId=${'a'.repeat(256)}`,
      `sessionId=${sessions.member}&cursor=`,
      `sessionId=${sessions.member}&cursor=%20`,
      `sessionId=${sessions.member}&cursor=${'a'.repeat(256)}`,
      `sessionId=${sessions.member}&cursor=a&cursor=b`,
      `sessionId=${sessions.member}&sessionId=${sessions.root}`,
    ]) {
      expect((await request('getAllMessages', query)).status, query).toBe(400);
    }
  });

  it('returns 404 for missing sessions and reads empty sessions of any category', async () => {
    expect(
      (await request('getAllMessages', `sessionId=${randomUUID()}`)).status,
    ).toBe(404);
    for (const sessionId of [sessions.root, sessions.historical]) {
      const response = await request(
        'getAllMessages',
        `sessionId=${sessionId}`,
      );
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({
        rows: [],
        hasMore: false,
        cursor: null,
      });
    }
  });
});
