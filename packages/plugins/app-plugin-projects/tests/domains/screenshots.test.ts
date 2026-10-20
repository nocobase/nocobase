// @vitest-environment node
import { afterEach, beforeEach, expect, it } from 'vitest';
import type { Knex } from 'knex';
import { createHarness, type Harness } from '../harness.js';

let h: Harness;
beforeEach(async () => {
  h = await createHarness();
  await h.addUser('alice');
  await h.addUser('bob');
  h.services.kinds.add({
    key: 'agent',
    names: (_conn, ids) =>
      Promise.resolve(new Map(ids.map((id) => [id, 'Coder']))),
  });
});
afterEach(() => h.close());

it('keeps screenshot and detail query counts fixed as comments and images grow', async () => {
  const viewer = h.viewer('alice', 'admin');
  const agent = { ...viewer, actor: { type: 'agent', id: 'coder' } };
  const issue = await h.services.issues.create(viewer, {
    title: 'Bounded reads',
  });
  const client = await h.database.connection().client<Knex>();
  const counts = async (): Promise<number[]> => {
    const result: number[] = [];
    for (const read of [
      () => h.services.issueQueries.detail(viewer, issue.id),
      () => h.services.attachments.screenshots(viewer, issue.id),
    ]) {
      await read();
      let count = 0;
      const listener = (): void => {
        count++;
      };
      client.on('query', listener);
      try {
        await read();
      } finally {
        client.removeListener('query', listener);
      }
      result.push(count);
    }
    return result;
  };
  const addRound = async (): Promise<void> => {
    const files = await Promise.all(
      Array.from({ length: 10 }, () =>
        h.services.attachments.upload(
          agent,
          new File(['image'], 'screen.png', { type: 'image/png' }),
        ),
      ),
    );
    await h.services.comments.create(agent, issue.id, {
      content: 'Round',
      attachmentIds: files.map((file) => file.id),
    });
  };
  for (let round = 0; round < 5; round++) await addRound();
  const root = (await h.services.issueQueries.detail(viewer, issue.id))
    .threads[0]!.root;
  // Keep both author kinds in each fixture; their batched name lookups are conditional on presence.
  await h.services.comments.create(viewer, issue.id, {
    content: 'Review',
    parentId: root.id,
  });
  const small = await counts();
  for (let round = 0; round < 10; round++) await addRound();
  for (let index = 0; index < 45; index++)
    await h.services.comments.create(viewer, issue.id, {
      content: 'Discussion',
    });
  expect(await counts()).toEqual(small);
});

it('bounds live Agent images before returning stable comment provenance, independent of pagination', async () => {
  const viewer = h.viewer('alice');
  const issue = await h.services.issues.create(viewer, {
    title: 'Screenshots',
  });
  const agent = { ...viewer, actor: { type: 'agent', id: 'coder' } };
  const shot = () =>
    h.services.attachments.upload(
      agent,
      new File(['image'], 'same.png', { type: 'image/png' }),
    );
  const first = await shot();
  const { comment } = await h.services.comments.create(agent, issue.id, {
    content: 'Old round',
    attachmentIds: [first.id],
  });
  const time = new Date('2026-01-01T00:00:00Z');
  await h.database
    .repository('pmComments')
    .updateMany({ filter: { id: comment.id }, values: { createdAt: time } });
  for (let index = 0; index < 40; index++)
    await h.services.comments.create(viewer, issue.id, {
      content: `Later ${index}`,
    });
  const initial = await h.services.attachments.screenshots(viewer, issue.id);
  expect(initial).toMatchObject({
    data: [
      {
        id: first.id,
        filename: 'same.png',
        comment: {
          id: comment.id,
          createdAt: time.toISOString(),
          author: { type: 'agent', id: 'coder', name: 'Coder' },
        },
      },
    ],
    meta: { limit: 100, truncated: false },
  });
  // Human images and mismatched media types do not displace eligible images at the limit.
  const human = await h.services.attachments.upload(
    viewer,
    new File(['image'], 'human.png', { type: 'image/png' }),
  );
  await h.services.comments.create(viewer, issue.id, {
    content: 'Human',
    attachmentIds: [human.id],
  });
  const disguised = await h.services.attachments.upload(
    agent,
    new File(['svg'], 'unsafe.svg', { type: 'image/png' }),
  );
  await h.services.comments.create(agent, issue.id, {
    content: 'Not inline',
    attachmentIds: [disguised.id],
  });
  for (let batch = 0; batch < 10; batch++) {
    const files = await Promise.all(
      Array.from({ length: batch === 9 ? 9 : 10 }, shot),
    );
    await h.services.comments.create(agent, issue.id, {
      content: `Round ${batch}`,
      attachmentIds: files.map((file) => file.id),
    });
  }
  const exact = await h.services.attachments.screenshots(viewer, issue.id);
  expect(exact.data).toHaveLength(100);
  expect(exact.meta.truncated).toBe(false);
  expect(exact.data.at(-1)?.id).toBe(first.id);
  const extra = await shot();
  const { comment: latest } = await h.services.comments.create(
    agent,
    issue.id,
    { content: 'Newest', attachmentIds: [extra.id] },
  );
  const overflow = await h.services.attachments.screenshots(viewer, issue.id);
  expect(overflow.data).toHaveLength(100);
  expect(overflow.meta.truncated).toBe(true);
  expect(overflow.data[0]?.id).toBe(extra.id);
  expect(overflow.data.some((file) => file.id === first.id)).toBe(false);
  await h.services.comments.remove(agent, latest.id);
  const deleted = await h.services.attachments.screenshots(viewer, issue.id);
  expect(deleted.meta.truncated).toBe(false);
  expect(deleted.data.some((file) => file.id === extra.id)).toBe(false);
  await expect(
    h.services.attachments.content(viewer, extra.id),
  ).rejects.toMatchObject({ code: 'NOT_FOUND' });
});

it('uses the same hidden-issue boundary as comments and content', async () => {
  const viewer = h.viewer('alice');
  const project = await h.services.projects.create(viewer, {
    name: 'Private',
    visibility: 'members',
  });
  const issue = await h.services.issues.create(viewer, {
    title: 'Secret',
    projectId: project.id,
  });
  await expect(
    h.services.attachments.screenshots(h.viewer('bob'), issue.id),
  ).rejects.toMatchObject({ code: 'NOT_FOUND' });
});
