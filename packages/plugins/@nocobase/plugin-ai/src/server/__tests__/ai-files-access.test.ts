/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockServer, MockServer } from '@nocobase/test';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('aiFiles access', () => {
  let app: MockServer;

  beforeAll(async () => {
    app = await createMockServer({
      registerActions: true,
      acl: true,
      plugins: ['nocobase'],
    });
    await app.pm.enable('ai');
  });

  afterAll(async () => {
    await app.db.clean({ drop: true });
    await app.destroy();
  });

  it('allows logged-in users to get only their own files', async () => {
    const users = app.db.getRepository('users');
    const owner = await users.create({
      values: {
        nickname: 'AI file owner',
        username: 'ai-file-owner',
        email: 'ai-file-owner@example.com',
      },
    });
    const otherUser = await users.create({
      values: {
        nickname: 'Other user',
        username: 'ai-file-other',
        email: 'ai-file-other@example.com',
      },
    });
    const ownerAgent = await app.agent().login(owner.id);
    const createResponse = await ownerAgent.resource('aiFiles').create({
      values: {
        title: 'preview',
        filename: 'preview.png',
        mimetype: 'image/png',
      },
    });
    const fileId = createResponse.body.data.id;

    const ownerResponse = await ownerAgent.resource('aiFiles').get({
      filterByTk: fileId,
    });

    expect(ownerResponse.statusCode).toBe(200);
    expect(ownerResponse.body.data).toMatchObject({
      id: fileId,
      filename: 'preview.png',
    });

    const otherAgent = await app.agent().login(otherUser.id);
    const otherResponse = await otherAgent.resource('aiFiles').get({
      filterByTk: fileId,
    });

    expect(otherResponse.statusCode).toBe(200);
    expect(otherResponse.body.data).toBeNull();
  });
});
