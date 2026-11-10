import { it, expect } from 'vitest';
import { symlink } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { createTestApp } from '@nocobase/app-testing/server';
import {
  signIn,
  DEFAULT_ADMIN_CREDENTIALS,
} from '@nocobase/app-plugin-authentication/testing';
import { defineStandaloneServer } from '@nocobase/app-server/node';
import {
  defineAppRuntime,
  resolveAppRuntime,
  startApplicationInScope,
} from '@nocobase/app-server/runtime';
import { defineServerPlugins } from '@nocobase/app-server/plugins';
import modules from '@nocobase/app-plugin-modules/server';
import baseRuntime from '../../../templates/app-template-default/server/runtime.js';
import { createApp } from '../../../templates/app-template-default/server/app.js';
import { createModule } from '../src/create.mjs';
import { fixture } from './fixture.mjs';

it('generated records run with OSS only and enforce authentication, permissions and mutation receipts', async (context) => {
  const root = await fixture({ after: context.onTestFinished });
  const generated = await createModule({
    name: '@acme/app-module-samples',
    template: 'records',
    directory: root,
    install: false,
  });
  await symlink(
    path.join(root, 'node_modules'),
    path.join(generated.targetDirectory, 'node_modules'),
  );
  const compilation = spawnSync(
    path.join(root, 'node_modules/.bin/tsc'),
    ['-p', 'tsconfig.json'],
    { cwd: generated.targetDirectory, encoding: 'utf8' },
  );
  expect(compilation.status, compilation.stdout + compilation.stderr).toBe(0);
  const plugin = (
    await import(
      pathToFileURL(
        path.join(generated.targetDirectory, 'dist/server/index.js'),
      ).href
    )
  ).default;
  const runtime = defineAppRuntime({
    ...baseRuntime,
    plugins: defineServerPlugins([
      ...baseRuntime.plugins.plugins,
      modules,
      plugin,
    ]),
  });
  const server = defineStandaloneServer({
    rootDir: path.resolve(
      import.meta.dirname,
      '../../../templates/app-template-default',
    ),
    appRuntime: runtime,
    createServer: async (scope) =>
      startApplicationInScope(
        scope,
        createApp(await resolveAppRuntime(runtime, scope)),
      ),
  });
  const app = await createTestApp({
    createServer: server.create,
    config: {
      app: { publicOrigin: 'http://localhost', sampleData: false },
      auth: { secret: 'generator-runtime-secret-at-least-32-characters' },
    },
  });
  try {
    const endpoint = '/modules/samples/records';
    const request = (value, key = `${Date.now()}.${randomUUID()}`) => ({
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        origin: 'http://localhost',
        'Idempotency-Key': key,
      },
      body: JSON.stringify(value),
    });
    expect((await app.request(endpoint)).status).toBe(401);
    expect(
      (await app.request(endpoint, request({ name: 'Denied' }))).status,
    ).toBe(401);
    const admin = await signIn(app, DEFAULT_ADMIN_CREDENTIALS);
    const member = {
      name: 'Synthetic member',
      username: 'modulemember',
      email: 'module-member@example.test',
      password: 'Module-member-123!',
    };
    expect((await admin.fetch('/users', request(member))).status).toBe(201);
    const ordinary = await signIn(app, {
      username: member.username,
      password: member.password,
    });
    expect((await ordinary.fetch(endpoint)).status).toBe(403);
    expect(
      (await ordinary.fetch(endpoint, request({ name: 'Denied' }))).status,
    ).toBe(403);
    expect((await admin.fetch(endpoint, request({ name: ' ' }))).status).toBe(
      400,
    );
    const mutation = request({ name: 'Synthetic record' });
    const first = await admin.fetch(endpoint, mutation);
    expect(first.status).toBe(200);
    const saved = await first.json();
    const replay = await admin.fetch(endpoint, mutation);
    expect(replay.status).toBe(200);
    expect(replay.headers.get('Idempotency-Replayed')).toBe('true');
    expect(await replay.json()).toEqual(saved);
    expect(await (await admin.fetch(endpoint)).json()).toEqual({
      data: [saved.data],
    });
    const missingKey = request({ name: 'No key' });
    delete missingKey.headers['Idempotency-Key'];
    expect((await admin.fetch(endpoint, missingKey)).status).toBe(400);
    expect(
      await app.connection.repository('moduleSamplesRecords').count(),
    ).toBe(1);
  } finally {
    await app.close();
  }
});
