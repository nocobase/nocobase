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

describe('settings', () => {
  it('reads the seeded prefix', async () => {
    await expect(h.services.settings.get(h.viewer('alice'))).resolves.toEqual({
      issuePrefix: 'PM',
    });
  });

  it('lets only holders of pm.general update change it', async () => {
    await expect(
      h.services.settings.update(h.viewer('alice'), { issuePrefix: 'NP' }),
    ).rejects.toMatchObject({ kind: 'forbidden' });
    await expect(
      h.services.settings.update(h.viewer('admin', 'admin'), {
        issuePrefix: 'NP',
      }),
    ).resolves.toEqual({ issuePrefix: 'NP' });
  });

  it('refuses a prefix that is not upper-case letters and digits', async () => {
    for (const issuePrefix of ['np', '1X', 'TOO-LONG', 'ABCDEFGHIJK'])
      await expect(
        h.services.settings.update(h.viewer('admin', 'admin'), { issuePrefix }),
      ).rejects.toMatchObject({ code: 'INVALID_PREFIX' });
  });

  it('numbers issues across the workspace with the current prefix', async () => {
    const admin = h.viewer('admin', 'admin');
    const first = await h.services.issues.create(admin, { title: 'One' });
    await h.services.settings.update(admin, { issuePrefix: 'NP' });
    const second = await h.services.issues.create(admin, { title: 'Two' });
    expect([first.identifier, second.identifier]).toEqual(['PM-1', 'NP-2']);
  });
});
