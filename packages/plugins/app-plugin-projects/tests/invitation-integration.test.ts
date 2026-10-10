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
import { expect } from 'vitest';

import { createInvitationServer } from './helpers/invitation-app.js';
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
