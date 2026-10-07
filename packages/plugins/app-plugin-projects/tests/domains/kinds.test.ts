// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createHarness, type Harness } from '../harness.js';

let h: Harness;
beforeEach(async () => {
  h = await createHarness();
  for (const id of ['alice', 'bob']) await h.addUser(id, id);
});
afterEach(() => h.close());

const alice = () => h.viewer('alice');

/** A kind another plugin might register: executors named `Bot <id>`, given work only by alice. */
function addBots(): void {
  h.services.kinds.add({
    key: 'bot',
    title: 'Bot',
    names: (_conn, ids) =>
      Promise.resolve(new Map(ids.map((id) => [id, `Bot ${id}`]))),
    executor: {
      require: (_conn, _id, userId) =>
        userId === 'alice'
          ? Promise.resolve()
          : Promise.reject(new Error('Not yours.')),
      canKeep: (_conn, _id, ownerUserId) =>
        Promise.resolve(ownerUserId === 'alice'),
    },
  });
}

describe('kinds', () => {
  it('knows people and the system only, until a plugin registers more', async () => {
    expect(h.services.kinds.info().map((kind) => kind.key)).toEqual([
      'user',
      'system',
    ]);
    await expect(
      h.services.issues.create(alice(), {
        title: 'A',
        executor: { type: 'bot', id: 'b1' },
      }),
    ).rejects.toMatchObject({ code: 'INVALID_EXECUTOR' });
    expect(() => h.services.kinds.add({ key: 'user' })).toThrow();
  });

  it('lets an issue be executed by nobody, a member, or a registered kind', async () => {
    addBots();
    const nobody = await h.services.issues.create(alice(), { title: 'A' });
    expect(nobody.executor).toBeNull();
    const member = await h.services.issues.create(alice(), {
      title: 'B',
      executor: { type: 'user', id: 'bob' },
    });
    expect(member.executor).toEqual({ type: 'user', id: 'bob' });
    const bot = await h.services.issues.create(alice(), {
      title: 'C',
      executor: { type: 'bot', id: 'b1' },
    });
    const page = await h.services.issueQueries.page(alice(), {});
    const byTitle = new Map(page.data.map((item) => [item.title, item]));
    expect(byTitle.get('C')?.executorName).toBe('Bot b1');
    expect(byTitle.get('B')?.executorName).toBe('bob');
    expect(byTitle.get('A')?.executorName).toBeNull();
    const cleared = await h.services.issues.update(alice(), bot.id, {
      revision: bot.revision,
      executor: null,
    });
    expect(cleared).toMatchObject({ executor: null });
  });

  it('drops an executor the new owner may not give work to', async () => {
    addBots();
    const issue = await h.services.issues.create(alice(), {
      title: 'A',
      executor: { type: 'bot', id: 'b1' },
    });
    await h.services.issues.update(alice(), issue.id, {
      revision: issue.revision,
      ownerUserId: 'bob',
    });
    const detail = await h.services.issueQueries.detail(alice(), issue.id);
    expect(detail.executor).toBeNull();
  });

  it('lets go of an executor that can no longer work on unfinished issues, recording why', async () => {
    addBots();
    const open = await h.services.issues.create(alice(), {
      title: 'Open',
      executor: { type: 'bot', id: 'b1' },
    });
    const finished = await h.services.issues.create(alice(), {
      title: 'Finished',
      executor: { type: 'bot', id: 'b1' },
    });
    const other = await h.services.issues.create(alice(), {
      title: 'Other',
      executor: { type: 'bot', id: 'b2' },
    });
    await h.database
      .connection()
      .repository('pmIssues')
      .updateMany({
        filter: { id: finished.id },
        values: { statusKey: 'done' },
      });
    const released = await h.services.issues.releaseExecutor(
      { type: 'bot', id: 'b1' },
      { actor: { type: 'user', id: 'bob' }, name: 'Bot b1' },
    );
    expect(released).toEqual([open.id]);
    const detail = await h.services.issueQueries.detail(alice(), open.id);
    expect(detail.executor).toBeNull();
    expect(detail.revision).toBe(open.revision + 1);
    expect(
      (await h.services.issueQueries.detail(alice(), finished.id)).executor,
    ).toEqual({ type: 'bot', id: 'b1' });
    expect(
      (await h.services.issueQueries.detail(alice(), other.id)).executor,
    ).toEqual({ type: 'bot', id: 'b2' });
    const page = await h.services.issueQueries.activities(alice(), open.id, {});
    expect(
      page.data.find((activity) => activity.action === 'executor_changed'),
    ).toMatchObject({
      actorType: 'user',
      actorId: 'bob',
      details: {
        from: { type: 'bot', id: 'b1' },
        to: null,
        reason: 'executorRemoved',
        name: 'Bot b1',
      },
    });
    // Nothing is left to release.
    expect(
      await h.services.issues.releaseExecutor(
        { type: 'bot', id: 'b1' },
        { actor: { type: 'user', id: 'bob' }, name: 'Bot b1' },
      ),
    ).toEqual([]);
  });

  it('offers the executors of other kinds the viewer may give work to, described', async () => {
    expect(await h.services.members.executors(alice())).toEqual([]);
    addBots();
    // A kind that does not list its candidates is not offered.
    expect(await h.services.members.executors(alice())).toEqual([]);
    h.services.kinds.add({
      key: 'helper',
      names: (_conn, ids) =>
        Promise.resolve(new Map(ids.map((id) => [id, `Helper ${id}`]))),
      executor: {
        require: () => Promise.resolve(),
        canKeep: () => Promise.resolve(true),
        candidates: (_conn, userId) =>
          Promise.resolve(userId === 'alice' ? ['h1', 'h2'] : []),
        describe: (_conn, ids) =>
          Promise.resolve(
            ids.map((id) => ({
              id,
              name: `Helper ${id}`,
              ...(id === 'h1'
                ? { nameText: { key: 'helpers.h1', ns: 'test' } }
                : {}),
              online: id === 'h1',
              busy: id === 'h1' ? 2 : 0,
            })),
          ),
      },
    });
    expect(await h.services.members.executors(alice())).toEqual([
      {
        type: 'helper',
        id: 'h1',
        name: 'Helper h1',
        nameText: { key: 'helpers.h1', ns: 'test' },
        online: true,
        busy: 2,
      },
      { type: 'helper', id: 'h2', name: 'Helper h2', online: false, busy: 0 },
    ]);
    expect(await h.services.members.executors(h.viewer('bob'))).toEqual([]);
  });

  it('tells the browser every kind', async () => {
    addBots();
    const me = await h.services.members.me(alice());
    expect(me.kinds.at(-1)).toEqual({
      key: 'bot',
      title: 'Bot',
      executor: true,
      mentionable: false,
    });
  });
});
