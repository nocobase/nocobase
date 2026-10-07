// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createHarness, type Harness } from '../harness.js';

let h: Harness;
beforeEach(async () => {
  h = await createHarness();
  await h.addUser('admin');
  await h.addUser('alice');
});
afterEach(() => h.close());

describe('labels', () => {
  it('is read by everyone and managed by holders of pm.labels update', async () => {
    const admin = h.viewer('admin', 'admin');
    await expect(
      h.services.labels.create(h.viewer('alice'), { name: 'bug' }),
    ).rejects.toMatchObject({ kind: 'forbidden' });
    const bug = await h.services.labels.create(admin, {
      name: ' bug ',
      color: 'red',
    });
    await h.services.labels.create(admin, { name: 'api' });
    expect(bug).toMatchObject({ name: 'bug', color: 'red' });
    await expect(h.services.labels.list()).resolves.toEqual([
      expect.objectContaining({ name: 'api', color: 'gray' }),
      expect.objectContaining({ name: 'bug', color: 'red' }),
    ]);
  });

  it('keeps names unique and colors from the palette', async () => {
    const admin = h.viewer('admin', 'admin');
    const bug = await h.services.labels.create(admin, { name: 'bug' });
    await expect(
      h.services.labels.create(admin, { name: 'bug' }),
    ).rejects.toMatchObject({
      code: 'LABEL_EXISTS',
    });
    const other = await h.services.labels.create(admin, { name: 'other' });
    await expect(
      h.services.labels.update(admin, other.id, { name: 'bug' }),
    ).rejects.toMatchObject({ code: 'LABEL_EXISTS' });
    await expect(
      h.services.labels.update(admin, bug.id, { color: 'pink' as never }),
    ).rejects.toMatchObject({ code: 'INVALID_COLOR' });
  });

  it('removes a deleted label from its issues', async () => {
    const admin = h.viewer('admin', 'admin');
    const bug = await h.services.labels.create(admin, { name: 'bug' });
    const issue = await h.services.issues.create(admin, {
      title: 'Crash',
      labelIds: [bug.id],
    });
    await h.services.labels.remove(admin, bug.id);
    const detail = await h.services.issueQueries.detail(admin, issue.id);
    expect(detail.labels).toEqual([]);
    await expect(h.services.labels.remove(admin, bug.id)).rejects.toMatchObject(
      {
        kind: 'notFound',
      },
    );
  });
});
