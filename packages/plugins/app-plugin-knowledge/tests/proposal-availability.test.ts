// @vitest-environment node
import { expect, it } from 'vitest';
import { createKnowledgeHarness, ADMIN, READER } from './harness.js';
import {
  createKnowledgeRoutes,
  createKnowledgeTicketRoutes,
} from '../server/routes/api.js';

it('disables every proposal path while preserving authorized direct edits', async () => {
  const h = await createKnowledgeHarness({ proposals: false });
  try {
    h.levels.set('admin', ADMIN);
    h.levels.set('reader', READER);
    const editor = { userId: 'admin' };
    const reader = { userId: 'reader' };
    const doc = await h.knowledge.docs.create(editor, {
      scope: 'system',
      title: 'Guide',
      content: 'Original',
    });
    const routes = createKnowledgeRoutes(
      h.knowledge,
      () => editor,
      (space) => space,
    );
    expect(await (await routes.request('/capabilities')).json()).toMatchObject({
      data: { proposals: false },
    });
    expect(
      routes.routes.some(({ path }) => path.startsWith('/proposals')),
    ).toBe(false);
    expect(createKnowledgeTicketRoutes(h.knowledge).routes).toEqual([]);
    const input = {
      kind: 'update' as const,
      docId: doc.id,
      content: 'Suggested',
      reason: 'Change',
    };
    await expect(
      h.knowledge.proposals.propose(editor, input),
    ).rejects.toMatchObject({ code: 'PROPOSALS_UNAVAILABLE' });
    await expect(
      h.knowledge.proposals.proposeFile(
        editor,
        input,
        new File(['new'], 'guide.txt'),
      ),
    ).rejects.toMatchObject({ code: 'PROPOSALS_UNAVAILABLE' });
    await expect(
      h.knowledge.proposals.ticket(editor, input),
    ).rejects.toMatchObject({ code: 'PROPOSALS_UNAVAILABLE' });
    await expect(
      h.knowledge.proposals.redeem(
        'old-ticket',
        'token',
        new File(['new'], 'guide.txt'),
      ),
    ).rejects.toMatchObject({ code: 'PROPOSALS_UNAVAILABLE' });
    await expect(
      h.knowledge.docs.update(reader, doc.id, {
        expectedVersion: 1,
        content: 'Forbidden',
      }),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
    await h.knowledge.docs.update(editor, doc.id, {
      expectedVersion: 1,
      content: 'Direct edit',
    });
    expect((await h.knowledge.docs.get(editor, doc.id)).content).toBe(
      'Direct edit',
    );
    expect(
      await h.knowledge.proposals.list(editor, { status: 'pending' }),
    ).toEqual([]);
  } finally {
    await h.close();
  }
});
