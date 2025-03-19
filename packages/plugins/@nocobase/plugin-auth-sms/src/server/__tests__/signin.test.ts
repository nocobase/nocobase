/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Database, Model, ModelStatic } from '@nocobase/database';
import VerificationPlugin from '@nocobase/plugin-verification';
import { createMockServer, MockServer } from '@nocobase/test';
import { authType } from '../../constants';

class Provider {
  constructor(
    protected plugin: VerificationPlugin,
    protected options,
  ) {}

  async send(receiver: string, data: { [key: string]: any }): Promise<any> {}
}

describe('signin', () => {
  let app: MockServer;
  let db: Database;
  let verificationModel: ModelStatic<Model>;
  let authenticator: Model;
  let agent;

  beforeAll(async () => {
    app = await createMockServer({
      plugins: ['field-sort', 'users', 'auth', 'verification', 'acl', 'auth-sms', 'data-source-manager'],
    });
    db = app.db;
    agent = app.agent();

    const verificationPlugin: VerificationPlugin = app.getPlugin('verification');
    verificationPlugin.providers.register('fake', Provider as any);
    const VerificationProviderRepo = db.getRepository('verifications_providers');
    await VerificationProviderRepo.create({
      values: {
        id: 'fake1',
        type: 'fake',
        default: true,
      },
    });
    verificationModel = db.getCollection('verifications').model;

    const authenticatorRepo = db.getRepository('authenticators');
    authenticator = await authenticatorRepo.create({
      values: {
        name: 'sms-auth',
        authType: authType,
        enabled: 1,
      },
    });
  });

  afterAll(async () => {
    await app.destroy();
  });

  it('should create new user and sign in via phone number', async () => {
    let res = await agent.resource('verifications').create({
      values: {
        type: 'auth:signIn',
        phone: '1',
      },
    });
    const verification = await verificationModel.findByPk(res.body.data.id);
    res = await agent.set({ 'X-Authenticator': 'sms-auth' }).post('/auth:signIn').send({
      phone: '1',
      code: verification.content,
    });
    expect(res.statusCode).toBe(401);

    await db.getCollection('verifications').repository.update({
      filter: {
        id: verification.id,
      },
      values: {
        status: 0,
      },
    });
    const repo = db.getRepository('authenticators');
    await repo.update({
      filter: {
        name: 'sms-auth',
      },
      values: {
        options: {
          public: {
            autoSignup: true,
          },
        },
      },
    });
    res = await agent.set({ 'X-Authenticator': 'sms-auth' }).post('/auth:signIn').send({
      phone: '1',
      code: verification.content,
    });
    expect(res.statusCode).toBe(200);
    const data = res.body.data;
    const token = data.token;
    expect(token).toBeDefined();
    expect(res.body.data.user).toBeDefined();
    expect(res.body.data.user.nickname).toEqual('1');
  });

  it('should sign in via phone number', async () => {
    const phone = '2';
    await authenticator.createUser(
      {
        nickname: phone,
        phone: phone,
      },
      {
        through: {
          uuid: phone,
        },
      },
    );
    let res = await agent.resource('verifications').create({
      values: {
        type: 'auth:signIn',
        phone: '2',
      },
    });
    const verification = await verificationModel.findByPk(res.body.data.id);
    res = await agent.post('/auth:signIn').set({ 'X-Authenticator': 'sms-auth' }).send({
      phone: '2',
      code: verification.content,
    });
    expect(res.statusCode).toEqual(200);
    const data = res.body.data;
    const token = data.token;
    expect(token).toBeDefined();
    expect(res.body.data.user).toBeDefined();
    expect(res.body.data.user.nickname).toBe('2');
  });

  it('should sign in via phone number with history data', async () => {
    const phone = '3';
    const userRepo = db.getRepository('users');
    const user = await userRepo.create({
      values: {
        nickname: phone,
        phone: phone,
      },
    });
    let res = await agent.resource('verifications').create({
      values: {
        type: 'auth:signIn',
        phone: '3',
      },
    });
    const verification = await verificationModel.findByPk(res.body.data.id);
    res = await agent.post('/auth:signIn').set({ 'X-Authenticator': 'sms-auth' }).send({
      phone: '3',
      code: verification.content,
    });
    expect(res.statusCode).toEqual(200);
    const data = res.body.data;
    const token = data.token;
    expect(token).toBeDefined();
    expect(res.body.data.user).toBeDefined();
    expect(res.body.data.user.id).toBe(user.id);
    expect(res.body.data.user.nickname).toBe('3');
  });
});
