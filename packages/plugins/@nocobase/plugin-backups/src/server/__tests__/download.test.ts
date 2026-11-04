/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockServer, MockServer } from '@nocobase/test/server';
import jwt from 'jsonwebtoken';
import { Readable } from 'stream';
import { signDownloadToken } from '../download-token';
import { BackupManager } from '../managers/backup';

describe('backup download tokens', () => {
  let app: MockServer;
  let token: string;
  const fileName = 'test.nbdata';
  const url = '/backups:download';

  beforeAll(async () => {
    app = await createMockServer({
      acl: true,
      plugins: [
        'backups',
        'file-manager',
        'error-handler',
        'auth',
        'acl',
        'users',
        'field-sort',
        'data-source-main',
        'data-source-manager',
        'ui-schema-storage',
        'collection-tree',
        'system-settings',
      ],
    });
    const user = await app.db.getRepository('users').create({ values: { roles: ['admin'] } });
    const agent = await app.agent().login(user);
    const response = await agent.post(url).query({ filterByTk: fileName });
    expect(response.status).toBe(200);
    token = response.body.data.token;
  });

  afterAll(async () => {
    await app?.destroy();
  });

  afterEach(() => vi.restoreAllMocks());

  it('issues a 30-second token and streams without a session', async () => {
    const payload = jwt.decode(token) as jwt.JwtPayload;
    expect(payload.exp - payload.iat).toBe(30);
    vi.spyOn(BackupManager.prototype, 'createReadStream').mockResolvedValue(Readable.from('backup content'));
    const response = await app.agent().get(url).query({ filterByTk: fileName, downloadToken: token });
    expect(response.status).toBe(200);
    expect(response.headers['content-disposition']).toContain(fileName);
    expect(response.headers['cache-control']).toBe('private, no-store');
    await expect(app.authManager.jwt.decode(token)).rejects.toThrow();
  });

  it('requires download permission to issue tokens and rejects reuse for other actions', async () => {
    expect((await app.agent().post(url).query({ filterByTk: fileName })).status).not.toBe(200);
    const user = await app.db.getRepository('users').create({ values: { roles: ['member'] } });
    const agent = await app.agent().login(user);
    expect((await agent.post(url).query({ filterByTk: fileName })).status).toBe(403);
    expect((await app.agent().get('/backups:list').query({ downloadToken: token })).status).not.toBe(200);
    expect((await app.agent().post(url).query({ filterByTk: fileName, downloadToken: token })).status).toBe(405);
  });

  it('rejects expired, tampered, cross-file and cross-app tokens', async () => {
    const now = Date.now();
    vi.spyOn(Date, 'now').mockReturnValue(now - 31000);
    const expired = signDownloadToken(app, fileName);
    vi.restoreAllMocks();
    const otherApp = { name: 'other-app', authManager: app.authManager } as MockServer;
    const otherToken = signDownloadToken(otherApp, fileName);
    for (const params of [
      { filterByTk: fileName, downloadToken: expired },
      { filterByTk: fileName, downloadToken: token + 'invalid' },
      { filterByTk: 'other.nbdata', downloadToken: token },
      { filterByTk: fileName, downloadToken: otherToken },
    ]) {
      expect((await app.agent().get(url).query(params)).status).toBe(401);
    }
  });
});
