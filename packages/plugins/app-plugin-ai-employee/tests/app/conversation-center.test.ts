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

  const LIST = 'managedConversations';
  const OWNERS = 'conversationOwners';
  const OWN = 'conversations';
  const managedMessages = (sessionId: string): string =>
    `managedConversations/${encodeURIComponent(sessionId)}/messages`;
  const own = (sessionId: string): string =>
    `conversations/${encodeURIComponent(sessionId)}`;

  /** `path` is relative to `/api/aiEmployee`. */
  function request(
    path: string,
    query = '',
    headers?: HeadersInit,
  ): Promise<Response> {
    return app.request(`/api/aiEmployee/${path}${query ? `?${query}` : ''}`, {
      headers,
    });
  }

  /** The conversation center list: its rows, and the paging facts its `meta` reports. */
  async function listed(query = ''): Promise<{
    rows: { sessionId: string }[];
    count: number;
    page: number;
    pageSize: number;
  }> {
    const response = await request(LIST, query);
    expect(response.status, query).toBe(200);
    const { data, meta } = await response.json();
    return {
      rows: data,
      count: meta.total,
      page: meta.page,
      pageSize: meta.pageSize,
    };
  }

  /** One page of a conversation's history, newest first, and the token of the next older page. */
  async function history(
    sessionId: string,
    query = '',
  ): Promise<{ rows: Record<string, unknown>[]; nextPageToken?: string }> {
    const response = await request(managedMessages(sessionId), query);
    expect(response.status, query).toBe(200);
    const { data, meta } = await response.json();
    return { rows: data, nextPageToken: meta.nextPageToken };
  }

  function sessionIds(result: { rows: { sessionId: string }[] }): string[] {
    return result.rows.map((row) => row.sessionId);
  }

  it('lists main chats across users, scopes and categories with bounded stable pagination', async () => {
    const response = await request(LIST);
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      data: [
        { sessionId: sessions.scoped, userId: member.id, scope: 'crm' },
        { sessionId: sessions.member },
        { sessionId: sessions.root },
        { sessionId: sessions.historical, category: 'task' },
      ],
      meta: { total: 4, page: 1, pageSize: 20 },
    });
    expect(await listed('page=2&pageSize=2')).toMatchObject({
      rows: [{ sessionId: sessions.root }, { sessionId: sessions.historical }],
      count: 4,
      page: 2,
      pageSize: 2,
    });
    expect(await listed('page=3&pageSize=2')).toMatchObject({
      rows: [],
      count: 4,
    });
    expect((await request(LIST, 'pageSize=100')).status).toBe(200);
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
    expect(await listed('q=missing')).toEqual({
      rows: [],
      count: 0,
      page: 1,
      pageSize: 20,
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
        await listed(`userId=${member.id}&aiEmployeeUsername=ada&q=Old`),
      ),
    ).toEqual([sessions.historical]);
    expect(sessionIds(await listed(`aiEmployeeUsername=bob&q=chat`))).toEqual([
      sessions.scoped,
    ]);
    expect(await listed(`userId=${member.id}&pageSize=2&page=2`)).toMatchObject(
      {
        rows: [{ sessionId: sessions.historical }],
        count: 3,
        page: 2,
      },
    );
    expect(
      await listed(`userId=${root.id}&aiEmployeeUsername=bob`),
    ).toMatchObject({ rows: [], count: 0 });
    expect(await listed(`userId=${quiet}`)).toMatchObject({ count: 0 });
    expect(await listed('aiEmployeeUsername=nobody')).toMatchObject({
      count: 0,
    });
  });

  it('suggests only users who own a main conversation, by name or username', async () => {
    async function users(query = ''): Promise<unknown> {
      const response = await request(OWNERS, query);
      expect(response.status, query).toBe(200);
      return response.json();
    }
    const page = (total: number, pageSize = 20, number = 1) => ({
      page: number,
      pageSize,
      total,
    });
    expect(await users()).toEqual({
      meta: page(2),
      data: [
        { id: member.id, name: 'Mia Member', username: 'mia' },
        { id: root.id, name: 'Root Admin', username: 'root' },
      ],
    });
    expect(await users('q=Root')).toEqual({
      meta: page(1),
      data: [{ id: root.id, name: 'Root Admin', username: 'root' }],
    });
    expect(await users('q=mia')).toEqual({
      meta: page(1),
      data: [{ id: member.id, name: 'Mia Member', username: 'mia' }],
    });
    expect(await users(`userId=${member.id}`)).toEqual({
      meta: page(1),
      data: [{ id: member.id, name: 'Mia Member', username: 'mia' }],
    });
    // A short page still reports every match, so a caller can tell there is more and ask for it.
    expect(await users('pageSize=1')).toEqual({
      meta: page(2, 1),
      data: [{ id: member.id, name: 'Mia Member', username: 'mia' }],
    });
    expect(await users('pageSize=1&page=2')).toEqual({
      meta: page(2, 1, 2),
      data: [{ id: root.id, name: 'Root Admin', username: 'root' }],
    });
    for (const query of [
      'q=Quinn',
      'q=Dee',
      `userId=${quiet}`,
      `userId=${delegate}`,
      'q=%27%20OR%201%3D1--',
    ]) {
      expect(await users(query), query).toEqual({ data: [], meta: page(0) });
    }
  });

  it('filters titles in the database before counting and paginating', async () => {
    expect(await listed('q=Scoped&pageSize=1')).toMatchObject({
      rows: [{ sessionId: sessions.scoped }],
      count: 1,
    });
    expect(await listed('q=missing')).toMatchObject({ rows: [], count: 0 });
    expect(await listed('q=%27%20OR%201%3D1--')).toMatchObject({
      rows: [],
      count: 0,
    });
  });

  it('reads other users and scopes using the existing message format and cursor, without writes', async () => {
    const before = await repositories.aiConversations.find();
    const messagesBefore = await repositories.aiMessages.find();
    const update = vi.spyOn(repositories.aiConversations, 'update');
    const agent = vi.spyOn(services.conversationService, 'sendMessages');
    // Parameters the route does not know, such as the chat's old `updateRead`, change nothing.
    const first = await history(
      sessions.member,
      'updateRead=true&paginate=false',
    );
    expect(first.nextPageToken).toBe('1002');
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
    expect(first.rows).toEqual(JSON.parse(JSON.stringify(personal.rows)));
    expect(
      await history(sessions.member, `pageToken=${first.nextPageToken}`),
    ).toEqual({
      rows: [expect.any(Object), expect.any(Object)],
      nextPageToken: undefined,
    });
    expect(await history(sessions.member, 'pageToken=1000')).toEqual({
      rows: [],
      nextPageToken: undefined,
    });
    for (const sessionId of [sessions.scoped, sessions.subAgent]) {
      expect(await history(sessionId)).toEqual({
        rows: [expect.any(Object)],
        nextPageToken: undefined,
      });
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
    for (const path of [LIST, OWNERS, managedMessages(sessions.member)]) {
      const response = await request(path);
      expect(response.status).toBe(401);
      expect(await response.json()).toMatchObject({
        error: {
          code: 401,
          status: 'UNAUTHENTICATED',
          reason: 'AUTHENTICATION_REQUIRED',
          domain: 'authentication',
        },
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
      for (const [path, query] of [
        [LIST, 'page=invalid&isRoot=true&canReadAllConversations=true'],
        [LIST, `userId=${member.id}&aiEmployeeUsername=ada`],
        [OWNERS, 'q=mia'],
        [managedMessages(sessions.member), ''],
      ]) {
        const response = await request(path, query, {
          'x-user-id': String(root.id),
          'x-role': 'root',
          'x-is-root': 'true',
          'x-can-read-all-conversations': 'true',
        });
        expect(response.status).toBe(403);
        expect(await response.json()).toMatchObject({
          error: {
            status: 'PERMISSION_DENIED',
            reason: 'AI_SETTINGS_ACCESS_REQUIRED',
            domain: 'aiEmployees',
          },
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
      expect((await request(LIST)).status).toBe(200);
      expect((await request(OWNERS)).status).toBe(200);
      expect((await request(managedMessages(sessions.member))).status).toBe(
        200,
      );
      const authorizedActor = {
        id,
        canReadAllConversations: true,
        canReadAllSkills: true,
        canReadAllTools: true,
        canReadUsageStatistics: true,
      };
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
    expect((await request(LIST)).status).toBe(200);
    expect((await request(OWNERS)).status).toBe(200);
    expect((await request(managedMessages(sessions.member))).status).toBe(200);
    await deps.authorization.permissionSets.revoke(assignment.id);
    expect((await request(LIST)).status).toBe(403);
    expect((await request(OWNERS)).status).toBe(403);
    expect((await request(managedMessages(sessions.member))).status).toBe(403);
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
        (await (await request(OWN, 'userId=member-user')).json()).data,
      ).toEqual(
        id === root.id
          ? [expect.objectContaining({ sessionId: sessions.root })]
          : [],
      );
      // Another user's conversation is one this caller does not have.
      for (const path of [
        own(sessions.member),
        `${own(sessions.member)}/messages`,
      ]) {
        const response = await request(path);
        expect(response.status, path).toBe(404);
        expect((await response.json()).error.reason).toBe(
          'CONVERSATION_NOT_FOUND',
        );
      }
      await expect(
        services.conversationService.update({
          actorId: id,
          sessionId: sessions.member,
          input: { title: 'Unauthorized change' },
        }),
      ).rejects.toMatchObject({
        status: 404,
        reason: 'CONVERSATION_NOT_FOUND',
      });
      await expect(
        services.conversationService.destroy({
          actorId: id,
          sessionId: sessions.member,
        }),
      ).rejects.toMatchObject({ status: 404 });
      expect(
        await repositories.aiConversations.findOne({
          filter: { sessionId: sessions.member },
        }),
      ).toMatchObject({ title: 'Member chat', read: false });
      sessionUser = { id: member.id };
      expect(await (await request(own(sessions.member))).json()).toMatchObject({
        data: { sessionId: sessions.member, llmActiveState: 'idle' },
      });
      const personal = await request(OWN);
      expect(
        (await personal.json()).data
          .map((row: { sessionId: string }) => row.sessionId)
          .sort(),
      ).toEqual([sessions.member, sessions.scoped].sort());
      expect((await request(`${own(sessions.member)}/messages`)).status).toBe(
        200,
      );
      expect((await request(`${own(sessions.root)}/messages`)).status).toBe(
        404,
      );
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
      'q=a&q=b',
      `q=${'a'.repeat(201)}`,
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
      expect((await request(LIST, query)).status, query).toBe(400);
    }
    for (const query of [
      'pageSize=0',
      'pageSize=101',
      'page=0',
      'page=1.5',
      'pageSize=1.5',
      'pageSize=',
      'pageSize=1&pageSize=2',
      'q=a&q=b',
      `q=${'a'.repeat(201)}`,
      'userId=',
      'userId=a%20b',
      `userId=${'a'.repeat(256)}`,
      'userId=a&userId=b',
    ]) {
      expect((await request(OWNERS, query)).status, query).toBe(400);
    }
    for (const [sessionId, query] of [
      ['%20', ''],
      ['not-a-uuid', ''],
      [sessions.member, 'pageToken=not-a-number'],
      [sessions.member, 'pageToken=-1'],
      [sessions.member, 'pageToken=1.5'],
      [sessions.member, 'pageToken=9223372036854775808'],
      [sessions.member, 'pageToken=1e3'],
      ['a'.repeat(256), ''],
      [sessions.member, 'pageToken='],
      [sessions.member, 'pageToken=%20'],
      [sessions.member, `pageToken=${'a'.repeat(256)}`],
      [sessions.member, 'pageToken=a&pageToken=b'],
      [sessions.member, 'pageSize=201'],
    ]) {
      expect(
        (await request(managedMessages(sessionId), query)).status,
        `${sessionId} ${query}`,
      ).toBe(400);
    }
  });

  it('returns 404 for missing sessions and reads empty sessions of any category', async () => {
    const missing = await request(managedMessages(randomUUID()));
    expect(missing.status).toBe(404);
    expect((await missing.json()).error.reason).toBe('CONVERSATION_NOT_FOUND');
    for (const sessionId of [sessions.root, sessions.historical]) {
      const response = await request(managedMessages(sessionId));
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ data: [], meta: {} });
    }
  });

  describe('runs checked before the stream opens', () => {
    async function run(
      sessionId: string,
      verb: 'send' | 'resend' | 'resumeToolCall',
      body: Record<string, unknown>,
    ): Promise<Response> {
      return app.request(
        `/api/aiEmployee/conversations/${encodeURIComponent(sessionId)}/${verb}`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(body),
        },
      );
    }
    const userMessage = {
      role: 'user',
      content: { type: 'text', content: 'Hello' },
    };

    async function expectError(
      response: Response,
      status: number,
      error: Record<string, unknown>,
    ): Promise<void> {
      expect(response.status).toBe(status);
      expect(response.headers.get('content-type')).toContain(
        'application/json',
      );
      expect((await response.json()).error).toMatchObject({
        domain: 'aiEmployees',
        ...error,
      });
    }

    it('names an employee the body refers to that does not exist', async () => {
      sessionUser = { id: root.id };
      await expectError(
        await run(sessions.root, 'send', {
          aiEmployee: 'nobody',
          messages: [userMessage],
        }),
        400,
        {
          status: 'INVALID_ARGUMENT',
          reason: 'AI_EMPLOYEE_NOT_FOUND',
          fieldViolations: [expect.objectContaining({ field: 'aiEmployee' })],
        },
      );
    });

    it('requires a user message to send', async () => {
      sessionUser = { id: root.id };
      await expectError(
        await run(sessions.root, 'send', {
          aiEmployee: 'ada',
          messages: [{ ...userMessage, role: 'assistant' }],
        }),
        400,
        {
          reason: 'INVALID_INPUT',
          fieldViolations: [expect.objectContaining({ field: 'messages' })],
        },
      );
    });

    it('answers 404 for a conversation that is not a chat of the caller', async () => {
      for (const [user, sessionId] of [
        [member.id, sessions.historical],
        [member.id, sessions.root],
        [root.id, randomUUID()],
      ] as const) {
        sessionUser = { id: user };
        for (const verb of ['send', 'resend', 'resumeToolCall'] as const) {
          await expectError(
            await run(
              sessionId,
              verb,
              verb === 'send'
                ? { aiEmployee: 'ada', messages: [userMessage] }
                : {},
            ),
            404,
            { reason: 'CONVERSATION_NOT_FOUND' },
          );
        }
      }
    });

    it('names a message the body refers to that the conversation does not have', async () => {
      sessionUser = { id: member.id };
      for (const verb of ['resend', 'resumeToolCall'] as const) {
        await expectError(
          await run(sessions.member, verb, { messageId: '999999' }),
          400,
          {
            status: 'INVALID_ARGUMENT',
            reason: 'MESSAGE_NOT_FOUND',
            fieldViolations: [expect.objectContaining({ field: 'messageId' })],
          },
        );
      }
    });

    it('refuses to rerun an empty conversation or resume a message with no tool calls', async () => {
      sessionUser = { id: root.id };
      await expectError(await run(sessions.root, 'resend', {}), 400, {
        status: 'FAILED_PRECONDITION',
        reason: 'CONVERSATION_EMPTY',
      });
      sessionUser = { id: member.id };
      await expectError(
        await run(sessions.member, 'resumeToolCall', { messageId: '1000' }),
        400,
        { status: 'FAILED_PRECONDITION', reason: 'NO_TOOL_CALLS' },
      );
    });

    it('answers 429 at the parallel run limit, keeping the user message of a send', async () => {
      const busy = Array.from({ length: 3 }, () => randomUUID());
      await repositories.aiConversations.create({
        values: busy.map((sessionId) => ({
          sessionId,
          userId: root.id,
          aiEmployeeUsername: 'ada',
          title: 'Busy',
          category: 'chat',
          from: 'main-agent',
          llmActiveState: 'streaming',
        })),
      });
      try {
        sessionUser = { id: root.id };
        await expectError(
          await run(sessions.root, 'send', {
            aiEmployee: 'ada',
            messages: [userMessage],
          }),
          429,
          {
            status: 'RESOURCE_EXHAUSTED',
            reason: 'CONVERSATION_LIMIT_REACHED',
          },
        );
        const saved = await repositories.aiMessages.find({
          filter: { sessionId: sessions.root },
        });
        expect(saved).toMatchObject([
          { role: 'user', content: userMessage.content },
        ]);
        await expectError(await run(sessions.root, 'resend', {}), 429, {
          reason: 'CONVERSATION_LIMIT_REACHED',
        });
      } finally {
        await repositories.aiConversations.destroy({
          filter: { sessionId: busy },
        });
        await repositories.aiMessages.destroy({
          filter: { sessionId: sessions.root },
        });
      }
    });
  });
});
