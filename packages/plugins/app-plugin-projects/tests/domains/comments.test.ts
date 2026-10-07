// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { Viewer } from '../../server/access/viewer.js';
import type { IssueTriggers } from '../../server/domains/issues/index.js';
import { createProjects } from '../../server/composition.js';
import { permissionsOf } from '../permissions.js';
import type { Issue } from '../../shared/issues.js';
import type { MentionRef } from '../../shared/comments.js';
import { createHarness, type Harness } from '../harness.js';

let h: Harness;
beforeEach(async () => {
  h = await createHarness();
  for (const id of ['admin', 'lead', 'alice', 'bob']) await h.addUser(id, id);
});
afterEach(() => h.close());

const alice = () => h.viewer('alice');
const bob = () => h.viewer('bob');
const admin = () => h.viewer('admin', 'admin');
const lead = () => h.viewer('lead');
/** Sees issues and reacts, but may not comment. */
const reader = (): Viewer => {
  const base = h.viewer('bob');
  return {
    ...base,
    permissions: {
      ...base.permissions,
      scopes: {
        ...base.permissions.scopes,
        'pm.issues/comment': 'none',
        'pm.issues/moderate-comments': 'none',
      },
    },
  };
};

const mention = (id: string) => `[@${id}](mention://user/${id})`;

async function anIssue(viewer = alice()): Promise<Issue> {
  return h.services.issues.create(viewer, { title: 'Retry callbacks' });
}

describe('writing comments', () => {
  it('posts a comment, records it and keeps the revision', async () => {
    const issue = await anIssue();
    const { comment, triggered } = await h.services.comments.create(
      bob(),
      issue.identifier,
      { content: `Looks good ${mention('alice')}` },
    );
    expect(triggered).toEqual([]);
    expect(comment).toMatchObject({
      issueId: issue.id,
      authorType: 'user',
      authorId: 'bob',
      authorName: 'bob',
      kind: 'comment',
      note: false,
      parentId: null,
      rootId: comment.id,
      deleted: false,
      reactions: [],
      resolvedAt: null,
    });
    const after = await h.services.issueQueries.detail(alice(), issue.id);
    expect(after.revision).toBe(issue.revision);
    expect(after.updatedAt).toBe(issue.updatedAt);
    expect(after.lastActivityAt >= issue.lastActivityAt).toBe(true);
    expect(after.activities.map((activity) => activity.action)).toContain(
      'comment_added',
    );
    expect(after.threads).toHaveLength(1);
  });

  it('does not make an open edit of the issue fail', async () => {
    const issue = await anIssue();
    await h.services.comments.create(bob(), issue.id, { content: 'Hi' });
    const updated = await h.services.issues.update(alice(), issue.id, {
      revision: issue.revision,
      title: 'Retry callbacks twice',
    });
    expect(updated.title).toBe('Retry callbacks twice');
  });

  it('refuses empty or oversized content and foreign or deleted parents', async () => {
    const issue = await anIssue();
    const other = await anIssue();
    await expect(
      h.services.comments.create(bob(), issue.id, { content: '  ' }),
    ).rejects.toMatchObject({ code: 'INVALID_COMMENT' });
    await expect(
      h.services.comments.create(bob(), issue.id, {
        content: 'x'.repeat(200_001),
      }),
    ).rejects.toMatchObject({ code: 'INVALID_COMMENT' });
    const elsewhere = await h.services.comments.create(bob(), other.id, {
      content: 'Elsewhere',
    });
    await expect(
      h.services.comments.create(bob(), issue.id, {
        content: 'Reply',
        parentId: elsewhere.comment.id,
      }),
    ).rejects.toMatchObject({ code: 'INVALID_PARENT' });
    const root = await h.services.comments.create(bob(), issue.id, {
      content: 'Root',
    });
    await h.services.comments.remove(bob(), root.comment.id);
    await expect(
      h.services.comments.create(bob(), issue.id, {
        content: 'Reply',
        parentId: root.comment.id,
      }),
    ).rejects.toMatchObject({ code: 'INVALID_PARENT' });
  });

  it('threads replies under their root', async () => {
    const issue = await anIssue();
    const root = await h.services.comments.create(bob(), issue.id, {
      content: 'Root',
    });
    const reply = await h.services.comments.create(alice(), issue.id, {
      content: 'Reply',
      parentId: root.comment.id,
    });
    const nested = await h.services.comments.create(bob(), issue.id, {
      content: 'Reply to reply',
      parentId: reply.comment.id,
    });
    expect(nested.comment.rootId).toBe(root.comment.id);
    const page = await h.services.commentQueries.threads(alice(), issue.id, {});
    expect(page.data).toHaveLength(1);
    expect(page.data[0]?.replies.map((comment) => comment.content)).toEqual([
      'Reply',
      'Reply to reply',
    ]);
  });

  it('pages threads by their roots, newest page first', async () => {
    const issue = await anIssue();
    for (const content of ['one', 'two', 'three'])
      await h.services.comments.create(bob(), issue.id, { content });
    const first = await h.services.commentQueries.threads(alice(), issue.id, {
      limit: 2,
    });
    expect(first.data.map((thread) => thread.root.content)).toEqual([
      'two',
      'three',
    ]);
    const second = await h.services.commentQueries.threads(alice(), issue.id, {
      limit: 2,
      cursor: first.nextCursor ?? '',
    });
    expect(second.data.map((thread) => thread.root.content)).toEqual(['one']);
    expect(second.nextCursor).toBeNull();
  });

  it('needs pm.issues comment, and seeing the issue', async () => {
    const issue = await anIssue();
    await expect(
      h.services.comments.create(reader(), issue.id, { content: 'Hi' }),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
    const project = await h.services.projects.create(lead(), {
      name: 'Secret',
      visibility: 'members',
    });
    const hidden = await h.services.issues.create(lead(), {
      title: 'Hidden',
      projectId: project.id,
    });
    await expect(
      h.services.comments.create(bob(), hidden.id, { content: 'Hi' }),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });
});

describe('editing and deleting', () => {
  it('lets the author edit, and nobody else', async () => {
    const issue = await anIssue();
    const { comment } = await h.services.comments.create(bob(), issue.id, {
      content: 'Typo',
    });
    await expect(
      h.services.comments.update(admin(), comment.id, { content: 'Mine' }),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
    const edited = await h.services.comments.update(bob(), comment.id, {
      content: 'Fixed',
    });
    expect(edited).toMatchObject({ content: 'Fixed' });
    expect(edited.editedAt).not.toBeNull();
  });

  it('lets the author, the issue owner and an administrator delete, and leaves a tombstone', async () => {
    const issue = await anIssue();
    const root = await h.services.comments.create(bob(), issue.id, {
      content: 'Root',
    });
    await h.services.comments.create(alice(), issue.id, {
      content: 'Reply',
      parentId: root.comment.id,
    });
    await h.services.comments.react(alice(), root.comment.id, '👍');
    const other = await h.services.comments.create(bob(), issue.id, {
      content: 'Other',
    });
    await expect(
      h.services.comments.remove(lead(), other.comment.id),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
    // alice owns the issue.
    await h.services.comments.remove(alice(), root.comment.id);
    await h.services.comments.remove(alice(), root.comment.id);
    await h.services.comments.remove(admin(), other.comment.id);
    const page = await h.services.commentQueries.threads(alice(), issue.id, {});
    expect(page.data[0]?.root).toMatchObject({
      deleted: true,
      content: '',
      reactions: [],
    });
    expect(page.data[0]?.replies).toHaveLength(1);
    const detail = await h.services.issueQueries.detail(alice(), issue.id);
    expect(
      detail.activities.filter((row) => row.action === 'comment_deleted'),
    ).toHaveLength(2);
  });

  it('does not edit or react to a deleted comment', async () => {
    const issue = await anIssue();
    const { comment } = await h.services.comments.create(bob(), issue.id, {
      content: 'Gone',
    });
    await h.services.comments.remove(bob(), comment.id);
    await expect(
      h.services.comments.update(bob(), comment.id, { content: 'Back' }),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    await expect(
      h.services.comments.react(bob(), comment.id, '👍'),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });
});

describe('reactions and threads', () => {
  it('adds and removes reactions from the fixed set', async () => {
    const issue = await anIssue();
    const { comment } = await h.services.comments.create(bob(), issue.id, {
      content: 'Ship it',
    });
    await h.services.comments.react(reader(), comment.id, '🎉');
    const twice = await h.services.comments.react(alice(), comment.id, '🎉');
    expect(await h.services.comments.react(alice(), comment.id, '🎉')).toEqual(
      twice,
    );
    expect(twice).toEqual([
      { emoji: '🎉', count: 2, userIds: ['bob', 'alice'] },
    ]);
    await expect(
      h.services.comments.react(alice(), comment.id, '💩'),
    ).rejects.toMatchObject({ code: 'INVALID_EMOJI' });
    expect(
      await h.services.comments.unreact(alice(), comment.id, '👍'),
    ).toEqual(twice);
    expect(
      await h.services.comments.unreact(alice(), comment.id, '🎉'),
    ).toEqual([{ emoji: '🎉', count: 1, userIds: ['bob'] }]);
  });

  it('resolves a thread root once, with comment rights', async () => {
    const issue = await anIssue();
    const root = await h.services.comments.create(bob(), issue.id, {
      content: 'Root',
    });
    const reply = await h.services.comments.create(alice(), issue.id, {
      content: 'Reply',
      parentId: root.comment.id,
    });
    await expect(
      h.services.comments.resolve(alice(), reply.comment.id, true),
    ).rejects.toMatchObject({ code: 'NOT_THREAD_ROOT' });
    await expect(
      h.services.comments.resolve(reader(), root.comment.id, true),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
    const resolved = await h.services.comments.resolve(
      alice(),
      root.comment.id,
      true,
    );
    expect(resolved.resolvedById).toBe('alice');
    await h.services.comments.resolve(alice(), root.comment.id, true);
    const detail = await h.services.issueQueries.detail(alice(), issue.id);
    expect(
      detail.activities.filter((row) => row.action === 'thread_resolved'),
    ).toHaveLength(1);
    expect(detail.threads[0]?.root.resolvedByName).toBe('alice');
    await h.services.comments.resolve(alice(), root.comment.id, false);
    expect(
      (await h.services.commentQueries.threads(alice(), issue.id, {})).data[0]
        ?.root.resolvedAt,
    ).toBeNull();
  });
});

describe('mentions and triggers', () => {
  it('refuses a mention a kind forbids, and ignores unknown kinds', async () => {
    h.services.kinds.add({
      key: 'bot',
      mention: {
        candidates: () =>
          Promise.resolve([{ kind: 'bot', id: 'b1', name: 'Builder' }]),
        mayMention: (_conn, id) => Promise.resolve(id !== 'secret'),
      },
    });
    const issue = await anIssue();
    await expect(
      h.services.comments.create(bob(), issue.id, {
        content: '[@Secret](mention://bot/secret)',
      }),
    ).rejects.toMatchObject({ code: 'MENTION_FORBIDDEN' });
    await h.services.comments.create(bob(), issue.id, {
      content: '[@B](mention://bot/b1) [@X](mention://ghost/x)',
    });
    const candidates = await h.services.commentQueries.mentionCandidates(
      bob(),
      { q: '', issueId: issue.id },
    );
    expect(candidates[0]).toEqual({ kind: 'bot', id: 'b1', name: 'Builder' });
    expect(candidates.map((candidate) => candidate.id)).toContain('alice');
  });

  it('tells the triggers of a person’s comment that is not a note, in its transaction', async () => {
    const seen: string[] = [];
    const triggers: IssueTriggers = {
      onIssueChanged: () => Promise.resolve(),
      onCommentCreated: (_tx, change) => {
        seen.push(change.comment.content);
        return Promise.resolve(
          change.mentions.filter((ref) => ref.kind === 'bot') as MentionRef[],
        );
      },
    };
    const services = createProjects({
      database: h.database,
      idGenerator: { generateString: () => crypto.randomUUID() },
      access: {
        permissionsOf: (identity) =>
          Promise.resolve(permissionsOf('member', identity.principal.id)),
        admit: () => Promise.resolve(),
        changed: () => Promise.resolve(),
        administrators: () => Promise.resolve([]),
      },
      invitations: h.invitations,
      triggers: () => triggers,
    });
    services.kinds.add({
      key: 'bot',
      mention: { candidates: () => Promise.resolve([]) },
    });
    const issue = await services.issues.create(alice(), { title: 'Bots' });
    const woke = await services.comments.create(alice(), issue.id, {
      content: 'Go [@B](mention://bot/b1)',
    });
    expect(woke.triggered).toEqual([{ kind: 'bot', id: 'b1' }]);
    await services.comments.create(alice(), issue.id, {
      content: '/note later',
    });
    await services.comments.post(
      { type: 'bot', id: 'b1' },
      issue.id,
      { content: 'Done' },
      { origin: { runId: 'r1' } },
    );
    expect(seen).toEqual(['Go [@B](mention://bot/b1)']);
  });

  it('writes a plugin’s comment of its own kind, in the caller’s transaction', async () => {
    const issue = await anIssue();
    expect(() =>
      h.services.comments.post({ type: 'ghost', id: 'g' }, issue.id, {
        content: 'Boo',
      }),
    ).toThrow(TypeError);
    const written = await h.services.tx.run((tx) =>
      h.services.comments.post(
        { type: 'system', id: null },
        issue.id,
        { content: 'Summary' },
        { outer: tx, kind: 'summary', trigger: false },
      ),
    );
    expect(written.comment).toMatchObject({
      kind: 'summary',
      authorType: 'system',
    });
    const listed = await h.services.commentQueries.list(
      h.database.connection(),
      issue.id,
    );
    expect(listed.map((comment) => comment.kind)).toEqual(['summary']);
  });
});
