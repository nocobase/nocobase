/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import Database from '@nocobase/database';
import { createMockServer, MockServer } from '@nocobase/test';

describe('desktopRoutes:createV2 / destroyV2', () => {
  let app: MockServer;
  let db: Database;

  const getRootAgent = async () => {
    const rootUser = await db.getRepository('users').findOne({
      filter: {
        email: process.env.INIT_ROOT_EMAIL,
      },
    });

    return app.agent().login(rootUser);
  };

  beforeEach(async () => {
    app = await createMockServer({
      registerActions: true,
      acl: true,
      plugins: [
        'error-handler',
        'client',
        'field-sort',
        'acl',
        'users',
        'ui-schema-storage',
        'flow-engine',
        'system-settings',
        'data-source-main',
        'auth',
        'data-source-manager',
      ],
    });
    await app.runCommand('install', '-f');
    db = app.db;
  });

  afterEach(async () => {
    if (app) {
      await app.destroy();
    }
  });

  it('should create v2 page in one action (routes + uiSchema + flowModels)', async () => {
    const agent = await getRootAgent();

    const schemaUid = 'v2-page-1';
    const res = await agent.resource('desktopRoutes').createV2({
      values: { schemaUid, title: 'Page 1', icon: 'Icon', parentId: null },
    });

    expect(res.status).toBe(200);
    expect(res.body?.data?.page?.schemaUid).toBe(schemaUid);
    expect(res.body?.data?.defaultTab?.schemaUid).toBe(`tabs-${schemaUid}`);
    expect(res.body?.data?.defaultTab?.tabSchemaName).toBe(`tab-${schemaUid}`);

    const uiSchema = await db.getRepository('uiSchemas').findOne({ filterByTk: schemaUid });
    expect(uiSchema).toBeTruthy();
    expect(uiSchema.get('schema')?.['x-component']).toBe('FlowRoute');

    const flowModelsRepo: any = db.getCollection('flowModels').repository;
    const root = await flowModelsRepo.findModelById(schemaUid, { includeAsyncNode: true });
    expect(root?.subModels?.page).toBeTruthy();
    expect(root.subModels.page.use).toBe('RootPageModel');

    const tabRoot = await flowModelsRepo.findModelById(`tabs-${schemaUid}`, { includeAsyncNode: true });
    expect(tabRoot?.subModels?.grid).toBeTruthy();
    expect(tabRoot.subModels.grid.use).toBe('BlockGridModel');
  });

  it('should be idempotent when replaying the same createV2 request', async () => {
    const agent = await getRootAgent();

    const schemaUid = 'v2-page-2';
    const body = { schemaUid, title: 'Page 2', icon: 'Icon', parentId: null };

    const res1 = await agent.resource('desktopRoutes').createV2({ values: body });
    const res2 = await agent.resource('desktopRoutes').createV2({ values: body });

    expect(res1.status).toBe(200);
    expect(res2.status).toBe(200);
    expect(res1.body?.data?.page?.id).toBe(res2.body?.data?.page?.id);
  });

  it('should return 409 when schemaUid exists but key fields differ', async () => {
    const agent = await getRootAgent();

    const schemaUid = 'v2-page-3';
    await agent.resource('desktopRoutes').createV2({
      values: { schemaUid, title: 'Page 3', icon: 'Icon', parentId: null },
    });

    const conflict = await agent.resource('desktopRoutes').createV2({
      values: { schemaUid, title: 'Page 3 (changed)', icon: 'Icon', parentId: null },
    });
    expect(conflict.status).toBe(409);
  });

  it('should return 409 when schemaUid is occupied by a non-FlowRoute uiSchema during createV2', async () => {
    const agent = await getRootAgent();

    const schemaUid = 'v2-page-foreign-create';
    await db.getCollection('uiSchemas').model.create({
      'x-uid': schemaUid,
      schema: {
        type: 'void',
        'x-uid': schemaUid,
        'x-component': 'Input',
      },
    });

    const res = await agent.resource('desktopRoutes').createV2({
      values: { schemaUid, title: 'Foreign', icon: 'Icon', parentId: null },
    });

    expect(res.status).toBe(409);
    const pageRoute = await db.getRepository('desktopRoutes').findOne({ filter: { type: 'flowPage', schemaUid } });
    expect(pageRoute).toBeNull();
    const uiSchema = await db.getRepository('uiSchemas').findOne({ filterByTk: schemaUid });
    expect(uiSchema?.get('schema')?.['x-component']).toBe('Input');
  });

  it('should destroy v2 page and cleanup uiSchema + flowModels (idempotent)', async () => {
    const agent = await getRootAgent();

    const schemaUid = 'v2-page-4';
    await agent.resource('desktopRoutes').createV2({
      values: { schemaUid, title: 'Page 4', icon: 'Icon', parentId: null },
    });

    const res = await agent.resource('desktopRoutes').destroyV2({ values: { schemaUid } });
    expect(res.status).toBe(200);
    expect(res.body?.data?.ok).toBeTruthy();

    const pageRoute = await db.getRepository('desktopRoutes').findOne({ filter: { type: 'flowPage', schemaUid } });
    expect(pageRoute).toBeNull();

    const uiSchema = await db.getRepository('uiSchemas').findOne({ filterByTk: schemaUid });
    expect(uiSchema).toBeNull();

    const flowModelsRepo: any = db.getCollection('flowModels').repository;
    const root = await flowModelsRepo.findModelById(schemaUid, { includeAsyncNode: true });
    const tabRoot = await flowModelsRepo.findModelById(`tabs-${schemaUid}`, { includeAsyncNode: true });
    expect(root).toBeNull();
    expect(tabRoot).toBeNull();

    const res2 = await agent.resource('desktopRoutes').destroyV2({ values: { schemaUid } });
    expect(res2.status).toBe(200);
    expect(res2.body?.data?.ok).toBeTruthy();
  });

  it('should not delete a non-FlowRoute uiSchema during destroyV2', async () => {
    const agent = await getRootAgent();

    const schemaUid = 'v2-page-foreign-destroy';
    await db.getCollection('uiSchemas').model.create({
      'x-uid': schemaUid,
      schema: {
        type: 'void',
        'x-uid': schemaUid,
        'x-component': 'Input',
      },
    });

    const res = await agent.resource('desktopRoutes').destroyV2({ values: { schemaUid } });

    expect(res.status).toBe(409);
    const uiSchema = await db.getRepository('uiSchemas').findOne({ filterByTk: schemaUid });
    expect(uiSchema?.get('schema')?.['x-component']).toBe('Input');
  });
});
