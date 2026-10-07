// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { Viewer } from '../../server/access/viewer.js';
import { DomainError } from '../../server/kernel/errors.js';
import { ATTACHMENT_SIZE_MAX } from '../../shared/attachments.js';
import type { Issue } from '../../shared/issues.js';
import { createHarness, type Harness } from '../harness.js';

let h: Harness;
beforeEach(async () => {
  h = await createHarness();
  for (const id of ['admin', 'alice', 'bob', 'carol']) await h.addUser(id, id);
});
afterEach(() => h.close());

const alice = () => h.viewer('alice');
const bob = () => h.viewer('bob');
const admin = () => h.viewer('admin', 'admin');
/** A member whose role holds no `pm.attachments` `upload`. */
const withoutUpload = (viewer: Viewer): Viewer => ({
  ...viewer,
  permissions: {
    ...viewer.permissions,
    scopes: { ...viewer.permissions.scopes, 'pm.attachments/upload': 'none' },
  },
});

const png = (name = 'shot.png') =>
  new File([new Uint8Array([137, 80, 78, 71])], name, { type: 'image/png' });
const log = (name = 'build.log') =>
  new File(['line 1\nline 2\n'], name, { type: 'text/plain' });

async function anIssue(): Promise<Issue> {
  return h.services.issues.create(alice(), { title: 'Fix login' });
}

async function codeOf(promise: Promise<unknown>): Promise<string> {
  try {
    await promise;
  } catch (error) {
    if (error instanceof DomainError) return error.code;
    throw error;
  }
  return 'OK';
}

async function text(stream: ReadableStream<Uint8Array>): Promise<string> {
  return new Response(stream).text();
}

describe('uploads', () => {
  it('keeps an upload attached to nothing to its uploader', async () => {
    const file = await h.services.attachments.upload(alice(), log());
    expect(file).toMatchObject({
      filename: 'build.log',
      ext: 'log',
      mimeType: 'text/plain',
      size: 14,
      issueId: null,
      commentId: null,
      uploader: { type: 'user', id: 'alice', name: 'alice' },
      previewable: false,
      contentUrl: `/app/api/projects/attachments/${file.id}/content`,
      downloadUrl: `/app/api/projects/attachments/${file.id}/content?download=true`,
    });
    const content = await h.services.attachments.content(alice(), file.id);
    expect(await text(content.body)).toBe('line 1\nline 2\n');
    expect(await codeOf(h.services.attachments.content(bob(), file.id))).toBe(
      'NOT_FOUND',
    );
  });

  it('needs the upload action and refuses files over the limit', async () => {
    expect(
      await codeOf(
        h.services.attachments.upload(withoutUpload(alice()), log()),
      ),
    ).toBe('FORBIDDEN');
    const big = new File([new Uint8Array(ATTACHMENT_SIZE_MAX + 1)], 'big.bin');
    expect(await codeOf(h.services.attachments.upload(alice(), big))).toBe(
      'FILE_TOO_LARGE',
    );
  });

  it('previews only raster images whose type matches their extension', async () => {
    const image = await h.services.attachments.upload(alice(), png());
    const svg = await h.services.attachments.upload(
      alice(),
      new File(['<svg/>'], 'logo.svg', { type: 'image/svg+xml' }),
    );
    const disguised = await h.services.attachments.upload(
      alice(),
      new File(['<html>'], 'page.html', { type: 'image/png' }),
    );
    expect([image.previewable, svg.previewable, disguised.previewable]).toEqual(
      [true, false, false],
    );
  });
});

describe('an issue’s own files', () => {
  it('uploads onto the issue, lists them and records the activity', async () => {
    const issue = await anIssue();
    const file = await h.services.attachments.uploadToIssue(
      bob(),
      issue.identifier,
      png(),
    );
    expect(file).toMatchObject({
      issueId: issue.id,
      commentId: null,
      canDelete: true,
    });
    const listed = await h.services.attachments.list(alice(), issue.id);
    expect(listed.map((item) => [item.filename, item.canDelete])).toEqual([
      // Alice owns the issue: she may remove what others attached.
      ['shot.png', true],
    ]);
    const detail = await h.services.issueQueries.detail(alice(), issue.id);
    expect(detail.attachments.map((item) => item.id)).toEqual([file.id]);
    expect(
      detail.activities.find((item) => item.action === 'attachment_added'),
    ).toMatchObject({
      actorId: 'bob',
      details: { filenames: ['shot.png'], attachmentIds: [file.id] },
    });
    const content = await h.services.attachments.content(alice(), file.id);
    expect(content.attachment.previewable).toBe(true);
  });

  it('needs edit on the issue', async () => {
    const issue = await anIssue();
    const reader: Viewer = {
      ...bob(),
      permissions: {
        ...bob().permissions,
        scopes: { ...bob().permissions.scopes, 'pm.issues/edit': 'none' },
      },
    };
    expect(
      await codeOf(
        h.services.attachments.uploadToIssue(reader, issue.id, png()),
      ),
    ).toBe('FORBIDDEN');
    expect(h.stored.size).toBe(0);
  });

  it('lets the uploader or a moderator remove one, and deletes its bytes', async () => {
    const issue = await anIssue();
    const mine = await h.services.attachments.uploadToIssue(
      bob(),
      issue.id,
      png(),
    );
    const theirs = await h.services.attachments.uploadToIssue(
      alice(),
      issue.id,
      log(),
    );
    // Bob neither uploaded it nor owns the issue.
    expect(await codeOf(h.services.attachments.remove(bob(), theirs.id))).toBe(
      'FORBIDDEN',
    );
    await h.services.attachments.remove(bob(), mine.id);
    await h.services.attachments.remove(admin(), theirs.id);
    expect(await h.services.attachments.list(alice(), issue.id)).toEqual([]);
    expect(h.stored.size).toBe(0);
    const detail = await h.services.issueQueries.detail(alice(), issue.id);
    expect(
      detail.activities
        .filter((item) => item.action === 'attachment_removed')
        .map((item) => item.details.filename),
    ).toEqual(['shot.png', 'build.log']);
  });

  it('hides files of an issue the reader may not see', async () => {
    const project = await h.services.projects.create(alice(), {
      name: 'Private',
      visibility: 'members',
    });
    const issue = await h.services.issues.create(alice(), {
      title: 'Secret',
      projectId: project.id,
    });
    const file = await h.services.attachments.uploadToIssue(
      alice(),
      issue.id,
      png(),
    );
    expect(await codeOf(h.services.attachments.content(bob(), file.id))).toBe(
      'NOT_FOUND',
    );
    expect(await codeOf(h.services.attachments.list(bob(), issue.id))).toBe(
      'NOT_FOUND',
    );
  });
});

describe('a comment’s files', () => {
  it('sends the commenter’s uploads with the comment, readable by whoever sees the issue', async () => {
    const issue = await anIssue();
    const shot = await h.services.attachments.upload(bob(), png());
    const output = await h.services.attachments.upload(bob(), log());
    const { comment } = await h.services.comments.create(bob(), issue.id, {
      content: 'Fails like this.',
      attachmentIds: [shot.id, output.id],
    });
    expect(
      comment.attachments.map((item) => [item.filename, item.commentId]),
    ).toEqual([
      ['shot.png', comment.id],
      ['build.log', comment.id],
    ]);
    const detail = await h.services.issueQueries.detail(alice(), issue.id);
    expect(detail.attachments).toEqual([]);
    expect(detail.threads[0]?.root.attachments).toHaveLength(2);
    const content = await h.services.attachments.content(alice(), output.id);
    expect(await text(content.body)).toBe('line 1\nline 2\n');
    expect(
      detail.activities.find((item) => item.action === 'comment_added')
        ?.details,
    ).toMatchObject({ attachmentCount: 2 });
    // A comment's files go with the comment.
    expect(await codeOf(h.services.attachments.remove(bob(), shot.id))).toBe(
      'COMMENT_ATTACHMENT',
    );
  });

  it('refuses someone else’s upload, or one already attached, and writes nothing', async () => {
    const issue = await anIssue();
    const alices = await h.services.attachments.upload(alice(), png());
    expect(
      await codeOf(
        h.services.comments.create(bob(), issue.id, {
          content: 'Mine now',
          attachmentIds: [alices.id],
        }),
      ),
    ).toBe('INVALID_ATTACHMENT');
    const own = await h.services.attachments.upload(bob(), png());
    await h.services.comments.create(bob(), issue.id, {
      content: 'First',
      attachmentIds: [own.id],
    });
    expect(
      await codeOf(
        h.services.comments.create(bob(), issue.id, {
          content: 'Again',
          attachmentIds: [own.id],
        }),
      ),
    ).toBe('INVALID_ATTACHMENT');
    expect(
      await codeOf(
        h.services.comments.create(withoutUpload(bob()), issue.id, {
          content: 'No right',
          attachmentIds: [own.id],
        }),
      ),
    ).toBe('FORBIDDEN');
    const detail = await h.services.issueQueries.detail(alice(), issue.id);
    expect(detail.threads.map((thread) => thread.root.content)).toEqual([
      'First',
    ]);
  });

  it('hides a deleted comment’s files, and the purge deletes them', async () => {
    const issue = await anIssue();
    const shot = await h.services.attachments.upload(bob(), png());
    const { comment } = await h.services.comments.create(bob(), issue.id, {
      content: 'Oops',
      attachmentIds: [shot.id],
    });
    await h.services.comments.remove(bob(), comment.id);
    expect(await codeOf(h.services.attachments.content(alice(), shot.id))).toBe(
      'NOT_FOUND',
    );
    const detail = await h.services.issueQueries.detail(alice(), issue.id);
    expect(detail.threads[0]?.root.attachments).toEqual([]);
    expect(await h.services.attachments.purge()).toBe(1);
    expect(h.stored.size).toBe(0);
  });
});

describe('the purge', () => {
  it('deletes uploads attached to nothing for a day, and keeps the rest', async () => {
    const issue = await anIssue();
    const old = await h.services.attachments.upload(alice(), log('old.log'));
    const fresh = await h.services.attachments.upload(alice(), log('new.log'));
    const kept = await h.services.attachments.uploadToIssue(
      alice(),
      issue.id,
      png(),
    );
    await h.database
      .connection()
      .repository('pmAttachments')
      .updateMany({
        filter: (f) => f.string('id').ne(fresh.id),
        values: { createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000) },
      });
    expect(await h.services.attachments.purge()).toBe(1);
    expect(await codeOf(h.services.attachments.content(alice(), old.id))).toBe(
      'NOT_FOUND',
    );
    expect(
      await codeOf(h.services.attachments.content(alice(), fresh.id)),
    ).toBe('OK');
    expect(await codeOf(h.services.attachments.content(alice(), kept.id))).toBe(
      'OK',
    );
  });

  it('discards only the caller’s own uploads attached to nothing', async () => {
    const own = await h.services.attachments.upload(bob(), log());
    const alices = await h.services.attachments.upload(alice(), log());
    await h.services.attachments.discard(bob(), [own.id, alices.id]);
    expect(await codeOf(h.services.attachments.content(bob(), own.id))).toBe(
      'NOT_FOUND',
    );
    expect(
      await codeOf(h.services.attachments.content(alice(), alices.id)),
    ).toBe('OK');
  });
});
