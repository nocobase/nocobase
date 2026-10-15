// @vitest-environment node
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createTestAppConfig } from '@nocobase/app-testing/server';
import { afterEach, expect, it } from 'vitest';
import {
  createStandaloneServer,
  type StandaloneServer,
} from '../../server/standalone.js';
import type { AccessMe } from '../../shared/access.js';

let server: StandaloneServer | undefined;
let config: Awaited<ReturnType<typeof createTestAppConfig>> | undefined;
let directory: string | undefined;
afterEach(async () => {
  await server?.close();
  await config?.dispose();
  if (directory) rmSync(directory, { recursive: true, force: true });
});

function request(
  url: string,
  cookie = '',
  body?: unknown,
  method = body === undefined ? 'GET' : 'POST',
): Promise<Response> {
  return server!.fetch(
    new Request(
      `http://localhost${server!.application.publicBasePath}/api${url}`,
      {
        method,
        headers: {
          cookie,
          origin: 'http://localhost',
          'content-type': 'application/json',
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
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

it('lets a non-root owner configure both defaults through the real routes and CLI manifest, and denies a contributor', async () => {
  directory = mkdtempSync(path.join(tmpdir(), 'studio-skill-settings-'));
  config = await createTestAppConfig({
    config: {
      auth: {
        secret: 'test-auth-secret-at-least-32-characters',
        trustedOrigins: ['http://localhost'],
      },
      hub: { host: { enabled: false } },
      logging: { level: 'error', file: { enabled: false } },
    },
  });
  const rootDir = path.resolve(import.meta.dirname, '../..');
  server = await createStandaloneServer({
    viteDevUrl: false,
    env: {
      APP_CONFIG_FILE: config.path,
      APP_STORAGE_DIR: path.join(directory, 'storage'),
    },
    paths: {
      rootDir,
      serverDir: path.join(rootDir, 'server'),
      databaseDir: path.join(rootDir, 'database'),
      clientDir: path.join(rootDir, 'dist/client'),
      storageDir: path.join(directory, 'storage'),
    },
  });
  const rootLogin = await request('/auth/sign-in/username', '', {
    username: 'nocobase',
    password: 'admin123',
  });
  expect(rootLogin.status).toBe(200);
  const root = cookieOf(rootLogin);
  const user = await request('/users', root, {
    name: 'Skill owner',
    email: 'skill-owner@example.com',
    password: 'TestPassword123!',
  });
  expect(user.status).toBe(201);
  const userId = ((await user.json()) as { data: { id: string } }).data.id;
  expect(
    (
      await request(
        `/access/members/${userId}`,
        root,
        { roles: ['owner'] },
        'PATCH',
      )
    ).status,
  ).toBe(200);
  const login = await request('/auth/sign-in/email', '', {
    email: 'skill-owner@example.com',
    password: 'TestPassword123!',
  });
  expect(login.status).toBe(200);
  const owner = cookieOf(login);
  const me = await request('/access/me', owner);
  expect(me.status).toBe(200);
  expect(((await me.json()) as { data: AccessMe }).data).toMatchObject({
    superuser: false,
    roles: ['owner'],
  });
  const created = await request('/agents/skills', owner, {
    content: '---\nname: owner-default\ndescription: Owner rules.\n---\nRules.',
  });
  expect(created.status).toBe(201);
  const skillId = ((await created.json()) as { data: { id: string } }).data.id;
  const manifest = await request('/cli/manifest', owner);
  expect(manifest.status).toBe(200);
  const commands = (
    (await manifest.json()) as {
      data: { commands: { id: string; action?: string }[] };
    }
  ).data.commands;
  for (const id of [
    'project:default-skills:get',
    'project:default-skills:set',
  ]) {
    expect(commands.find((command) => command.id === id)).toMatchObject({ id });
    expect(
      commands.find((command) => command.id === id)?.action,
    ).toBeUndefined();
  }
  for (const endpoint of [
    '/projectDefaultSkills',
    '/agents/skillAttachments/global/default',
  ]) {
    expect(
      (await request(endpoint, owner, { skillIds: [skillId] }, 'PUT')).status,
    ).toBe(200);
    expect(await (await request(endpoint, owner)).json()).toMatchObject({
      data: { skillIds: [skillId] },
    });
    expect(
      (await request(endpoint, owner, { skillIds: [] }, 'PUT')).status,
    ).toBe(200);
    expect(await (await request(endpoint, owner)).json()).toMatchObject({
      data: { skillIds: [] },
    });
  }
  expect(
    (
      await request(
        `/access/members/${userId}`,
        root,
        { roles: ['contributor'] },
        'PATCH',
      )
    ).status,
  ).toBe(200);
  for (const endpoint of [
    '/projectDefaultSkills',
    '/agents/skillAttachments/global/default',
  ])
    expect(
      (await request(endpoint, owner, { skillIds: [skillId] }, 'PUT')).status,
    ).toBe(403);
});
