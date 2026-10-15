// @vitest-environment node
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createTestAppConfig } from '@nocobase/app-testing/server';
import { afterEach, expect, it } from 'vitest';
import {
  createStandaloneServer,
  type StandaloneServer,
} from '../../server/standalone.js';
import type { AccessMe } from '../../shared/access.js';
import { agentsToken } from '@nocobase/app-plugin-agents/server/tokens';
import { projectsToken } from '@nocobase/app-plugin-projects/server/tokens';
import { studioAccessToken } from '../../server/access/token.js';

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
        `/users/${userId}/roleScopes/studio`,
        root,
        { value: ['owner'] },
        'PUT',
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
  const projects = server.application.container.resolve(projectsToken);
  const agents = server.application.container.resolve(agentsToken);
  const client = await projects.tx.read().client<{
    on(event: string, listener: (query: { sql: string }) => void): void;
    off(event: string, listener: (query: { sql: string }) => void): void;
  }>();
  const measure = async () => {
    const cost = { select: 0, writes: 0, explicitLocks: 0 };
    const capture = ({ sql }: { sql: string }) => {
      if (/^\s*(select|with)\b/iu.test(sql)) cost.select += 1;
      if (/^\s*(insert|update|delete)\b/iu.test(sql)) cost.writes += 1;
      if (/for update|lock table/iu.test(sql)) cost.explicitLocks += 1;
    };
    client.on('query', capture);
    const response = await request(`/agents/skills/${skillId}`, owner);
    client.off('query', capture);
    expect(response.status).toBe(200);
    expect(cost.writes).toBe(0);
    expect(cost.explicitLocks).toBe(0);
    return {
      cost,
      data: (await response.json()) as { data: { attachments: unknown[] } },
    };
  };
  await measure();
  const baseline = await measure();
  const access = server.application.container.resolve(studioAccessToken);
  const viewer = {
    userId,
    permissions: await access.permissionsOf({
      principal: { type: 'user', id: userId },
      subjects: [{ type: 'authenticated', id: '*' }],
    }),
  };
  const project = await projects.projects.create(viewer, {
    name: 'Owner project',
  });
  const resource = await projects.projects.addResource(viewer, project.id, {
    type: 'gitRepo',
    url: 'https://example.com/team/repository.git',
    label: 'Repository',
  });
  await agents.skills.attach({ scope: 'project', scopeId: project.id }, [
    skillId,
  ]);
  await agents.skills.attach({ scope: 'workdir', scopeId: resource.id }, [
    skillId,
  ]);
  const named = await measure();
  expect(named.data.data.attachments).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        scope: 'project',
        name: 'Owner project',
        href: `/projects/${project.id}/settings`,
      }),
      expect.objectContaining({ scope: 'workdir', name: 'Repository' }),
    ]),
  );
  if (process.env.PM391_DETAIL_COST_REPORT)
    writeFileSync(
      process.env.PM391_DETAIL_COST_REPORT,
      JSON.stringify(
        {
          baseline: baseline.cost,
          named: named.cost,
          addedSelects: named.cost.select - baseline.cost.select,
        },
        null,
        2,
      ),
    );
  expect(
    (
      await request(
        `/users/${userId}/roleScopes/studio`,
        root,
        { value: ['contributor'] },
        'PUT',
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
