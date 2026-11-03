import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Knex } from 'knex';
import { claim, createHarness, type Harness } from './harness.js';

const ALICE = 'alice';
const BOB = 'bob';

describe('conversation links', () => {
  let h: Harness;
  afterEach(async () => {
    await h?.close();
  });
  const domain = () => h.services.conversations;

  it('resolves ten conversations with one links query and one call per kind', async () => {
    h = await createHarness();
    const resolve = vi.fn(
      async (_conn, userId: string, targetIds: string[]) =>
        new Map(
          targetIds.map((id) => [
            id,
            {
              key: id,
              title: `${userId} ${id}`,
              status: null,
              url: null,
            },
          ]),
        ),
    );
    domain().links.registerKind({ key: 'issue', resolve });
    const agentId = await h.createAgent({ name: 'Batch links' });
    const ids: string[] = [];
    for (let i = 0; i < 10; i++) {
      const conversation = await domain().create(ALICE, { agentId });
      ids.push(conversation.id);
      await domain().links.add(ALICE, conversation.id, {
        kind: 'issue',
        targetId: `ST-${i}`,
      });
    }
    resolve.mockClear();
    const client = await h.database.connection().client<Knex>();
    const statements: string[] = [];
    const listener = (query: { sql: string }) => statements.push(query.sql);
    client.on('query', listener);
    let listed: Awaited<ReturnType<ReturnType<typeof domain>['list']>>;
    try {
      listed = await domain().list(ALICE, { pageSize: 10 });
    } finally {
      client.removeListener('query', listener);
    }
    expect(
      statements.filter((sql) =>
        /agConversationLinks|ag_conversation_links/iu.test(sql),
      ),
    ).toHaveLength(1);
    expect(resolve).toHaveBeenCalledOnce();
    expect(resolve.mock.calls[0]![2]).toHaveLength(10);
    expect(listed!.items).toHaveLength(10);
    for (const item of listed!.items) {
      expect(item.links).toHaveLength(1);
      expect(item.links![0]!.conversationId).toBe(item.id);
      expect(item.links![0]!.view?.title).toMatch(/^alice ST-/u);
    }
    const detail = await domain().get(ALICE, ids[0]!);
    expect(detail.links).toEqual(
      listed!.items.find((item) => item.id === detail.id)!.links,
    );
    expect(
      (await h.request('GET', `/agents/conversations/${ids[0]}`, { user: BOB }))
        .status,
    ).toBe(404);
    expect((await h.request('GET', '/agents/conversations')).status).toBe(401);
  });

  /** Issues `ST-1` and `ST-2`; Bob may not see `ST-2`. */
  async function fixture() {
    h = await createHarness();
    const release = domain().links.registerKind({
      key: 'issue',
      async resolve(_conn, userId, targetIds) {
        return new Map(
          targetIds
            .filter((id) => ['ST-1', 'ST-2'].includes(id))
            .filter((id) => userId !== BOB || id !== 'ST-2')
            .map((id) => [
              id,
              {
                key: id,
                title: `Issue ${id}`,
                status: 'In progress',
                url: `/issues/${id}`,
              },
            ]),
        );
      },
    });
    const agentId = await h.createAgent({ name: 'PM' });
    const id = (await domain().create(ALICE, { agentId })).id;
    return { id, agentId, release };
  }

  it('adds, lists and removes links for the owner only', async () => {
    const { id } = await fixture();
    const path = `/agents/conversations/${id}/links`;
    const created = await h.request('POST', path, {
      user: ALICE,
      body: { kind: 'issue', targetId: 'ST-1' },
    });
    expect(created.status).toBe(201);
    expect(created.body.data).toMatchObject({
      conversationId: id,
      kind: 'issue',
      targetId: 'ST-1',
      origin: 'user',
      view: { key: 'ST-1', title: 'Issue ST-1', status: 'In progress' },
    });
    // Tying it again answers the same link.
    const again = await h.request('POST', path, {
      user: ALICE,
      body: { kind: 'issue', targetId: 'ST-1' },
    });
    expect(again.status).toBe(200);
    expect(again.body.data.id).toBe(created.body.data.id);
    for (const body of [
      { kind: 'issue', targetId: 'ST-9' },
      { kind: 'ticket', targetId: 'ST-1' },
    ]) {
      const refused = await h.request('POST', path, { user: ALICE, body });
      expect(refused.status).toBe(400);
    }
    expect(
      (
        await h.request('POST', path, {
          user: BOB,
          body: { kind: 'issue', targetId: 'ST-1' },
        })
      ).status,
    ).toBe(404);
    expect((await h.request('GET', path, { user: BOB })).status).toBe(404);

    const listed = await h.request('GET', path, { user: ALICE });
    expect(listed.status).toBe(200);
    expect(listed.body).toMatchObject({ meta: { total: 1 } });
    expect(
      listed.body.data.map((link: { targetId: string }) => link.targetId),
    ).toEqual(['ST-1']);

    const linked = await h.request(
      'GET',
      '/agents/conversations?linkKind=issue&linkTargetId=ST-1',
      { user: ALICE },
    );
    expect(linked.body.data.map((row: { id: string }) => row.id)).toEqual([id]);
    expect(
      (
        await h.request(
          'GET',
          '/agents/conversations?linkKind=issue&linkTargetId=ST-1',
          { user: BOB },
        )
      ).body.data,
    ).toEqual([]);

    const linkPath = `${path}/${created.body.data.id}`;
    expect((await h.request('DELETE', linkPath, { user: BOB })).status).toBe(
      404,
    );
    expect((await h.request('DELETE', linkPath, { user: ALICE })).status).toBe(
      204,
    );
    expect((await h.request('DELETE', linkPath, { user: ALICE })).status).toBe(
      404,
    );
    expect((await domain().links.list(ALICE, id)).length).toBe(0);
  });

  it('ties what a run created, finds the conversations of a target and tells every turn', async () => {
    const { id } = await fixture();
    const sent = await domain().send(ALICE, id, { content: 'File an issue.' });
    expect(await domain().ofRunId(sent.run!.id)).toMatchObject({
      id,
      userId: ALICE,
    });
    expect(await domain().ofRunId('missing')).toBeNull();
    expect(
      await domain().links.attach(
        id,
        { kind: 'issue', targetId: 'ST-2' },
        { origin: 'agent' },
      ),
    ).toBe(true);
    expect(
      await domain().links.attach(id, { kind: 'issue', targetId: 'ST-2' }),
    ).toBe(false);
    expect(
      await domain().links.attach('missing', {
        kind: 'issue',
        targetId: 'ST-2',
      }),
    ).toBe(false);
    expect(
      await domain().links.linkedTo(h.services.tx.read(), {
        kind: 'issue',
        targetId: 'ST-2',
      }),
    ).toMatchObject([{ id, userId: ALICE }]);
    expect((await domain().links.list(ALICE, id))[0]).toMatchObject({
      origin: 'agent',
      view: { title: 'Issue ST-2' },
    });

    const release = domain().rules.provide(() =>
      Promise.resolve({ turn: [['Board:', '- 3 issues wait for review.']] }),
    );
    const runner = await h.registerRunner();
    const [payload] = await claim(h, runner);
    release();
    expect(payload.prompt.turn).toContain(
      'Linked work (what this conversation drives, as it stands now):\n- issue ST-2: Issue ST-2 (In progress)',
    );
    expect(payload.prompt.turn).toContain(
      'Board:\n- 3 issues wait for review.',
    );
    expect(payload.prompt.system).not.toContain('Linked work');
  });
});
