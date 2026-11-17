// @vitest-environment node
import { afterEach, describe, expect, it } from 'vitest';
import {
  createKnowledgeHarness,
  ADMIN,
  READER,
  type KnowledgeHarness,
} from './harness.js';

const space = { scope: 'project', scopeId: 'p1' } as const;
let h: KnowledgeHarness;
afterEach(async () => {
  await h?.close();
});

describe('actor authorization policy', () => {
  for (const policy of [undefined, 'initiator'] as const) {
    it(`uses ${policy ?? 'the default actor intersection'} for space and custom document ACLs`, async () => {
      h = await createKnowledgeHarness({ actorAuthorization: policy });
      h.projects.set('p1', { id: 'p1', name: 'Project', leadUserId: 'lead' });
      h.levels.set('admin', ADMIN);
      h.levels.set('member', READER);
      const lead = h.user('lead');
      const doc = await h.knowledge.docs.create(lead, {
        ...space,
        title: 'Restricted',
        content: 'Original',
      });
      await h.knowledge.permissions.replace(lead, doc.id, {
        mode: 'custom',
        entries: [{ subject: { type: 'user', id: 'member' }, level: 'edit' }],
      });
      const reader = h.agent('member', 'a1', 'run1');
      const leadAgent = h.agent('lead', 'a1', 'run2');
      if (!policy) {
        await expect(
          h.knowledge.docs.update(reader, doc.id, {
            content: 'Denied',
            expectedVersion: 1,
          }),
        ).rejects.toBeTruthy();
        await expect(
          h.knowledge.docs.create(leadAgent, { ...space, title: 'Denied' }),
        ).rejects.toBeTruthy();
        return;
      }
      // Space inheritance follows the initiator; audit retains the actor.
      const made = await h.knowledge.docs.create(leadAgent, {
        ...space,
        title: 'By agent',
        content: 'Body',
      });
      expect(
        (await h.knowledge.docs.version(lead, made.id, 1)).author,
      ).toMatchObject({ kind: 'agent', id: 'a1' });
      expect((await h.knowledge.docs.get(reader, doc.id)).access.edit).toBe(
        true,
      );
      const catalogue = await h.knowledge.docs.summaries(reader, [space]);
      expect(catalogue).toHaveLength(1);
      expect(catalogue).toEqual(
        await h.knowledge.docs.summaries(h.user('member'), [space]),
      );
      await expect(
        h.knowledge.docs.update(reader, doc.id, {
          content: 'Updated by initiator ACL',
          expectedVersion: 1,
        }),
      ).resolves.toBeTruthy();
      await expect(
        h.knowledge.docs.update(h.agent('other', 'a1'), doc.id, {
          content: 'Denied',
          expectedVersion: 1,
        }),
      ).rejects.toBeTruthy();
      // Online agents keep the default ceiling even when the host enables run initiator authorization.
      const online = {
        userId: 'lead',
        actor: { kind: 'online-agent', id: 'online' },
      };
      await expect(
        h.knowledge.docs.create(online, { ...space, title: 'Denied' }),
      ).rejects.toBeTruthy();
      await expect(
        h.knowledge.docs.archive(online, made.id),
      ).rejects.toBeTruthy();
      // Archived documents remain hidden to every actor, including run initiators.
      await h.knowledge.docs.archive(lead, made.id);
      await expect(
        h.knowledge.docs.get(leadAgent, made.id),
      ).rejects.toMatchObject({ code: 'DOC_NOT_FOUND' });
      await expect(
        h.knowledge.permissions.effective(leadAgent, made.id),
      ).rejects.toMatchObject({ code: 'DOC_NOT_FOUND' });
      expect(
        (
          await h.knowledge.docs.tree(leadAgent, space, { archived: true })
        ).spaces.flatMap((entry) => entry.docs),
      ).not.toEqual(
        expect.arrayContaining([expect.objectContaining({ id: made.id })]),
      );
      // A space manager keeps the same override as its initiating user.
      await expect(
        h.knowledge.permissions.replace(leadAgent, doc.id, {
          mode: 'inherit',
          entries: [],
        }),
      ).resolves.toBeTruthy();
    });
  }
});
