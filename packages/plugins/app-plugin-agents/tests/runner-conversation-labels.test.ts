import type { Knex } from 'knex';
import { afterEach, describe, expect, it } from 'vitest';
import { CONVERSATION_SUBJECT } from '../shared/conversations.js';
import { createHarness, type Harness } from './harness.js';

describe('runner conversation descriptions', () => {
  let h: Harness;
  afterEach(async () => h?.close());

  it('uses current ownership for names and links across viewers, including held work and reports', async () => {
    h = await createHarness();
    const { runnerId } = await h.registerRunner();
    const agentId = await h.createAgent();
    const own = await h.services.conversations.create('alice', {
      agentId,
      title: 'Release notes',
    });
    const other = await h.services.conversations.create('bob', {
      agentId,
      title: 'Secret forecast',
    });
    const untitled = await h.services.conversations.create('alice', {
      agentId,
    });
    const gone = 'deleted-conversation';
    for (const [i, id] of [own.id, other.id, untitled.id, gone].entries()) {
      await h.database
        .connection()
        .repository('agRuns')
        .createOne({
          values: {
            id: `run-${i}`,
            agentId,
            runnerId,
            subjectKind: CONVERSATION_SUBJECT,
            subjectId: id,
            threadScope: 'main',
            actorUserId: 'alice',
            ownerUserId: 'alice',
            status: 'running',
            startedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
    }
    const url = `/agents/runners/${runnerId}`;
    const read = (user: string, can: string[] = []) =>
      h.request('GET', `${url}/runs`, { user, can });
    expect((await h.request('GET', `${url}/runs`)).status).toBe(401);
    expect((await read('alice')).status).toBe(404);
    const readers = ['alice', 'bob', 'admin', 'owner'];
    for (const user of readers) {
      const can =
        user === 'admin'
          ? ['agents.runners/manage', 'agents.agents/manage']
          : user === 'owner'
            ? []
            : ['agents.runners/read'];
      const recent = await read(user, can);
      const held = await h.request('GET', `${url}/work`, { user, can });
      for (const response of [recent, held]) {
        expect(response.status).toBe(200);
        const rows = response.body.data as {
          id: string;
          subjectLabel: string;
          path: string | null;
        }[];
        expect(rows).toHaveLength(4);
        for (const [i, conversation] of [own, other, untitled].entries()) {
          const row = rows.find((item) => item.id === `run-${i}`)!;
          if ((i === 1 ? 'bob' : 'alice') === user) {
            expect(row.subjectLabel).toBe(
              `Conversation: ${conversation.title || 'New conversation'}`,
            );
            expect(row.path).toBe(`?chat=${conversation.id}`);
          } else {
            expect(row.subjectLabel).toBe("Someone else's conversation");
            expect(row.path).toBeNull();
            expect(JSON.stringify(response.body)).not.toContain(
              conversation.id,
            );
            if (conversation.title)
              expect(JSON.stringify(response.body)).not.toContain(
                conversation.title,
              );
          }
        }
        expect(rows.find((row) => row.id === 'run-3')).toMatchObject({
          subjectLabel: "Someone else's conversation",
          path: null,
        });
        expect(JSON.stringify(response.body)).not.toContain(gone);
      }
      // Native conversation access also rejects administrators and runtime owners.
      if (user !== 'bob')
        await expect(
          h.services.conversations.get(user, other.id),
        ).rejects.toMatchObject({ code: 'CONVERSATION_NOT_FOUND' });
    }
    const report = await h.services.reporting.runRecords(
      { userId: 'admin', allRuns: true },
      {
        subjects: { kind: CONVERSATION_SUBJECT, ids: [own.id, other.id] },
        groupId: null,
      },
    );
    expect(report).toEqual([]);
    const ownReport = await h.services.reporting.runRecords(
      { userId: 'alice', allRuns: true },
      {
        subjects: { kind: CONVERSATION_SUBJECT, ids: [own.id, other.id] },
        groupId: null,
      },
    );
    expect(ownReport.map((run) => run.subjectId)).toEqual([own.id]);
    const binding = h.services.subjects.get(CONVERSATION_SUBJECT)!;
    const facts = await binding.reports!.describe(
      h.database.connection(),
      'alice',
      [own.id, other.id, gone],
    );
    expect([...facts.keys()]).toEqual([own.id]);
    // Historical actor and owner remain Alice; current ownership changes to Bob.
    await h.database
      .connection()
      .repository('agConversations')
      .updateOne({ filter: { id: own.id }, values: { userId: 'bob' } });
    const previous = await read('alice', ['agents.runners/read']);
    expect(JSON.stringify(previous.body)).not.toContain('Release notes');
    expect(JSON.stringify(previous.body)).not.toContain(own.id);
    const current = await read('bob', ['agents.runners/read']);
    expect(
      current.body.data.find((row: { id: string }) => row.id === 'run-0'),
    ).toMatchObject({
      subjectLabel: 'Conversation: Release notes',
      path: `?chat=${own.id}`,
    });
    await expect(
      h.services.conversations.get('alice', own.id),
    ).rejects.toMatchObject({ code: 'CONVERSATION_NOT_FOUND' });
    expect((await h.services.conversations.get('bob', own.id)).title).toBe(
      'Release notes',
    );

    const knex = await h.database.connection().client<Knex>();
    const statements: string[] = [];
    const listener = ({ sql }: { sql: string }) => statements.push(sql);
    knex.on('query', listener);
    try {
      await read('bob', ['agents.runners/read']);
    } finally {
      knex.off('query', listener);
    }
    expect(statements.filter((sql) => /^select/iu.test(sql))).toHaveLength(6); // Two history ranges plus runner visibility, roster, names and descriptions.
    expect(
      statements.filter((sql) => /\bag_conversations\b/iu.test(sql)),
    ).toHaveLength(1);
    expect(
      statements.some((sql) =>
        /^(insert|update|delete|begin)\b|for update/iu.test(sql),
      ),
    ).toBe(false);
  });

  it('localizes owned, untitled and inaccessible descriptions without a new response field', async () => {
    h = await createHarness();
    const { runnerId } = await h.registerRunner();
    const agentId = await h.createAgent();
    const conversation = await h.services.conversations.create('owner', {
      agentId,
      title: '发布计划',
    });
    await h.database
      .connection()
      .repository('agRuns')
      .createOne({
        values: {
          id: 'run',
          agentId,
          runnerId,
          subjectKind: CONVERSATION_SUBJECT,
          subjectId: conversation.id,
          threadScope: 'main',
          actorUserId: 'owner',
          status: 'completed',
          startedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    const response = await h.app.request(`/agents/runners/${runnerId}/runs`, {
      headers: { 'x-test-user': 'owner', 'accept-language': 'zh-CN' },
    });
    const body = await response.json();
    expect(body.data[0].subjectLabel).toBe('对话：发布计划');
    expect(body.data[0]).not.toHaveProperty('conversation');
    const hidden = await h.app.request(`/agents/runners/${runnerId}/runs`, {
      headers: {
        'x-test-user': 'admin',
        'x-test-can': 'agents.runners/read',
        'accept-language': 'zh-CN',
      },
    });
    expect((await hidden.json()).data[0]).toMatchObject({
      subjectLabel: '他人对话',
      path: null,
    });
  });
});
