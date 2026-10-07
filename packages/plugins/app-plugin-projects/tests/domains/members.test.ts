// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createHarness, permissionsOf, type Harness } from '../harness.js';

let h: Harness;
beforeEach(async () => {
  h = await createHarness();
});
afterEach(() => h.close());

describe('members', () => {
  it('admits a user once, on their first request', async () => {
    await h.addUser('alice');
    await h.services.members.ensure('alice');
    await h.services.members.ensure('alice');
    expect(h.admitted).toEqual(['alice']);
  });

  it('lists every active account by name', async () => {
    await h.addUser('b', 'Bob');
    await h.addUser('a', 'Alice');
    await h.database
      .connection()
      .repository('user')
      .updateOne({ filter: { id: 'b' }, values: { disabledAt: new Date() } });
    await expect(h.services.members.list(h.viewer('a'))).resolves.toEqual([
      { userId: 'a', name: 'Alice', email: 'a@example.com' },
    ]);
  });

  it('describes the signed-in user with their permissions', async () => {
    await h.addUser('alice', 'Alice');
    await expect(h.services.members.me(h.viewer('alice'))).resolves.toEqual({
      userId: 'alice',
      name: 'Alice',
      permissions: permissionsOf('member', 'alice'),
      kinds: [
        { key: 'user', title: null, executor: true, mentionable: true },
        { key: 'system', title: null, executor: false, mentionable: false },
      ],
    });
  });
});
