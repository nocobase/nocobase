// @vitest-environment node
/**
 * The member password reset endpoint through a real, running application: an administrator resets a member's
 * password, the member can no longer use the old one, the member's prior session is revoked, a caller without the
 * `reset-password` permission is refused, and an anonymous caller is refused.
 */
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import {
  createTestAppConfig,
  type TestAppConfig,
} from '@nocobase/app-testing/server';
import { afterEach, describe, expect, it } from 'vitest';

import {
  createStandaloneServer,
  type StandaloneServer,
} from '../../server/standalone.ts';

const configs: TestAppConfig[] = [];
const tempDirs: string[] = [];
const servers: StandaloneServer[] = [];

afterEach(async () => {
  await Promise.all(servers.splice(0).map((server) => server.close()));
  await Promise.all(configs.splice(0).map((config) => config.dispose()));
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

async function startApp(): Promise<StandaloneServer> {
  const directory = mkdtempSync(
    path.join(tmpdir(), 'studio-member-password-reset-'),
  );
  tempDirs.push(directory);
  const config = await createTestAppConfig({
    config: {
      auth: {
        secret: 'test-auth-secret-at-least-32-characters',
        trustedOrigins: ['http://localhost'],
      },
      hub: { host: { enabled: false } },
      logging: { level: 'error', file: { enabled: false } },
    },
  });
  configs.push(config);
  const sourceRoot = path.resolve(import.meta.dirname, '../..');
  const server = await createStandaloneServer({
    viteDevUrl: false,
    env: {
      APP_CONFIG_FILE: config.path,
      APP_STORAGE_DIR: path.join(directory, 'storage'),
    },
    paths: {
      rootDir: sourceRoot,
      serverDir: path.join(sourceRoot, 'server'),
      databaseDir: path.join(sourceRoot, 'database'),
      clientDir: path.join(sourceRoot, 'dist/client'),
      storageDir: path.join(directory, 'storage'),
    },
  });
  servers.push(server);
  return server;
}

function apiRequest(
  server: StandaloneServer,
  path: string,
  init?: RequestInit,
): Promise<Response> {
  // A cookie-authenticated write is checked against a trusted origin; the test configuration trusts
  // `http://localhost`, which is also where every request below is addressed.
  const headers = new Headers(init?.headers);
  headers.set('origin', 'http://localhost');
  return server.fetch(
    new Request(
      `http://localhost${server.application.publicBasePath}/api${path}`,
      {
        ...init,
        headers,
      },
    ),
  );
}

function cookieOf(response: Response): string {
  return response.headers
    .getSetCookie()
    .map((header) => header.split(';')[0])
    .join('; ');
}

async function signInAsAdmin(server: StandaloneServer): Promise<string> {
  const response = await apiRequest(server, '/auth/sign-in/username', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username: 'nocobase', password: 'admin123' }),
  });
  expect(response.status).toBe(200);
  return cookieOf(response);
}

async function createMember(
  server: StandaloneServer,
  adminCookie: string,
): Promise<{ readonly userId: string; readonly email: string }> {
  const email = `member-${Math.random().toString(36).slice(2)}@example.com`;
  const response = await apiRequest(server, '/users', {
    method: 'POST',
    headers: { cookie: adminCookie, 'content-type': 'application/json' },
    body: JSON.stringify({
      name: 'Member',
      email,
      password: 'OldPassword123!',
    }),
  });
  expect(response.status).toBe(201);
  const body = (await response.json()) as { data: { id: string } };
  return { userId: body.data.id, email };
}

describe('resetting a member’s password through the real application', () => {
  it('lets an authorized administrator reset a member’s password, revoking the member’s session and the old password', async () => {
    const server = await startApp();
    const adminCookie = await signInAsAdmin(server);
    const { userId, email } = await createMember(server, adminCookie);

    const memberSignIn = await apiRequest(server, '/auth/sign-in/email', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password: 'OldPassword123!' }),
    });
    expect(memberSignIn.status).toBe(200);
    const memberCookie = cookieOf(memberSignIn);

    const beforeReset = await apiRequest(server, '/users/me/preferences', {
      headers: { cookie: memberCookie },
    });
    expect(beforeReset.status).toBe(200);

    const reset = await apiRequest(server, `/users/${userId}/resetPassword`, {
      method: 'POST',
      headers: { cookie: adminCookie, 'content-type': 'application/json' },
      body: JSON.stringify({ password: 'NewPassword456!' }),
    });
    expect(reset.status).toBe(204);

    const afterReset = await apiRequest(server, '/users/me/preferences', {
      headers: { cookie: memberCookie },
    });
    expect(afterReset.status).toBe(401);

    const oldPasswordSignIn = await apiRequest(server, '/auth/sign-in/email', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password: 'OldPassword123!' }),
    });
    expect(oldPasswordSignIn.status).toBe(401);

    const newPasswordSignIn = await apiRequest(server, '/auth/sign-in/email', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password: 'NewPassword456!' }),
    });
    expect(newPasswordSignIn.status).toBe(200);
    const signedInUser = (await newPasswordSignIn.json()) as {
      user: { id: string };
    };
    expect(signedInUser.user.id).toBe(userId);
  });

  it('refuses a caller without the reset-password permission', async () => {
    const server = await startApp();
    const adminCookie = await signInAsAdmin(server);
    const { userId, email } = await createMember(server, adminCookie);
    const memberSignIn = await apiRequest(server, '/auth/sign-in/email', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password: 'OldPassword123!' }),
    });
    const memberCookie = cookieOf(memberSignIn);

    const response = await apiRequest(
      server,
      `/users/${userId}/resetPassword`,
      {
        method: 'POST',
        headers: { cookie: memberCookie, 'content-type': 'application/json' },
        body: JSON.stringify({ password: 'NewPassword456!' }),
      },
    );

    expect(response.status).toBe(403);
    const signInStillWorks = await apiRequest(server, '/auth/sign-in/email', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password: 'OldPassword123!' }),
    });
    expect(signInStillWorks.status).toBe(200);
  });

  it('refuses an anonymous caller', async () => {
    const server = await startApp();
    const adminCookie = await signInAsAdmin(server);
    const { userId } = await createMember(server, adminCookie);

    const response = await apiRequest(
      server,
      `/users/${userId}/resetPassword`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ password: 'NewPassword456!' }),
      },
    );

    expect(response.status).toBe(401);
  });
});
