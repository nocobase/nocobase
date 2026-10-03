import assert from 'node:assert/strict';
import path from 'node:path';
import { mkdir } from 'node:fs/promises';
import { Hono } from 'hono';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { AppRouteContribution } from '@nocobase/app-server/router';
import { databaseManagerToken } from '@nocobase/db';
import { createTestDatabase } from '@nocobase/app-testing/server';
import { createDriveManager } from '@nocobase/drive';
import { driveManagerToken } from '@nocobase/app-server/drive';
import { ServiceContainer } from '@nocobase/service-provider';
import { createApiClient } from '@nocobase/api-client';
import core, {
  serverFileRepositoryManagerToken,
} from '@nocobase/app-plugin-file/server';
import client, {
  clientFileRepositoryManagerToken,
} from '@nocobase/app-plugin-file/client';
import { apiClientToken } from '@nocobase/app-client';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import type { ClientApplication } from '@nocobase/app-client';

// The evaluation copies this runner beside the migration and route snippets from the Skill.
const { default: routes } = (await import(
  path.join(process.cwd(), 'routes.ts')
)) as { default: readonly AppRouteContribution<AppPluginApplication>[] };
// The dialect NOCOBASE_TEST_DB_DIALECT selects, SQLite when it is unset; this process inherits it from the test.
const testDatabase = await createTestDatabase();
const db = testDatabase.database;
try {
  const migrator = db.createMigrator({
    directory: path.join(process.cwd(), 'database/main/migrations'),
    packageName: 'invoice-attachment-evaluation',
  });
  await migrator.latest();
  const storage = path.join(process.cwd(), 'storage');
  await mkdir(storage, { recursive: true });
  const drive = createDriveManager({
    default: 'local',
    disks: {
      local: { driver: 'fs', location: storage, visibility: 'private' },
    },
  });
  const container = new ServiceContainer();
  container.instance(databaseManagerToken, db);
  container.instance(driveManagerToken, drive);
  const app = {
    container,
    publicBasePath: '/tenant-acme',
  } as AppPluginApplication;
  for (const Provider of core.serviceProviders) new Provider(app).register();
  const router = new Hono();
  for (const contribution of routes)
    router.route(
      contribution.scope === 'api' ? '/tenant-acme/api' : '/tenant-acme',
      await contribution.createRouter(app),
    );
  container.instance(
    apiClientToken,
    createApiClient({
      baseURL: 'http://localhost/tenant-acme/api',
      fetch: (input, init) => router.fetch(new Request(input, init)),
    }),
  );
  for (const Provider of client().serviceProviders)
    new Provider({ container } as ClientApplication).register();
  const files = container
    .resolve(clientFileRepositoryManagerToken)
    .repository('invoiceAttachments');
  const uploaded = await files.uploadOne({
    file: new File(['invoice bytes'], 'invoice.txt', { type: 'text/plain' }),
  });
  const row = uploaded.record;
  assert.equal(
    row.contentUrl,
    '/tenant-acme/uploads/invoices/' + row.id + '.txt',
  );
  assert.equal(
    await (await router.request(row.contentUrl)).text(),
    'invoice bytes',
  );
  const queried = (await files.findMany())[0];
  assert.ok(queried);
  assert.equal(queried.id, row.id);
  assert.equal(queried.mimeType, 'text/plain');
  assert.equal(queried.filename, 'invoice.txt');
  assert.equal(queried.ext, 'txt');
  assert.equal(queried.size, 13);
  assert.ok(queried.createdAt);
  assert.ok(queried.updatedAt);
  assert.equal(queried.contentUrl, row.contentUrl);
  // Exercise the installed UI with an actual query result, not the upload response.
  const { resolveFilePreviewKind } = await import(
    path.join(
      process.cwd(),
      'client/extensions/nocobase-file-component-ui/lib/file-preview.ts',
    )
  );
  const { FileThumbnail } = await import(
    path.join(
      process.cwd(),
      'client/extensions/nocobase-file-component-ui/components/file-thumbnail.tsx',
    )
  );
  assert.equal(resolveFilePreviewKind(queried), 'text');
  assert.match(
    renderToStaticMarkup(createElement(FileThumbnail, { file: queried })),
    /invoice\.txt/u,
  );
  await db
    .builder()
    .createCollection('invoice_attachment_links', (collection) => {
      collection.increments('id').primary();
      collection.string('invoiceId').notNull();
      collection.uuid('fileId').notNull();
    });
  await db
    .repository('invoice_attachment_links')
    .createOne({ values: { invoiceId: 'invoice-42', fileId: row.id } });
  assert.equal(
    (
      await db
        .repository<{ fileId: string }>('invoice_attachment_links')
        .findOne({ filter: { invoiceId: 'invoice-42' } })
    )?.fileId,
    row.id,
  );
  const batch = await files.uploadMany({
    files: [new File(['a'], 'a.txt'), new File(['b'], 'README')],
  });
  assert.equal(batch.createdCount, 2);
  assert.equal(batch.records.length, 2);
  assert.equal(await db.repository('invoice_files').count(), 3);
  const server = container
    .resolve(serverFileRepositoryManagerToken)
    .repository('invoice_files', {
      disk: 'local',
      accessPath: '/uploads/invoices',
      policy: { read: true, create: true, update: false, delete: false },
    });
  assert.equal(server.getUrl(row), '/uploads/invoices/' + row.id + '.txt');
  await assert.rejects(
    files.uploadOne({
      file: new File([new Uint8Array(5 * 1024 * 1024)], 'large.bin'),
    }),
    { status: 413 },
  );
  // Fixture identities exercise App-owned protection on both contribution scopes.
  const protectedRouter = new Hono();
  for (const contribution of routes) {
    const child = new Hono();
    child.use(
      contribution.scope === 'api'
        ? '/invoiceAttachments:findMany'
        : '/uploads/invoices/*',
      async (context, next) => {
        const role = context.req.header('x-fixture-role');
        if (!role) return context.text('Unauthenticated', 401);
        if (role !== 'accountant') return context.text('Forbidden', 403);
        await next();
      },
    );
    child.route('/', await contribution.createRouter(app));
    protectedRouter.route(
      contribution.scope === 'api' ? '/tenant-acme/api' : '/tenant-acme',
      child,
    );
  }
  for (const url of [
    '/tenant-acme/api/invoiceAttachments:findMany',
    row.contentUrl,
  ]) {
    const method = url.includes('/api/') ? 'POST' : 'GET';
    const body = method === 'POST' ? '{}' : undefined;
    const headers =
      method === 'POST' ? { 'content-type': 'application/json' } : undefined;
    assert.equal(
      (await protectedRouter.request(url, { method, body, headers })).status,
      401,
    );
    assert.equal(
      (
        await protectedRouter.request(url, {
          method,
          body,
          headers: { ...headers, 'x-fixture-role': 'guest' },
        })
      ).status,
      403,
    );
    assert.equal(
      (
        await protectedRouter.request(url, {
          method,
          body,
          headers: { ...headers, 'x-fixture-role': 'accountant' },
        })
      ).status,
      200,
    );
  }
  await files.deleteOne({ filter: { id: row.id } });
  assert.equal((await router.request(row.contentUrl)).status, 404);
  assert.equal(await drive.use('local').exists(row.key), true);
  await migrator.rollback();
  assert.equal(
    await db.connection().collections.getPhysical('invoice_files'),
    undefined,
  );
  console.log(
    'Agent workflow passed: migration, services, aliases, upload, query, prefix, download, batch, limits, metadata retention.',
  );
} finally {
  await testDatabase.destroy();
}
