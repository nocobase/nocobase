// @vitest-environment node
import path from 'node:path';
import { inflateRawSync } from 'node:zlib';
import { Auth, authenticationToken } from '@nocobase/app-plugin-authentication';
import authenticationPlugin from '@nocobase/app-plugin-authentication/server';
import defaultAccessPlugin, {
  defaultAccess,
} from '@nocobase/app-plugin-authz-default-access/server';
import sharingRulesPlugin, {
  sharingRules,
} from '@nocobase/app-plugin-authz-sharing-rules/server';
import restrictionRulesPlugin, {
  restrictionRules,
} from '@nocobase/app-plugin-authz-restriction-rules/server';
import {
  authorizationToken,
  createAppAuthorization,
} from '@nocobase/app-plugin-authorization';
import authorizationServerPlugin from '@nocobase/app-plugin-authorization/server';
import authorizationExamplePlugin from '@nocobase/app-plugin-authorization-example/server';
import templatePrintPlugin from '@nocobase/app-plugin-template-print-example/server';
import { createAppPaths } from '@nocobase/app-server/config';
import {
  findUndeclaredApiRoutes,
  generateApiDocument,
} from '@nocobase/app-server/router';
import { databaseManagerToken, type DatabaseManager } from '@nocobase/db';
import { createDatabaseTest } from '@nocobase/app-testing/server';
import { ServiceContainer } from '@nocobase/service-provider';
import { Hono } from 'hono';
import { expect, it, vi } from 'vitest';

import { createTemplatePrintRoutes } from '../server/routes/template-print.js';

const test = createDatabaseTest();

async function createFixture(database: DatabaseManager) {
  const plugins = [
    authenticationPlugin,
    authorizationServerPlugin,
    defaultAccessPlugin,
    sharingRulesPlugin,
    restrictionRulesPlugin,
    authorizationExamplePlugin,
    templatePrintPlugin,
  ];

  for (const plugin of plugins) {
    if (!plugin.database?.migrations) continue;
    await database
      .createMigrator({
        directory: path.resolve(plugin.baseDir, plugin.database.migrations),
        packageName: plugin.packageName,
        tableName: `${plugin.packageName.replace('@nocobase/app-plugin-', '')}Migrations`,
      })
      .latest();
  }

  const seedPlugins = [authorizationExamplePlugin, templatePrintPlugin];
  for (const plugin of seedPlugins) {
    if (!plugin.database?.seeds) continue;
    await database
      .createSeeder({
        directory: path.resolve(plugin.baseDir, plugin.database.seeds),
        packageName: plugin.packageName,
      })
      .run();
  }

  const connection = database.connection();
  const authorization = createAppAuthorization({
    connection,
    config: { plugins: [defaultAccess(), sharingRules(), restrictionRules()] },
  });
  const users = Object.fromEntries(
    (
      await connection.query
        .selectFrom('user')
        .select(['id', 'username'])
        .execute()
    ).map((row) => [String(row.username), String(row.id)]),
  );
  const authentication = new Auth({
    connection,
    secret: 'template-print-example-test-secret-at-least-32-characters',
    baseURL: 'http://example.test',
  });
  vi.spyOn(authentication, 'getSession').mockImplementation(async (headers) => {
    const id = headers.get('x-test-user');
    if (!id) return null;
    return {
      user: {
        id,
        name: id,
        email: `${id}@example.test`,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      session: {
        id: `session-${id}`,
        token: `token-${id}`,
        userId: id,
        expiresAt: new Date(Date.now() + 60_000),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    };
  });

  const container = new ServiceContainer();
  container.instance(databaseManagerToken, database);
  container.instance(authorizationToken, authorization);
  container.instance(authenticationToken, authentication);
  const app = {
    appName: 'examples',
    publicBasePath: '/main',
    config: { app: { name: 'examples', publicBasePath: '/main' } },
    paths: createAppPaths({ rootDir: '/tmp/template-print-example-test' }),
    container,
    router: new Hono(),
  };

  for (const Provider of authorizationExamplePlugin.serviceProviders)
    await new Provider(app).boot();
  for (const contribution of templatePrintPlugin.routes)
    app.router.route('/api', await contribution.createRouter(app));

  return {
    app,
    database,
    users,
    request(user: string | undefined, pathName: string) {
      return app.router.request(`/api/templatePrintExample/${pathName}`, {
        headers: user
          ? { 'x-test-user': users[`sales_${user}`] ?? users[user] ?? user }
          : {},
      });
    },
  };
}

function zipEntryText(archive: Buffer, target: string): string {
  const endOfCentralDirectory = archive.lastIndexOf(
    Buffer.from([0x50, 0x4b, 0x05, 0x06]),
  );
  if (endOfCentralDirectory < 0)
    throw new Error('DOCX is missing its ZIP directory');

  const entryCount = archive.readUInt16LE(endOfCentralDirectory + 10);
  let entryOffset = archive.readUInt32LE(endOfCentralDirectory + 16);
  for (let index = 0; index < entryCount; index += 1) {
    const compression = archive.readUInt16LE(entryOffset + 10);
    const compressedSize = archive.readUInt32LE(entryOffset + 20);
    const fileNameLength = archive.readUInt16LE(entryOffset + 28);
    const extraLength = archive.readUInt16LE(entryOffset + 30);
    const commentLength = archive.readUInt16LE(entryOffset + 32);
    const fileName = archive
      .subarray(entryOffset + 46, entryOffset + 46 + fileNameLength)
      .toString('utf8');
    if (fileName === target) {
      const localOffset = archive.readUInt32LE(entryOffset + 42);
      const localFileNameLength = archive.readUInt16LE(localOffset + 26);
      const localExtraLength = archive.readUInt16LE(localOffset + 28);
      const dataOffset =
        localOffset + 30 + localFileNameLength + localExtraLength;
      const compressed = archive.subarray(
        dataOffset,
        dataOffset + compressedSize,
      );
      return (
        compression === 0 ? compressed : inflateRawSync(compressed)
      ).toString('utf8');
    }
    entryOffset += 46 + fileNameLength + extraLength + commentLength;
  }

  throw new Error(`DOCX does not contain ${target}`);
}

test('requires Sales Quotes access and renders only invoices linked to readable quotes', async ({
  database,
}) => {
  const fixture = await createFixture(database);
  await fixture.database.repository('templatePrintExampleInvoices').createOne({
    values: {
      id: 'private-invoice',
      number: 'INV-PRIVATE',
      customerName: 'Private customer',
      issuedOn: '2026-09-22',
      sourceQuoteId: 'quote-4',
      totalCents: 9000,
    },
  });

  for (const pathName of ['invoices', 'invoices/print-invoice-1/print']) {
    const anonymous = await fixture.request(undefined, pathName);
    expect(anonymous.status).toBe(401);
    await expect(anonymous.json()).resolves.toMatchObject({
      error: { status: 'UNAUTHENTICATED' },
    });
  }
  const denied = await fixture.request('delivery', 'invoices');
  expect(denied.status).toBe(403);
  await expect(denied.json()).resolves.toMatchObject({
    error: { status: 'PERMISSION_DENIED' },
  });
  // Permission is decided before the path and query are validated.
  for (const pathName of [
    'invoices?pageSize=101',
    'invoices/print-invoice-1/print?format=xlsx',
    'invoices/not%20valid/print',
  ]) {
    const deniedInvalid = await fixture.request('delivery', pathName);
    expect(deniedInvalid.status).toBe(403);
  }

  const listResponse = await fixture.request('manager', 'invoices');
  expect(listResponse.status).toBe(200);
  const listBody = await listResponse.json();
  expect(listBody.meta).toEqual({ page: 1, pageSize: 20, total: 2 });
  expect(listBody.data).toEqual([
    expect.objectContaining({
      id: 'print-invoice-1',
      number: 'INV-2026-003',
      sourceQuoteTitle: 'Hill project quote',
    }),
    expect.objectContaining({
      id: 'print-invoice-2',
      number: 'INV-2026-004',
      sourceQuoteTitle: 'Hill handover quote',
    }),
  ]);

  const hiddenResponse = await fixture.request(
    'manager',
    'invoices/private-invoice/print',
  );
  expect(hiddenResponse.status).toBe(404);
  await expect(hiddenResponse.json()).resolves.toMatchObject({
    error: { reason: 'INVOICE_NOT_FOUND', domain: 'templatePrintExample' },
  });

  const secondPage = await fixture.request(
    'manager',
    'invoices?page=2&pageSize=1',
  );
  await expect(secondPage.json()).resolves.toMatchObject({
    data: [expect.objectContaining({ id: 'print-invoice-2' })],
    meta: { page: 2, pageSize: 1, total: 2 },
  });
  for (const pathName of [
    'invoices?pageSize=101',
    'invoices/print-invoice-1/print?format=xlsx',
    'invoices/not%20valid/print',
  ]) {
    const invalid = await fixture.request('manager', pathName);
    expect(invalid.status).toBe(400);
    await expect(invalid.json()).resolves.toMatchObject({
      error: { reason: 'INVALID_INPUT' },
    });
  }

  const printResponse = await fixture.request(
    'manager',
    'invoices/print-invoice-1/print',
  );
  expect(printResponse.status).toBe(200);
  expect(printResponse.headers.get('content-type')).toContain(
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  );
  expect(printResponse.headers.get('cache-control')).toBe('private, no-store');
  expect(printResponse.headers.get('content-disposition')).toContain(
    'invoice-INV-2026-003.docx',
  );
  const bytes = Buffer.from(await printResponse.arrayBuffer());
  expect(Array.from(bytes.slice(0, 2))).toEqual([0x50, 0x4b]);
  expect(bytes.byteLength).toBeGreaterThan(500);
  const documentXml = zipEntryText(bytes, 'word/document.xml');
  expect(documentXml).toContain('INV-2026-003');
  expect(documentXml).toContain('Hill Studio');
  expect(documentXml).toContain('Design and planning');
  expect(documentXml).toContain('Installation support');
  expect(documentXml).not.toContain('{d.lines[i]');
});

test('answers an invoice with more lines than the example prints as a failed precondition', async ({
  database,
}) => {
  const fixture = await createFixture(database);
  await fixture.database
    .connection()
    .query.insertInto('templatePrintExampleInvoiceLines')
    .values(
      Array.from({ length: 50 }, (_, index) => ({
        id: `extra-line-${String(index).padStart(2, '0')}`,
        invoiceId: 'print-invoice-1',
        description: `Extra line ${index}`,
        quantity: 1,
        unitPriceCents: 100,
      })),
    )
    .execute();
  const response = await fixture.request(
    'manager',
    'invoices/print-invoice-1/print',
  );
  expect(response.status).toBe(400);
  await expect(response.json()).resolves.toMatchObject({
    error: {
      status: 'FAILED_PRECONDITION',
      reason: 'OUTPUT_LIMIT_EXCEEDED',
      domain: 'templatePrintExample',
    },
  });
});

it('declares every route for the API document', async () => {
  // Declarations are read from the router, so the database is never queried here.
  const router = new Hono().route(
    '/templatePrintExample',
    createTemplatePrintRoutes({} as DatabaseManager),
  );

  expect(findUndeclaredApiRoutes(router)).toEqual([]);
  const document = await generateApiDocument(router, {
    info: { title: 'Template print example', version: '0.0.0' },
  });
  const print =
    document.paths?.['/api/templatePrintExample/invoices/{invoiceId}/print']
      ?.get;
  expect(print).toMatchObject({
    tags: ['TemplatePrintExample'],
    operationId: 'templatePrintExamplePrintInvoice',
  });
  expect(Object.keys(print?.responses ?? {})).toEqual(
    expect.arrayContaining(['200', '403', '404', '503']),
  );
  expect(
    document.paths?.['/api/templatePrintExample/invoices']?.get?.operationId,
  ).toBe('templatePrintExampleListInvoices');
  expect(document.components?.schemas).toHaveProperty(
    'TemplatePrintExampleInvoice',
  );
});
