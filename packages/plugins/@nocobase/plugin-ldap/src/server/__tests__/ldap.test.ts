/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database } from '@nocobase/database';
import { AppSupervisor } from '@nocobase/server';
import { type MockServer, createMockServer } from '@nocobase/test';
import { vi } from 'vitest';
import { authType } from '../../constants';
import { LDAPAuth } from '../ldap-auth';

describe('ldap', () => {
  let app: MockServer;
  let db: Database;
  let agent;
  let authenticator;

  beforeAll(async () => {
    app = await createMockServer({
      plugins: ['user', 'auth', 'ldap'],
    });
    agent = app.agent();
    db = app.db;

    const authenticatorRepo = db.getRepository('authenticators');
    authenticator = await authenticatorRepo.create({
      values: {
        name: 'ldap-auth',
        authType: authType,
        enabled: 1,
        options: {
          oidc: {
            issuer: '',
            clientId: '',
            clientSecret: '',
          },
        },
      },
    });
  });

  afterAll(async () => {
    await app.destroy();
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await db.getRepository('users').destroy({
      truncate: true,
    });
  });

  it('should get auth url', async () => {
    const res = await agent.set('Authenticator', 'ldap-auth').resource('ldap').getAuthUrl();
    console.log('res::', res);
  });
});
