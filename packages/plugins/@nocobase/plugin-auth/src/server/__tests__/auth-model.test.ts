/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MockServer, createMockServer } from '@nocobase/test';
import { AuthModel } from '../model/authenticator';
import { Database, Repository } from '@nocobase/database';

describe('AuthModel', () => {
  let app: MockServer;
  let db: Database;
  let repo: Repository;

  beforeEach(async () => {
    app = await createMockServer({
      plugins: ['field-sort', 'auth', 'users'],
    });
    db = app.db;
    repo = db.getRepository('authenticators');
  });

  afterEach(async () => {
    await app.db.clean({ drop: true });
    await app.destroy();
  });

  it('should new user', async () => {
    const emitSpy = vi.spyOn(db, 'emitAsync');
    const authenticator = (await repo.create({
      values: {
        name: 'test',
        authType: 'testType',
      },
    })) as AuthModel;
    const user = await authenticator.newUser('uuid1', {
      username: 'test',
    });
    expect(emitSpy).toHaveBeenCalledWith('users.afterCreateWithAssociations', user, expect.any(Object));
    const res = await repo.findOne({
      filterByTk: authenticator.id,
      appends: ['users'],
    });
    expect(res.users.length).toBe(1);
    expect(res.users[0].username).toBe('test');
  });

  it('should new user without userValues', async () => {
    const authenticator = (await repo.create({
      values: {
        name: 'test',
        authType: 'testType',
      },
    })) as AuthModel;
    await authenticator.newUser('uuid1');
    const res = await repo.findOne({
      filterByTk: authenticator.id,
      appends: ['users'],
    });
    expect(res.users.length).toBe(1);
    expect(res.users[0].nickname).toBe('uuid1');
  });

  it('should find user', async () => {
    const authenticator = (await repo.create({
      values: {
        name: 'test',
        authType: 'testType',
      },
    })) as AuthModel;
    const user = await authenticator.newUser('uuid1', {
      username: 'test',
    });
    const res = await authenticator.findUser('uuid1');
    expect(res).toBeDefined();
    expect(res.id).toBe(user.id);
  });

  it('should find or create user', async () => {
    const authenticator = (await repo.create({
      values: {
        name: 'test',
        authType: 'testType',
      },
    })) as AuthModel;
    // find user
    let user1 = await authenticator.findUser('uuid1');
    expect(user1).toBeUndefined();
    user1 = await authenticator.newUser('uuid1', {
      username: 'test',
    });
    const res1 = await authenticator.findOrCreateUser('uuid1', {
      username: 'test1',
    });
    expect(res1).toBeDefined();
    expect(res1.username).toBe('test');
    expect(res1.id).toBe(user1.id);

    // create user
    let user2 = await authenticator.findUser('uuid2');
    expect(user2).toBeUndefined();
    user2 = await authenticator.findOrCreateUser('uuid2', {
      username: 'test2',
    });
    const res2 = await authenticator.findUser('uuid2');
    expect(res2).toBeDefined();
    expect(res2.username).toBe('test2');
    expect(res2.id).toBe(user2.id);
  });
});
