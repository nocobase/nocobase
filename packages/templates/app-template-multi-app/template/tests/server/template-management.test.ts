import { mkdir, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { expect } from 'vitest';
import { createAppTest } from '@nocobase/app-testing/server';
import {
  DEFAULT_ADMIN_CREDENTIALS,
  signIn,
} from '@nocobase/app-plugin-authentication/testing';
import {
  releasesToken,
  type DeploymentDriver,
} from '@nocobase/app-plugin-releases/server';
import { createStandaloneServer } from '../../server/standalone.js';
const test = createAppTest({
  createServer: createStandaloneServer,
  connections: ['main'],
  config: {
    app: { publicOrigin: 'http://localhost' },
    auth: {
      secret: 'test-auth-secret-at-least-32-characters',
      trustedOrigins: ['http://localhost'],
    },
    users: { initialAdmin: DEFAULT_ADMIN_CREDENTIALS },
    releases: { host: { enabled: false } },
  },
});
const json = (
  body: unknown,
  key = `${Date.now()}.${randomUUID()}`,
): RequestInit => ({
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    origin: 'http://localhost',
    'idempotency-key': key,
  },
  body: JSON.stringify(body),
});
const unavailable: DeploymentDriver = {
  kind: 'test-unavailable',
  title: { key: 'test', ns: 'app' },
  configSchema: { type: 'object' },
  capabilities: { logs: false, urlModes: ['path'] },
  open: async () => {
    throw new Error('Test target deliberately unavailable');
  },
};
test('catalog uses native authorization, immutable receipts, and exposes its real API document', async ({
  testApp,
  app,
  request,
  connection,
}) => {
  expect((await request('/multiApp/templates')).status).toBe(401);
  const admin = await signIn(testApp, DEFAULT_ADMIN_CREDENTIALS);
  const swagger = await admin.fetch('/swagger');
  expect(swagger.status).toBe(200);
  await mkdir('storage/verification', { recursive: true });
  await writeFile(
    'storage/verification/openapi.json',
    JSON.stringify(await swagger.json()),
  );
  const releases = app.container.resolve(releasesToken);
  releases.drivers.register(unavailable);
  const caller = await releases.callerForUser(admin.user.id);
  const environment = await releases.environments.create(caller, {
    id: 'metadata',
    name: 'Metadata',
    driver: unavailable.kind,
  });
  const key = `${Date.now()}.${randomUUID()}`,
    input = { name: 'Reagent template', environmentId: environment.id };
  const first = await admin.fetch('/multiApp/templates', json(input, key));
  expect(first.status).toBe(200);
  const created = (await first.json()) as {
    data: { id: string; revision: number };
  };
  const replay = await admin.fetch('/multiApp/templates', json(input, key));
  expect(replay.headers.get('Idempotency-Replayed')).toBe('true');
  expect(await connection.repository('mamTemplates').count()).toBe(1);
  expect(
    (
      await admin.fetch(
        '/releases/apps',
        json({ id: 'bypass', name: 'Bypass', environmentId: environment.id }),
      )
    ).status,
  ).toBe(403);
  const retirement = {
    expectedRevision: created.data.revision,
    confirm: created.data.id,
  };
  expect(
    (
      await admin.fetch(
        `/multiApp/templates/${created.data.id}/retire`,
        json(retirement),
      )
    ).status,
  ).toBe(200);
  expect(
    (
      await admin.fetch(
        `/multiApp/templates/${created.data.id}/retire`,
        json(retirement),
      )
    ).status,
  ).toBe(409);
  // Count and pagination must apply template filtering before slicing results.
  const other = await admin.fetch(
    '/multiApp/templates',
    json({ name: 'Other template', environmentId: environment.id }),
  );
  const otherTemplate = (await other.json()) as { data: { id: string } };
  for (const [templateId, prefix] of [
    [created.data.id, 'first'],
    [otherTemplate.data.id, 'other'],
  ]) {
    const versionId = randomUUID();
    await connection.repository('mamTemplateVersions').createOne({
      values: {
        id: versionId,
        templateId,
        version: '1.0.0',
        releaseId: randomUUID(),
        checksum: 'test-checksum',
        manifest: {},
        createdBy: admin.user.id,
        createdAt: new Date().toISOString(),
      },
    });
    for (let index = 0; index < 2; index++)
      await connection.repository('mamInstances').createOne({
        values: {
          id: `${prefix}-${index}`,
          name: `${prefix} laboratory ${index}`,
          templateId,
          desiredVersionId: versionId,
          currentVersionId: versionId,
          environmentId: environment.id,
          ownerRef: null,
          status: index ? 'archived' : 'active',
          operationId: null,
          createdBy: admin.user.id,
          revision: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });
  }
  const filtered = await admin.fetch(
    `/multiApp/instances?templateId=${created.data.id}&pageSize=1&page=2`,
  );
  expect(filtered.status).toBe(200);
  const filteredBody = (await filtered.json()) as {
    data: { templateId: string }[];
    meta: { total: number };
  };
  expect(filteredBody.meta.total).toBe(2);
  expect(filteredBody.data).toHaveLength(1);
  expect(filteredBody.data[0].templateId).toBe(created.data.id);
  const archived = await admin.fetch(
    `/multiApp/instances?templateId=${created.data.id}&status=archived`,
  );
  expect((await archived.json()).meta.total).toBe(1);
  expect(
    (await request(`/multiApp/instances?templateId=${created.data.id}`)).status,
  ).toBe(401);
  const credentials = {
    username: 'ordinary',
    password: 'Test-only-password-123!',
  };
  expect(
    (
      await admin.fetch(
        '/users',
        json({
          ...credentials,
          name: 'Ordinary',
          email: 'ordinary@example.test',
          roleScopes: { app: [] },
        }),
      )
    ).status,
  ).toBe(201);
  const user = await signIn(testApp, credentials);
  expect((await user.fetch('/multiApp/templates')).status).toBe(403);
  expect(
    (await user.fetch(`/multiApp/instances?templateId=${created.data.id}`))
      .status,
  ).toBe(403);
  expect(
    (await user.fetch('/multiApp/instances/running/deployments')).status,
  ).toBe(403);
  expect((await user.fetch('/multiApp/instances', json({}))).status).toBe(403);
});
