/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockServer, MockServer } from '@nocobase/test/server';
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
    expect(token).toMatch(/^[A-Za-z0-9_-]{51}$/);
    const peer = {
      name: app.name,
      authManager: { jwt: { getSecret: () => app.authManager.jwt.getSecret() } },
    } as MockServer;
    const now = Date.now();
    vi.spyOn(Date, 'now').mockReturnValue(now);
    const peerToken = signDownloadToken(peer, fileName);
    expect(Buffer.from(peerToken, 'base64url').readUIntBE(0, 6)).toBe(now + 30_000);
    vi.restoreAllMocks();
    vi.spyOn(BackupManager.prototype, 'createReadStream').mockImplementation(async () =>
      Readable.from('backup content'),
    );
    for (const hash of [token, peerToken]) {
      const response = await app.agent().get(url).query({ filterByTk: fileName, hash });
      expect(response.status).toBe(200);
      expect(response.headers['content-disposition']).toContain(fileName);
      expect(response.headers['cache-control']).toBe('private, no-store');
    }
    await expect(app.authManager.jwt.decode(token)).rejects.toThrow();
  });

  it('requires download permission to issue tokens and rejects reuse for other actions', async () => {
    expect((await app.agent().post(url).query({ filterByTk: fileName })).status).not.toBe(200);
    const user = await app.db.getRepository('users').create({ values: { roles: ['member'] } });
    const agent = await app.agent().login(user);
    expect((await agent.post(url).query({ filterByTk: fileName })).status).toBe(403);
    expect((await app.agent().get('/backups:list').query({ hash: token })).status).not.toBe(200);
    expect((await app.agent().post(url).query({ filterByTk: fileName, hash: token })).status).toBe(405);
  });

  it('rejects expired, tampered, cross-file and cross-app tokens', async () => {
    const now = Date.now();
    vi.spyOn(Date, 'now').mockReturnValue(now - 31000);
    const expired = signDownloadToken(app, fileName);
    vi.restoreAllMocks();
    const otherApp = { name: 'other-app', authManager: app.authManager } as MockServer;
    const otherToken = signDownloadToken(otherApp, fileName);
    const extended = Buffer.from(token, 'base64url');
    extended.writeUIntBE(now + 60_000, 0, 6);
    for (const params of [
      { filterByTk: fileName, hash: expired },
      { filterByTk: fileName, hash: token + 'invalid' },
      { filterByTk: fileName, hash: extended.toString('base64url') },
      { filterByTk: fileName, hash: token.slice(0, 10) + (token[10] === 'A' ? 'B' : 'A') + token.slice(11) },
      { filterByTk: 'other.nbdata', hash: token },
      { filterByTk: fileName, hash: otherToken },
    ]) {
      expect((await app.agent().get(url).query(params)).status).toBe(401);
    }
  });
});
