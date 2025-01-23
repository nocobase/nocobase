/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MockServer, createMockServer } from '@nocobase/test';
import PluginVerficationServer from '../../Plugin';
import { VerificationManager } from '../../verification-manager';

describe('verify', async () => {
  let app: MockServer;
  let manager: VerificationManager;
  let agent: any;

  beforeEach(async () => {
    app = await createMockServer({
      plugins: ['verification'],
    });
    agent = app.agent();
    app.resourceManager.define({
      name: 'test',
      actions: {
        verify: async (ctx, next) => {
          ctx.body = {};
          await next();
        },
      },
    });
    const plugin = app.pm.get('verification') as PluginVerficationServer;
    manager = plugin.verificationManager;
  });

  afterEach(async () => {
    await app.db.clean({ drop: true });
    await app.destroy();
  });

  it('should create sms otp record', async () => {
    manager.registerAction('test:verify', {
      getBoundInfoFromCtx: async (ctx) => ctx.action.params.values || {},
    });
    await app.db.getRepository('verificators').create({
      values: {
        name: 'test',
        title: 'Test',
        verificationType: 'sms-otp',
        options: {
          provider: 'sms-aliyun',
          settings: {},
        },
      },
    });
    const res = await agent.resource('smsOTP').create({
      values: {
        verificator: 'test',
        uuid: '13888888888',
        action: 'test:verify',
      },
    });
    expect(res.status).toBe(200);
    const record = await app.db.getRepository('otpRecords').findOne({
      filter: {
        action: 'test:verify',
        receiver: '13888888888',
        verificatorName: 'test',
      },
    });
    expect(record).toBeTruthy();
  });

  it('rate limit', async () => {
    manager.registerAction('test:verify', {
      getBoundInfoFromCtx: async (ctx) => ctx.action.params.values || {},
    });
    await app.db.getRepository('verificators').create({
      values: {
        name: 'test',
        title: 'Test',
        verificationType: 'sms-otp',
        options: {
          provider: 'sms-aliyun',
          settings: {},
        },
      },
    });
    const res = await agent.resource('smsOTP').create({
      values: {
        verificator: 'test',
        uuid: '13888888888',
        action: 'test:verify',
      },
    });
    expect(res.status).toBe(200);
    const res1 = await agent.resource('smsOTP').create({
      values: {
        verificator: 'test',
        uuid: '13888888888',
        action: 'test:verify',
      },
    });
    expect(res1.status).toBe(429);
  });

  it('verify failed', async () => {
    manager.registerAction('test:verify', {
      getBoundInfoFromCtx: async (ctx) => ctx.action.params.values || {},
    });
    await app.db.getRepository('verificators').create({
      values: {
        name: 'test',
        title: 'Test',
        verificationType: 'sms-otp',
        options: {
          provider: 'sms-aliyun',
          settings: {},
        },
      },
    });
    const res = await agent.resource('smsOTP').create({
      values: {
        verificator: 'test',
        uuid: '13888888888',
        action: 'test:verify',
      },
    });
    expect(res.status).toBe(200);
    await app.db.getRepository('otpRecords').findOne({
      filter: {
        action: 'test:verify',
        receiver: '13888888888',
        verificatorName: 'test',
      },
    });
    const res1 = await agent.resource('test').verify({
      values: {
        verificator: 'test',
        uuid: '13888888888',
      },
    });
    expect(res1.status).toBe(400);
    expect(res1.error.text).toBe('Verification code is invalid');
    const res2 = await agent.resource('test').verify({
      values: {
        verificator: 'test',
        uuid: '13888888888',
        code: '123456',
      },
    });
    expect(res2.status).toBe(400);
    expect(res2.error.text).toBe('Verification code is invalid');
  });

  it('verify', async () => {
    manager.registerAction('test:verify', {
      getBoundInfoFromCtx: async (ctx) => ctx.action.params.values || {},
    });
    await app.db.getRepository('verificators').create({
      values: {
        name: 'test',
        title: 'Test',
        verificationType: 'sms-otp',
        options: {
          provider: 'sms-aliyun',
          settings: {},
        },
      },
    });
    const res = await agent.resource('smsOTP').create({
      values: {
        verificator: 'test',
        uuid: '13888888888',
        action: 'test:verify',
      },
    });
    expect(res.status).toBe(200);
    const record = await app.db.getRepository('otpRecords').findOne({
      filter: {
        action: 'test:verify',
        receiver: '13888888888',
        verificatorName: 'test',
      },
    });
    expect(record.status).toBe(0);
    const res1 = await agent.resource('test').verify({
      values: {
        verificator: 'test',
        uuid: '13888888888',
        code: record.code,
      },
    });
    expect(res1.status).toBe(200);
    const record2 = await app.db.getRepository('otpRecords').findOne({
      filter: {
        action: 'test:verify',
        receiver: '13888888888',
        verificatorName: 'test',
      },
    });
    expect(record2.status).toBe(1);
  });

  it('verify expire', async () => {
    manager.registerAction('test:verify', {
      getBoundInfoFromCtx: async (ctx) => ctx.action.params.values || {},
    });
    await app.db.getRepository('verificators').create({
      values: {
        name: 'test',
        title: 'Test',
        verificationType: 'sms-otp',
        options: {
          provider: 'sms-aliyun',
          settings: {},
        },
      },
    });
    const res = await agent.resource('smsOTP').create({
      values: {
        verificator: 'test',
        uuid: '13888888888',
        action: 'test:verify',
      },
    });
    expect(res.status).toBe(200);
    const record = await app.db.getRepository('otpRecords').findOne({
      filter: {
        action: 'test:verify',
        receiver: '13888888888',
        verificatorName: 'test',
      },
    });
    await record.update({
      expiresAt: new Date(),
    });
    const res1 = await agent.resource('test').verify({
      values: {
        verificator: 'test',
        uuid: '13888888888',
        code: record.code,
      },
    });
    expect(res1.status).toBe(400);
    expect(res1.error.text).toBe('Verification code is invalid');
  });
});
