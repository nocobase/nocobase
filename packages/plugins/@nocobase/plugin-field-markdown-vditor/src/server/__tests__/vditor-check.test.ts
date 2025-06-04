/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { mockServer } from '@nocobase/test';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

describe('vditor:check', () => {
  let app;
  let db;
  let agent;

  beforeEach(async () => {
    app = mockServer({
      cors: {
        origin: '*',
      },
      plugins: ['field-sort', 'users', 'auth', 'file-manager', 'field-markdown-vditor'],
    });

    await app.load();

    db = app.db;
    agent = app.agent();

    // 确保集合已同步
    await db.sync();

    // 清除数据并准备测试数据
    await db.clean({ drop: true });

    // 确保集合重新同步
    await db.sync();

    // 创建测试所需的存储和文件集合
    await db.getRepository('storages').create({
      values: {
        name: 'default-storage',
        type: 'local',
        default: true,
      },
    });

    await db.getRepository('storages').create({
      values: {
        name: 's3-storage',
        type: 's3-compatible',
        default: false,
      },
    });

    await db.getRepository('storages').create({
      values: {
        name: 's3-storage-with-baseurl',
        type: 's3-compatible',
        default: false,
        options: {
          baseUrl: 'https://example.com',
          public: true,
        },
      },
    });

    // 创建测试文件集合
    await db.collection({
      name: 'file-collection-default',
      fields: [
        {
          type: 'string',
          name: 'title',
        },
      ],
    });

    await db.collection({
      name: 'file-collection-s3',
      fields: [
        {
          type: 'string',
          name: 'title',
        },
      ],
      storage: 's3-storage',
    });

    await db.collection({
      name: 'file-collection-s3-with-baseurl',
      fields: [
        {
          type: 'string',
          name: 'title',
        },
      ],
      storage: 's3-storage-with-baseurl',
    });

    await db.sync();
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should return default storage when no fileCollectionName provided', async () => {
    const response = await agent.resource('vditor').check();

    expect(response.status).toBe(200);
    expect(response.body.data.isSupportToUploadFiles).toBe(true);
    expect(response.body.data.storage).toMatchInlineSnapshot(`
      {
        "id": 1,
        "name": "default-storage",
        "rules": {},
        "title": null,
        "type": "local",
      }
    `);
  });

  it('should return default storage when fileCollectionName without storage is provided', async () => {
    const response = await agent.resource('vditor').check({
      fileCollectionName: 'file-collection-default',
    });

    expect(response.status).toBe(200);
    expect(response.body.data.isSupportToUploadFiles).toBe(true);
    expect(response.body.data.storage).toMatchInlineSnapshot(`
      {
        "id": 1,
        "name": "default-storage",
        "rules": {},
        "title": null,
        "type": "local",
      }
    `);
  });

  it('should return s3 storage and not support upload when s3 collection without baseUrl is provided', async () => {
    const response = await agent.resource('vditor').check({
      fileCollectionName: 'file-collection-s3',
    });

    expect(response.status).toBe(200);
    expect(response.body.data.isSupportToUploadFiles).toBe(false);
    expect(response.body.data.storage).toMatchInlineSnapshot(`
      {
        "id": 2,
        "name": "s3-storage",
        "rules": {},
        "title": null,
        "type": "s3-compatible",
      }
    `);
  });

  it('should return s3 storage and support upload when s3 collection with baseUrl is provided', async () => {
    const response = await agent.resource('vditor').check({
      fileCollectionName: 'file-collection-s3-with-baseurl',
    });

    expect(response.status).toBe(200);
    expect(response.body.data.isSupportToUploadFiles).toBe(true);
    expect(response.body.data.storage).toMatchInlineSnapshot(`
      {
        "id": 3,
        "name": "s3-storage-with-baseurl",
        "rules": {},
        "title": null,
        "type": "s3-compatible",
      }
    `);
  });

  it('should handle non-existent fileCollectionName gracefully', async () => {
    const response = await agent.resource('vditor').check({
      fileCollectionName: 'non-existent-collection',
    });

    expect(response.status).toBe(200);
    expect(response.body.data.isSupportToUploadFiles).toBe(true);
    expect(response.body.data.storage).toMatchInlineSnapshot(`
      {
        "id": 1,
        "name": "default-storage",
        "rules": {},
        "title": null,
        "type": "local",
      }
    `);
  });

  it('should handle s3 storage with baseUrl but not public attribute', async () => {
    // 创建测试所需的非公开 s3 存储
    await db.getRepository('storages').create({
      values: {
        name: 's3-storage-with-baseurl-not-public',
        type: 's3-compatible',
        default: false,
        options: {
          baseUrl: 'https://example.com',
          public: false,
        },
      },
    });

    // 创建关联的文件集合
    await db.collection({
      name: 'file-collection-s3-baseurl-not-public',
      fields: [
        {
          type: 'string',
          name: 'title',
        },
      ],
      storage: 's3-storage-with-baseurl-not-public',
    });

    await db.sync();

    const response = await agent.resource('vditor').check({
      fileCollectionName: 'file-collection-s3-baseurl-not-public',
    });

    expect(response.status).toBe(200);
    expect(response.body.data.isSupportToUploadFiles).toBe(false);
    expect(response.body.data.storage).toMatchInlineSnapshot(`
      {
        "id": 4,
        "name": "s3-storage-with-baseurl-not-public",
        "rules": {},
        "title": null,
        "type": "s3-compatible",
      }
    `);
  });

  it('should handle non-s3 storage types correctly', async () => {
    // 创建一个非 s3 类型的存储
    await db.getRepository('storages').create({
      values: {
        name: 'other-storage-type',
        type: 'oss',
        default: false,
      },
    });

    // 创建关联的文件集合
    await db.collection({
      name: 'file-collection-oss',
      fields: [
        {
          type: 'string',
          name: 'title',
        },
      ],
      storage: 'other-storage-type',
    });

    await db.sync();

    const response = await agent.resource('vditor').check({
      fileCollectionName: 'file-collection-oss',
    });

    expect(response.status).toBe(200);
    expect(response.body.data.isSupportToUploadFiles).toBe(true);
    expect(response.body.data.storage).toMatchInlineSnapshot(`
      {
        "id": 4,
        "name": "other-storage-type",
        "rules": {},
        "title": null,
        "type": "oss",
      }
    `);
  });
});
