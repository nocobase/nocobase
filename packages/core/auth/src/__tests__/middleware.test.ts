/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Database } from '@nocobase/database';
import { MockServer, createMockServer } from '@nocobase/test';
import { vi } from 'vitest';

describe('middleware', () => {
  let app: MockServer;
  let db: Database;
  let agent;

  beforeEach(async () => {
    app = await createMockServer({
      registerActions: true,
      acl: true,
      plugins: ['users', 'auth', 'acl', 'field-sort', 'data-source-manager'],
    });

    // app.plugin(ApiKeysPlugin);
    db = app.db;
    agent = app.agent();
  });

  afterEach(async () => {
    await app.destroy();
  });

  describe('blacklist', () => {
    const hasFn = vi.fn();
    const addFn = vi.fn();
    beforeEach(async () => {
      await agent.login(1);
      app.authManager.setTokenBlacklistService({
        has: hasFn,
        add: addFn,
      });
    });

    afterEach(() => {
      hasFn.mockReset();
      addFn.mockReset();
    });

    it('basic', async () => {
      const res = await agent.resource('auth').check();
      const token = res.request.header['Authorization'].replace('Bearer ', '');
      expect(res.status).toBe(200);
      expect(hasFn).toHaveBeenCalledWith(token);
    });

    it('signOut should add token to blacklist', async () => {
      // signOut will add token
      const res = await agent.resource('auth').signOut();
      const token = res.request.header['Authorization'].replace('Bearer ', '');
      expect(addFn).toHaveBeenCalledWith({
        token,
        // Date or String is ok
        expiration: expect.any(String),
      });
    });

    it('should throw 401 when token in blacklist', async () => {
      hasFn.mockImplementation(() => true);
      const res = await agent.resource('auth').check();
      expect(res.status).toBe(401);
      expect(res.text).toContain('Token is invalid');
    });
  });
});
