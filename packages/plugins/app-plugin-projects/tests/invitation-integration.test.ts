// @vitest-environment node
import {
  signIn,
  DEFAULT_ADMIN_CREDENTIALS,
  type TestSession,
} from '@nocobase/app-plugin-authentication/testing';
import {
  userManagementServiceToken,
  type UserInvitation,
} from '@nocobase/app-plugin-users/server';
import { createAppTest } from '@nocobase/app-testing/server';
import { databaseManagerToken } from '@nocobase/db';
import { expect, vi } from 'vitest';
import { notificationServiceToken } from '@nocobase/app-plugin-notification/server';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';

import {
  createInvitationServer,
  invitationMailboxToken,
} from './helpers/invitation-app.js';
import type { InvitationResult } from '../shared/invitations.js';
import type { ProjectDetail } from '../shared/projects.js';

const test = createAppTest({ createServer: createInvitationServer });

function post(body: unknown): RequestInit {
  return {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'http://localhost' },
    body: JSON.stringify(body),
  };
}

async function readData<T>(response: Response, status = 200): Promise<T> {
  const body: { data: T } = await response.json();
  expect(response.status).toBe(status);
  return body.data;
}

async function invite(
  admin: TestSession,
  email: string,
  projectId: string,
): Promise<string> {
  const { results } = await readData<{ results: InvitationResult[] }>(
    await admin.fetch(
      '/projects/invitations',
      post({ emails: [email], projectIds: [projectId] }),
    ),
    201,
  );
  const url = results[0]?.inviteUrl;
  expect(url).toContain('/main/invite/');
  if (!url) throw new Error('The invitation did not return a link.');
  return new URL(url).pathname.split('/').at(-1) ?? '';
}

test('accepts same-origin invitations with unrelated cookies without configuring publicOrigin or trustedOrigins', async ({
  testApp,
  request,
}) => {
  const admin = await signIn(testApp, DEFAULT_ADMIN_CREDENTIALS);
  const { results } = await readData<{ results: InvitationResult[] }>(
    await admin.fetch(
      '/projects/invitations',
      post({ emails: ['cookie-invite@example.test'] }),
    ),
    201,
  );
  const inviteUrl = results[0]?.inviteUrl;
  expect(inviteUrl).toMatch(/^http:\/\/localhost\/main\/invite\//u);
  const input = {
    token: inviteUrl?.split('/').at(-1),
    name: 'Cookie invitee',
    password: 'cookie-invitation-password',
  };
  const accept = (origin: string) =>
    request('/users/invitations/accept', {
      ...post(input),
      headers: {
        'content-type': 'application/json',
        cookie: 'analytics=unrelated',
        origin,
      },
    });
  const refused = await accept('https://evil.example');
  expect(refused.status).toBe(403);
  expect(await refused.json()).toMatchObject({
    error: { reason: 'INVALID_CSRF_ORIGIN' },
  });
  expect(await readData(await accept('http://localhost'))).toMatchObject({
    email: 'cookie-invite@example.test',
    existingAccount: false,
  });
});

test('accepts each project invitation through real sessions without consuming or granting the other one', async ({
  testApp,
  request,
}) => {
  const admin = await signIn(testApp, {
    email: DEFAULT_ADMIN_CREDENTIALS.email,
    password: DEFAULT_ADMIN_CREDENTIALS.password,
  });
  const firstProject = await readData<ProjectDetail>(
    await admin.fetch(
      '/projects',
      post({ name: 'First private project', visibility: 'members' }),
    ),
    201,
  );
  const secondProject = await readData<ProjectDetail>(
    await admin.fetch(
      '/projects',
      post({ name: 'Second private project', visibility: 'members' }),
    ),
    201,
  );
  const email = 'two-invitations@example.test';
  const password = 'original-invitation-password';
  const firstToken = await invite(admin, email, firstProject.id);
  const secondToken = await invite(admin, email, secondProject.id);
  const input = (token: string, nextPassword = password) => ({
    token,
    name: 'Invitee',
    password: nextPassword,
  });

  expect((await request('/projects')).status).toBe(401);
  await readData(
    await request('/users/invitations/accept', post(input(firstToken))),
  );
  const invitee = await signIn(testApp, { email, password });
  const firstMembers = await readData<ProjectDetail>(
    await admin.fetch(`/projects/${firstProject.id}`),
  );
  const secondMembers = await readData<ProjectDetail>(
    await admin.fetch(`/projects/${secondProject.id}`),
  );
  expect(firstMembers.members.map((member) => member.id)).toContain(
    invitee.user.id,
  );
  expect(secondMembers.members.map((member) => member.id)).not.toContain(
    invitee.user.id,
  );
  expect((await invitee.fetch(`/projects/${secondProject.id}`)).status).toBe(
    404,
  );

  for (const call of [request, admin.fetch]) {
    const refused = await call(
      '/users/invitations/accept',
      post(input(secondToken)),
    );
    expect(refused.status).toBe(400);
    expect(await refused.json()).toMatchObject({
      error: { reason: 'INVITATION_SIGN_IN_REQUIRED' },
    });
    await readData(
      await request('/users/invitations/lookup', post({ token: secondToken })),
    );
  }
  // A caller cannot substitute an identity in the request body.
  const forged = await request(
    '/users/invitations/accept',
    post({ ...input(secondToken), authenticatedUserId: invitee.user.id }),
  );
  expect(forged.status).toBe(400);
  expect(await forged.json()).toMatchObject({
    error: { reason: 'INVALID_INPUT' },
  });

  const untrusted = await invitee.fetch('/users/invitations/accept', {
    ...post(input(secondToken, '')),
    headers: {
      'content-type': 'application/json',
      origin: 'https://untrusted.example',
    },
  });
  expect(untrusted.status).toBe(403);
  expect(await untrusted.json()).toMatchObject({
    error: { reason: 'INVALID_CSRF_ORIGIN' },
  });
  await readData(
    await request('/users/invitations/lookup', post({ token: secondToken })),
  );

  await readData(
    await invitee.fetch(
      '/users/invitations/accept',
      post(input(secondToken, '')),
    ),
  );
  const joined = await readData<ProjectDetail>(
    await invitee.fetch(`/projects/${secondProject.id}`),
  );
  expect(joined.members.map((member) => member.id)).toContain(invitee.user.id);
  expect((await signIn(testApp, { email, password })).user.id).toBe(
    invitee.user.id,
  );
  const duplicate = await invitee.fetch(
    '/users/invitations/accept',
    post(input(secondToken, '')),
  );
  expect(duplicate.status).toBe(400);
  expect(await duplicate.json()).toMatchObject({
    error: { reason: 'INVITATION_ACCEPTED' },
  });
  const pending = await readData<UserInvitation[]>(
    await admin.fetch('/users/invitations'),
  );
  expect(pending.filter((invitation) => invitation.email === email)).toEqual(
    [],
  );
});

test('rotates project links only through their domain and never accepts an old or revoked token', async ({
  testApp,
  request,
}) => {
  const admin = await signIn(testApp, {
    email: DEFAULT_ADMIN_CREDENTIALS.email,
    password: DEFAULT_ADMIN_CREDENTIALS.password,
  });
  const project = await readData<ProjectDetail>(
    await admin.fetch('/projects', post({ name: 'Rotating project' })),
    201,
  );
  const email = 'rotation@example.test';
  const oldToken = await invite(admin, email, project.id);
  const invitations = await readData<UserInvitation[]>(
    await admin.fetch('/users/invitations'),
  );
  const invitation = invitations.find((row) => row.email === email);
  if (!invitation) throw new Error('Missing pending invitation.');
  const blocked = await admin.fetch(
    `/users/invitations/${invitation.id}/resend?sendEmail=false`,
    post({}),
  );
  expect(blocked.status).toBe(403);
  expect(await blocked.json()).toMatchObject({
    error: { reason: 'INVITATION_LINK_FORBIDDEN' },
  });
  await readData(
    await request('/users/invitations/lookup', post({ token: oldToken })),
  );
  const rotated = await readData<InvitationResult>(
    await admin.fetch(
      `/projects/invitations/${invitation.id}/resend?sendEmail=false`,
      post({}),
    ),
  );
  expect(rotated.emailSent).toBe(false);
  const token = rotated.inviteUrl?.split('/').at(-1);
  expect(token).toBeTruthy();
  expect(token).not.toBe(oldToken);
  const stale = await request(
    '/users/invitations/accept',
    post({ token: oldToken, name: 'Invitee', password: 'secret-password' }),
  );
  expect(stale.status).toBe(400);
  expect(await stale.json()).toMatchObject({
    error: { reason: 'INVITATION_NOT_FOUND' },
  });
  expect(
    (
      await admin.fetch(`/projects/invitations/${invitation.id}`, {
        method: 'DELETE',
        headers: { origin: 'http://localhost' },
      })
    ).status,
  ).toBe(204);
  const revoked = await request(
    '/users/invitations/accept',
    post({ token, name: 'Invitee', password: 'secret-password' }),
  );
  expect(revoked.status).toBe(400);
  expect(await revoked.json()).toMatchObject({
    error: { reason: 'INVITATION_REVOKED' },
  });
  const users = testApp.application.container.resolve(
    userManagementServiceToken,
  );
  expect((await users.getInvitation(invitation.id))?.status).toBe('revoked');
});

test('lets project leads deliver invitations without email while preserving project isolation', async ({
  testApp,
  request,
}) => {
  const admin = await signIn(testApp, DEFAULT_ADMIN_CREDENTIALS);
  const password = 'test-invitation-password';
  const leadEmail = 'project-lead@example.test';
  await readData(
    await admin.fetch(
      '/users',
      post({ name: 'Lead', email: leadEmail, password }),
    ),
    201,
  );
  const lead = await signIn(testApp, { email: leadEmail, password });
  const project = await readData<ProjectDetail>(
    await lead.fetch(
      '/projects',
      post({ name: 'Lead project', visibility: 'members' }),
    ),
    201,
  );
  const privateProject = await readData<ProjectDetail>(
    await admin.fetch(
      '/projects',
      post({ name: 'Private project', visibility: 'members' }),
    ),
    201,
  );
  const mailbox = testApp.application.container.resolve(invitationMailboxToken);
  const users = testApp.application.container.resolve(
    userManagementServiceToken,
  );
  const email = 'recipient@example.test';
  // Inviting into a managed project does not grant direct account administration access.
  expect(
    (await lead.fetch('/users', post({ name: 'Victim', email, password })))
      .status,
  ).toBe(403);
  expect(
    (
      await request(
        '/auth/sign-up/email',
        post({ name: 'Victim', email, password }),
      )
    ).status,
  ).toBe(400);
  for (const emailSent of [true, false]) {
    mailbox.fail = !emailSent;
    const created = await readData<{ results: InvitationResult[] }>(
      await lead.fetch(
        '/projects/invitations',
        post({ emails: [email], projectIds: [project.id] }),
      ),
      201,
    );
    expect(created.results).toEqual([
      {
        email,
        outcome: 'invited',
        emailSent,
        inviteUrl: expect.stringContaining('/invite/'),
      },
    ]);
    const invitations = await users.listInvitations({
      invitedBy: lead.user.id,
    });
    const invitation = invitations[0];
    if (!invitation) throw new Error('Missing invitation');
    const resent = await readData<InvitationResult>(
      await lead.fetch(
        `/projects/invitations/${invitation.id}/resend`,
        post({}),
      ),
    );
    expect(resent).toEqual({
      email,
      outcome: 'invited',
      emailSent,
      inviteUrl: expect.stringContaining('/invite/'),
    });
    const copy = await lead.fetch(
      `/projects/invitations/${invitation.id}/resend?sendEmail=false`,
      post({}),
    );
    expect(copy.status).toBe(200);
    expect((await users.list({ search: email })).items).toEqual([]);
  }
  mailbox.fail = true;
  const first = (await users.listInvitations({ invitedBy: lead.user.id }))[0];
  if (!first) throw new Error('Missing invitation');
  const copied = await readData<InvitationResult>(
    await lead.fetch(
      `/projects/invitations/${first.id}/resend?sendEmail=false`,
      post({}),
    ),
  );
  const token = copied.inviteUrl?.split('/').at(-1);
  await readData(
    await request(
      '/users/invitations/accept',
      post({ token, name: 'Recipient', password }),
    ),
  );
  const recipient = await signIn(testApp, { email, password });
  expect((await recipient.fetch(`/projects/${project.id}`)).status).toBe(200);
  expect((await recipient.fetch(`/projects/${privateProject.id}`)).status).toBe(
    404,
  );
  // Once the real recipient owns the account, the pre-existing direct-add behavior still works.
  const joined = await readData<{ results: InvitationResult[] }>(
    await admin.fetch(
      '/projects/invitations',
      post({ emails: [email], projectIds: [privateProject.id] }),
    ),
    201,
  );
  expect(joined.results).toEqual([{ email, outcome: 'added' }]);
  expect((await recipient.fetch(`/projects/${privateProject.id}`)).status).toBe(
    200,
  );
  expect((await lead.fetch(`/projects/${privateProject.id}`)).status).toBe(404);
});

test('a member inviter can copy and rotate invitations without global account creation', async ({
  testApp,
  request,
}) => {
  const role = 'member-inviter';
  const root = await signIn(testApp, DEFAULT_ADMIN_CREDENTIALS);
  const email = `studio-${role}@example.test`;
  const password = 'studio-role-password';
  const account = await readData<{ id: string }>(
    await root.fetch('/users', post({ email, name: role, password })),
    201,
  );
  const authz = testApp.application.container.resolve(authorizationToken);
  // Grant only the members setting, without global user/create or user/assign-role.
  await authz.permissionSets.create({
    key: role,
    grants: [
      {
        resource: { type: 'settings', id: 'pm.members' },
        actions: [
          { action: 'read' },
          { action: 'invite' },
          { action: 'assign' },
          { action: 'define-roles' },
        ],
      },
    ],
  });
  await authz.permissionSets.assign({
    subject: { type: 'user', id: account.id },
    permissionSet: role,
  });
  const session = await signIn(testApp, { email, password });
  expect(
    (
      await session.fetch(
        '/users',
        post({ email: 'blocked@example.test', name: 'Blocked', password }),
      )
    ).status,
  ).toBe(403);
  const created = await readData<{ results: InvitationResult[] }>(
    await session.fetch(
      '/projects/invitations',
      post({ emails: [`recipient-${role}@example.test`] }),
    ),
    201,
  );
  const oldToken = created.results[0]?.inviteUrl?.split('/').at(-1);
  expect(oldToken).toBeTruthy();
  const users = testApp.application.container.resolve(
    userManagementServiceToken,
  );
  const pending = (await users.listInvitations({ invitedBy: account.id }))[0];
  if (!pending) throw new Error('Missing invitation');
  const rotated = await readData<InvitationResult>(
    await session.fetch(
      `/projects/invitations/${pending.id}/resend?sendEmail=false`,
      post({}),
    ),
  );
  expect(rotated.inviteUrl).toBeTruthy();
  expect(rotated.emailSent).toBe(false);
  expect(rotated.inviteUrl).not.toBe(created.results[0]?.inviteUrl);
  expect(
    (await request('/users/invitations/lookup', post({ token: oldToken })))
      .status,
  ).toBe(400);
  const sharedToken = rotated.inviteUrl?.split('/').at(-1);
  expect(
    (
      await request(
        '/users/invitations/accept',
        post({ token: sharedToken, name: 'Recipient', password }),
      )
    ).status,
  ).toBe(200);
});

test('an account administrator delivers a project invitation without working email and does not verify its email', async ({
  testApp,
  request,
}) => {
  const root = await signIn(testApp, DEFAULT_ADMIN_CREDENTIALS);
  const mailbox = testApp.application.container.resolve(invitationMailboxToken);
  mailbox.fail = true;
  const project = await readData<ProjectDetail>(
    await root.fetch(
      '/projects',
      post({ name: 'Manual delivery', visibility: 'members' }),
    ),
    201,
  );
  const email = 'manual-recipient@example.test';
  const oldToken = await invite(root, email, project.id);
  const users = testApp.application.container.resolve(
    userManagementServiceToken,
  );
  const pending = (await users.listInvitations()).find(
    (row) => row.email === email,
  );
  if (!pending) throw new Error('Missing invitation');
  const result = await readData<InvitationResult>(
    await root.fetch(
      `/projects/invitations/${pending.id}/resend?sendEmail=false`,
      post({}),
    ),
  );
  const token = result.inviteUrl?.split('/').at(-1);
  expect(result.emailSent).toBe(false);
  expect(
    (await request('/users/invitations/lookup', post({ token: oldToken })))
      .status,
  ).toBe(400);
  expect(
    await readData(await request('/users/invitations/lookup', post({ token }))),
  ).toMatchObject({ email });
  const password = 'manual-recipient-password';
  await readData(
    await request(
      '/users/invitations/accept',
      post({ token, name: 'Recipient', password }),
    ),
  );
  const account = (await users.list({ search: email })).items.find(
    (user) => user.email === email,
  );
  expect(account?.emailVerified).toBe(false);
  const member = await signIn(testApp, { email, password });
  expect((await member.fetch(`/projects/${project.id}`)).status).toBe(200);
  expect(mailbox.messages.has(email)).toBe(false);
  expect(
    (
      await request(
        '/users/invitations/accept',
        post({ token, name: 'Again', password }),
      )
    ).status,
  ).toBe(400);
});

for (const action of ['revoke', 'rotate'] as const) {
  test(`preserves batch results and existing membership when a queued invitation is ${action}d`, async ({
    testApp,
  }) => {
    const mailbox = testApp.application.container.resolve(
      invitationMailboxToken,
    );
    mailbox.fail = false;
    const admin = await signIn(testApp, DEFAULT_ADMIN_CREDENTIALS);
    const existing = await readData<{ id: string }>(
      await admin.fetch(
        '/users',
        post({
          name: 'Existing member',
          email: `existing-${action}@example.test`,
          password: 'existing-member-password',
        }),
      ),
      201,
    );
    const project = await readData<ProjectDetail>(
      await admin.fetch(
        '/projects',
        post({
          name: 'Batch project',
          visibility: 'members',
        }),
      ),
      201,
    );
    const emails = Array.from(
      { length: 7 },
      (_, index) => `${action}-batch-${index}@example.test`,
    );
    const notification = testApp.application.container.resolve(
      notificationServiceToken,
    );
    const send = notification.sendTransient.bind(notification);
    const release = Promise.withResolvers<void>();
    const blocked = vi
      .spyOn(notification, 'sendTransient')
      .mockImplementation(async (input) => {
        await release.promise;
        return send(input);
      });
    const pending = admin.fetch(
      '/projects/invitations',
      post({
        emails: [...emails, `existing-${action}@example.test`],
        projectIds: [project.id],
      }),
    );
    let changedId: string | undefined;
    try {
      await vi.waitFor(() => expect(blocked).toHaveBeenCalledTimes(5), {
        timeout: 10_000,
      });
      const invitations = await readData<UserInvitation[]>(
        await admin.fetch('/users/invitations'),
      );
      changedId = invitations.find(
        (invitation) => invitation.email === emails[5],
      )?.id;
      expect(changedId).toBeDefined();
      const response =
        action === 'revoke'
          ? await admin.fetch(`/projects/invitations/${changedId}`, {
              method: 'DELETE',
              headers: { origin: 'http://localhost' },
            })
          : await admin.fetch(
              `/projects/invitations/${changedId}/resend?sendEmail=false`,
              post({}),
            );
      expect(response.status).toBe(action === 'revoke' ? 204 : 200);
    } finally {
      release.resolve();
      await pending;
      blocked.mockRestore();
    }
    const { results } = await readData<{ results: InvitationResult[] }>(
      await pending,
      201,
    );
    expect(results).toEqual([
      ...emails.map((email, index) =>
        index === 5
          ? { email, outcome: 'invited', emailSent: false }
          : {
              email,
              outcome: 'invited',
              emailSent: true,
              inviteUrl: expect.stringContaining('/main/invite/'),
            },
      ),
      { email: `existing-${action}@example.test`, outcome: 'added' },
    ]);
    expect(emails.filter((email) => mailbox.messages.has(email))).toEqual(
      emails.filter((_, index) => index !== 5),
    );
    const members = await readData<ProjectDetail>(
      await admin.fetch(`/projects/${project.id}`),
    );
    expect(members.members.map((member) => member.id)).toContain(existing.id);
    const users = testApp.application.container.resolve(
      userManagementServiceToken,
    );
    expect((await users.getInvitation(changedId ?? ''))?.status).toBe(
      action === 'revoke' ? 'revoked' : 'pending',
    );
  });
}

test('retains safe delivery diagnostics without storing provider messages or invitation credentials', async ({
  testApp,
}) => {
  const mailbox = testApp.application.container.resolve(invitationMailboxToken);
  const admin = await signIn(testApp, DEFAULT_ADMIN_CREDENTIALS);
  for (const category of ['recipient', 'timeout'] as const) {
    mailbox.failureCategory = category;
    const email = `diagnostic-${category}@example.test`;
    const result = await readData<{ results: InvitationResult[] }>(
      await admin.fetch('/projects/invitations', post({ emails: [email] })),
      201,
    );
    expect(result.results[0]).toMatchObject({
      emailSent: false,
      inviteUrl: expect.any(String),
    });
    const database =
      testApp.application.container.resolve(databaseManagerToken);
    const record = await database
      .connection()
      .repository('userInvitations')
      .findOne({ filter: { email } });
    expect(record?.sendError).toBe(
      `Invitation email submission_unknown (${category}).`,
    );
    expect(JSON.stringify(record)).not.toContain(
      'private invitation credential',
    );
    expect(JSON.stringify(record)).not.toContain(result.results[0]?.inviteUrl);
  }
});
