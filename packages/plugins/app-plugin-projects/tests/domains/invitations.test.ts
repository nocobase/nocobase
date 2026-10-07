// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createHarness, type Harness } from '../harness.js';

const ORIGIN = 'https://example.test';

let h: Harness;
let apollo: string;
let zeus: string;

beforeEach(async () => {
  h = await createHarness();
  for (const id of ['admin', 'lead', 'alice']) await h.addUser(id, id);
  apollo = (
    await h.services.projects.create(h.viewer('lead'), { name: 'Apollo' })
  ).id;
  zeus = (
    await h.services.projects.create(h.viewer('admin', 'admin'), {
      name: 'Zeus',
    })
  ).id;
});
afterEach(() => h.close());

const invite = (
  viewer: ReturnType<Harness['viewer']>,
  emails: string[],
  projectIds?: string[],
) =>
  h.services.invitations.create(
    viewer,
    { emails, ...(projectIds ? { projectIds } : {}) },
    ORIGIN,
  );

describe('inviting', () => {
  it('sends links to new addresses and adds existing accounts to the projects', async () => {
    const results = await invite(
      h.viewer('admin', 'admin'),
      ['new@example.com', 'alice@example.com'],
      [apollo],
    );
    expect(results).toEqual([
      { email: 'new@example.com', outcome: 'invited', emailSent: true },
      { email: 'alice@example.com', outcome: 'added' },
    ]);
    expect(h.invitations.rows[0]).toMatchObject({
      data: { '@nocobase/app-plugin-projects': { projectIds: [apollo] } },
      summary: ['Apollo'],
    });
    const detail = await h.services.projects.get(h.viewer('lead'), apollo);
    expect(detail.members.map((member) => member.id).sort()).toEqual([
      'alice',
      'lead',
    ]);
    expect(
      await invite(h.viewer('admin', 'admin'), ['alice@example.com'], [apollo]),
    ).toEqual([{ email: 'alice@example.com', outcome: 'alreadyMember' }]);
  });

  it('lets a lead invite only into projects they lead', async () => {
    await expect(
      invite(h.viewer('lead'), ['new@example.com'], [apollo]),
    ).resolves.toHaveLength(1);
    await expect(
      invite(h.viewer('lead'), ['new@example.com']),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
    await expect(
      invite(h.viewer('lead'), ['new@example.com'], [zeus]),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
    await expect(
      invite(h.viewer('alice'), ['new@example.com'], [apollo]),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
    await expect(
      invite(h.viewer('admin', 'admin'), ['new@example.com'], ['missing']),
    ).rejects.toMatchObject({ code: 'INVALID_PROJECT' });
  });
});

describe('managing invitations', () => {
  it('shows a lead their own invitations and a manager every one', async () => {
    await invite(h.viewer('lead'), ['one@example.com'], [apollo]);
    await invite(h.viewer('admin', 'admin'), ['two@example.com'], [zeus]);
    // Someone else's invitation, sent from the users page: not this plugin's.
    await h.invitations.invite({
      emails: ['other@example.com'],
      invitedBy: 'admin',
    });

    const own = await h.services.invitations.list(h.viewer('lead'));
    expect(own.map((row) => [row.email, row.projects])).toEqual([
      ['one@example.com', [{ id: apollo, name: 'Apollo' }]],
    ]);
    const all = await h.services.invitations.list(h.viewer('admin', 'admin'));
    expect(all.map((row) => row.email)).toEqual([
      'one@example.com',
      'two@example.com',
    ]);

    const theirs = all[1]?.id ?? '';
    await expect(
      h.services.invitations.revoke(h.viewer('lead'), theirs),
    ).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
    await expect(
      h.services.invitations.resend(h.viewer('admin', 'admin'), theirs, ORIGIN),
    ).resolves.toMatchObject({
      outcome: 'invited',
      emailSent: false,
      inviteUrl: expect.stringContaining('/invite/'),
    });
    await h.services.invitations.revoke(h.viewer('admin', 'admin'), theirs);
    expect(
      await h.services.invitations.list(h.viewer('admin', 'admin')),
    ).toHaveLength(1);
  });
});

describe('accepting', () => {
  it('makes the invitee a member of the workspace and of the projects that still exist', async () => {
    await invite(
      h.viewer('admin', 'admin'),
      ['new@example.com'],
      [apollo, zeus],
    );
    await h.services.projects.remove(h.viewer('admin', 'admin'), zeus);

    await h.invitations.accept(h.invitations.rows[0]?.id ?? '', 'newbie');

    expect(h.admitted).toEqual(['newbie']);
    const detail = await h.services.projects.get(h.viewer('lead'), apollo);
    expect(detail.members.map((member) => member.id).sort()).toEqual([
      'lead',
      'newbie',
    ]);
  });

  it('ignores invitations that carry nothing of this plugin', async () => {
    await h.invitations.invite({
      emails: ['other@example.com'],
      invitedBy: 'admin',
    });
    await h.invitations.accept(h.invitations.rows[0]?.id ?? '', 'other');
    expect(h.admitted).toEqual([]);
  });
});
